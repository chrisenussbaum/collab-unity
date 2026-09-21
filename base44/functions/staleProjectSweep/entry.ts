import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { applyAction, levelForPoints, computeNewBadges } from '../../shared/scoring.ts';

/**
 * Project Staleness Sweep — runs daily via a scheduled workflow.
 *
 * For every project:
 *  - Computes last real activity (latest ActivityLog entry, falling back to
 *    project.last_activity_at, then created_date).
 *  - 14+ days inactive → flagged "needs attention" (is_stale).
 *  - 30+ days inactive → owner + collaborators get a stale nudge notification
 *    (deduped to once per week), referencing the first unfinished milestone.
 *  - 45+ days inactive → hidden from the public feed (stale_hidden); the
 *    project stays fully accessible to its owner and collaborators.
 *  - Recent activity → stale flags cleared (revival).
 *
 * Also awards weekly "sustained activity" points to users who worked on a
 * project during the trailing 7 days (once per project per rolling week).
 */

const STALE_DAYS = 14;
const NUDGE_DAYS = 30;
const HIDE_DAYS = 45;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NUDGE_WINDOW_MS = 168 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const result = { projects_scanned: 0, flagged: 0, nudged: 0, hidden: 0, revived: 0, weekly_points_awarded: 0 };

    const projects = await base44.asServiceRole.entities.Project.list();

    for (const project of projects) {
      result.projects_scanned++;

      // Completed projects are never stale — clear any leftover flags.
      if (project.status === 'completed') {
        if (project.is_stale || project.stale_hidden) {
          await base44.asServiceRole.entities.Project.update(project.id, { is_stale: false, stale_hidden: false });
          result.revived++;
        }
        continue;
      }

      // Latest workspace activity from the activity log (newest first)
      let logs = [];
      try {
        logs = await base44.asServiceRole.entities.ActivityLog.filter({ project_id: project.id }, '-created_date', 50);
      } catch (e) {
        logs = [];
      }

      let lastActivity = project.last_activity_at ? new Date(project.last_activity_at) : null;
      if (Array.isArray(logs) && logs.length > 0) {
        const latestLog = new Date(logs[0].created_date);
        if (!lastActivity || latestLog > lastActivity) lastActivity = latestLog;
      }
      if (!lastActivity) lastActivity = project.created_date ? new Date(project.created_date) : now;

      const daysInactive = (now - lastActivity) / (24 * 60 * 60 * 1000);

      // ── Weekly sustained-activity points ──
      if (Array.isArray(logs) && logs.length > 0) {
        const cutoff = now.getTime() - WEEK_MS;
        const activeUsers = [...new Set(
          logs
            .filter(l => l.user_email && new Date(l.created_date).getTime() >= cutoff)
            .map(l => l.user_email)
        )];
        for (const email of activeUsers) {
          try {
            const awarded = await awardWeeklyActivity(base44, email, project.id, now);
            if (awarded) result.weekly_points_awarded++;
          } catch (e) {
            console.warn(`Weekly activity award failed for ${email}:`, e);
          }
        }
      }

      // ── Staleness flags ──
      const shouldStale = daysInactive >= STALE_DAYS;
      const shouldHide = daysInactive >= HIDE_DAYS;
      const updates = {};

      if (lastActivity.toISOString() !== project.last_activity_at) {
        updates.last_activity_at = lastActivity.toISOString();
      }
      if (!!project.is_stale !== shouldStale) updates.is_stale = shouldStale;
      if (!!project.stale_hidden !== shouldHide) updates.stale_hidden = shouldHide;

      if (shouldStale && !project.is_stale) result.flagged++;
      if (shouldHide && !project.stale_hidden) result.hidden++;
      if (!shouldStale && (project.is_stale || project.stale_hidden)) result.revived++;

      // ── Stale nudge (30+ days, once per week) ──
      if (daysInactive >= NUDGE_DAYS) {
        try {
          const nudged = await sendStaleNudge(base44, project, Math.floor(daysInactive), now);
          if (nudged) result.nudged++;
        } catch (e) {
          console.warn(`Stale nudge failed for project ${project.id}:`, e);
        }
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Project.update(project.id, updates);
      }
    }

    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Error running staleness sweep:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function awardWeeklyActivity(base44, email, projectId, now) {
  const statsList = await base44.asServiceRole.entities.UserGameStats.filter({ user_email: email });
  let stats = statsList && statsList[0];
  if (!stats) {
    stats = await base44.asServiceRole.entities.UserGameStats.create({
      user_email: email,
      total_points: 0,
      level: 1,
      badges: [],
      achievements: {},
      activity_streak: 0,
      projects_created: 0,
      projects_collaborated: 0,
      endorsements_given: 0,
      endorsements_received: 0,
      reviews_given: 0,
      reviews_received: 0,
      users_invited: 0
    });
  }

  // Once per project per rolling 7 days
  const awards = (stats.achievements && stats.achievements.weekly_project_awards) || {};
  const lastAward = awards[projectId] ? new Date(awards[projectId]).getTime() : 0;
  if (now.getTime() - lastAward < WEEK_MS) return false;

  const applied = applyAction(stats, 'weekly_project_activity');
  if (!applied) return false;
  const updates = { ...applied.updates };

  const newTotalPoints = (stats.total_points || 0) + applied.pointsToAward;
  updates.total_points = newTotalPoints;
  updates.level = levelForPoints(newTotalPoints);

  const tempStats = { ...stats, ...updates };
  const { badges, unlockedBadges } = computeNewBadges(stats.badges || [], tempStats);
  if (unlockedBadges.length > 0) updates.badges = badges;

  awards[projectId] = now.toISOString();
  updates.achievements = { ...(stats.achievements || {}), weekly_project_awards: awards };

  await base44.asServiceRole.entities.UserGameStats.update(stats.id, updates);
  return true;
}

async function sendStaleNudge(base44, project, daysInactive, now) {
  // Dedup: one stale nudge per project per week
  let existing = [];
  try {
    existing = await base44.asServiceRole.entities.Notification.filter({
      type: 'project_stale_nudge',
      related_entity_id: project.id
    });
  } catch (e) {
    existing = [];
  }
  if (Array.isArray(existing) && existing.some(n => n.created_date && (now - new Date(n.created_date)) < NUDGE_WINDOW_MS)) {
    return false;
  }

  // Reference the first unfinished milestone when one exists
  let milestoneTitle = null;
  try {
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id: project.id }, 'order_index', 10);
    const first = (milestones || []).find(m => m.status !== 'completed');
    if (first) milestoneTitle = first.title;
  } catch (e) {
    // milestone reference is best-effort
  }

  const message = `It's been ${daysInactive} days since "${project.title}" had any activity. Ready to pick it back up?`
    + (milestoneTitle ? ` Your milestone "${milestoneTitle}" is still waiting.` : '');

  const recipients = new Set([project.created_by, ...(project.collaborator_emails || [])].filter(Boolean));
  for (const email of recipients) {
    await base44.asServiceRole.entities.Notification.create({
      user_email: email,
      title: 'Project needs attention',
      message,
      type: 'project_stale_nudge',
      related_project_id: project.id,
      related_entity_id: project.id,
      actor_email: 'system@collabunity.io',
      actor_name: 'Collab Unity',
      metadata: {
        project_title: project.title,
        days_inactive: daysInactive,
        milestone_title: milestoneTitle
      }
    });
  }
  return true;
}