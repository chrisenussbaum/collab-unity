import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Accountability Nudges
 * 
 * Scans all projects for items that need attention and sends notifications:
 * 1. Overdue tasks (past due_date, not done) → nudge assignee + project owner
 * 2. Unassigned high/urgent tasks → nudge project owner
 * 3. Overdue milestones (past target_date, not completed) → nudge project owner
 * 
 * Dedup: skips any item that already got a notification of the same type
 * for the same entity within the last 24 hours.
 * 
 * Designed to run daily via a scheduled automation.
 */

const NUDGE_WINDOW_HOURS = 24;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    let notificationsSent = 0;
    const stats = { overdue_tasks: 0, unassigned_tasks: 0, overdue_milestones: 0 };

    // ── Fetch all tasks and milestones (service role for full visibility) ──
    const allTasks = await base44.asServiceRole.entities.Task.list();
    const activeTasks = allTasks.filter((t) => t.status !== 'done');

    const overdueTasks = activeTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now
    );

    const unassignedUrgent = activeTasks.filter(
      (t) => !t.assigned_to && (t.priority === 'high' || t.priority === 'urgent')
    );

    const allMilestones = await base44.asServiceRole.entities.ProjectMilestone.list();
    const overdueMilestones = allMilestones.filter(
      (m) => m.status !== 'completed' && m.target_date && new Date(m.target_date) < now
    );

    // ── Collect unique project IDs and fetch projects ──
    const projectIds = new Set();
    [...overdueTasks, ...unassignedUrgent].forEach((t) => {
      if (t.project_id) projectIds.add(t.project_id);
    });
    overdueMilestones.forEach((m) => {
      if (m.project_id) projectIds.add(m.project_id);
    });

    const projectsMap = {};
    for (const id of projectIds) {
      const projects = await base44.asServiceRole.entities.Project.filter({ id });
      if (projects.length > 0) projectsMap[id] = projects[0];
    }

    // ── Look up project owner emails (created_by_id → email) ──
    const ownerIds = [
      ...new Set(
        Object.values(projectsMap)
          .map((p) => p.created_by_id)
          .filter(Boolean)
      ),
    ];
    const ownerEmailMap = {};
    for (const userId of ownerIds) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length > 0) ownerEmailMap[userId] = users[0].email;
      } catch (_) {
        // skip if user lookup fails
      }
    }

    // ── Dedup helper: was a notification of this type sent for this entity recently? ──
    const wasRecentlyNudged = async (type, entityId) => {
      const existing = await base44.asServiceRole.entities.Notification.filter({
        type,
        related_entity_id: entityId,
      });
      return existing.some((n) => {
        if (!n.created_date) return false;
        const hoursSince = (now - new Date(n.created_date)) / (1000 * 60 * 60);
        return hoursSince < NUDGE_WINDOW_HOURS;
      });
    };

    // ── 1. Overdue task nudges ──
    for (const task of overdueTasks) {
      const project = projectsMap[task.project_id];
      if (!project) continue;

      if (await wasRecentlyNudged('project_task_overdue', task.id)) continue;

      const daysLate = Math.max(
        1,
        Math.floor((now - new Date(task.due_date)) / (1000 * 60 * 60 * 24))
      );
      const ownerEmail = ownerEmailMap[project.created_by_id];

      const recipients = new Set();
      if (task.assigned_to) recipients.add(task.assigned_to);
      if (ownerEmail) recipients.add(ownerEmail);

      for (const email of recipients) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: email,
          title: 'Task overdue',
          message: `The task "${task.title}" in "${project.title}" is ${daysLate} day${daysLate !== 1 ? 's' : ''} overdue.`,
          type: 'project_task_overdue',
          related_project_id: project.id,
          related_entity_id: task.id,
          actor_email: 'system@collabunity.io',
          actor_name: 'Collab Unity',
          metadata: {
            project_title: project.title,
            task_title: task.title,
            task_id: task.id,
            due_date: task.due_date,
            days_late: daysLate,
          },
        });
        notificationsSent++;
      }
      stats.overdue_tasks++;
    }

    // ── 2. Unassigned urgent task nudges (project owner only) ──
    for (const task of unassignedUrgent) {
      const project = projectsMap[task.project_id];
      if (!project) continue;

      const ownerEmail = ownerEmailMap[project.created_by_id];
      if (!ownerEmail) continue;

      if (await wasRecentlyNudged('project_task_unassigned', task.id)) continue;

      await base44.asServiceRole.entities.Notification.create({
        user_email: ownerEmail,
        title: 'Unassigned task needs attention',
        message: `The ${task.priority}-priority task "${task.title}" in "${project.title}" has no assignee yet.`,
        type: 'project_task_unassigned',
        related_project_id: project.id,
        related_entity_id: task.id,
        actor_email: 'system@collabunity.io',
        actor_name: 'Collab Unity',
        metadata: {
          project_title: project.title,
          task_title: task.title,
          task_id: task.id,
          priority: task.priority,
        },
      });
      notificationsSent++;
      stats.unassigned_tasks++;
    }

    // ── 3. Overdue milestone nudges (project owner only) ──
    for (const milestone of overdueMilestones) {
      const project = projectsMap[milestone.project_id];
      if (!project) continue;

      const ownerEmail = ownerEmailMap[project.created_by_id];
      if (!ownerEmail) continue;

      if (await wasRecentlyNudged('project_milestone_overdue', milestone.id)) continue;

      const daysLate = Math.max(
        1,
        Math.floor((now - new Date(milestone.target_date)) / (1000 * 60 * 60 * 24))
      );

      await base44.asServiceRole.entities.Notification.create({
        user_email: ownerEmail,
        title: 'Milestone overdue',
        message: `The milestone "${milestone.title}" in "${project.title}" is ${daysLate} day${daysLate !== 1 ? 's' : ''} past its target date.`,
        type: 'project_milestone_overdue',
        related_project_id: project.id,
        related_entity_id: milestone.id,
        actor_email: 'system@collabunity.io',
        actor_name: 'Collab Unity',
        metadata: {
          project_title: project.title,
          milestone_title: milestone.title,
          milestone_id: milestone.id,
          target_date: milestone.target_date,
          days_late: daysLate,
        },
      });
      notificationsSent++;
      stats.overdue_milestones++;
    }

    return Response.json({
      message: 'Accountability nudges processed',
      ...stats,
      notifications_sent: notificationsSent,
    });
  } catch (error) {
    console.error('Error sending accountability nudges:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});