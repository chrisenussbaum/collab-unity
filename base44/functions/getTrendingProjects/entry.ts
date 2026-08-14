import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Trending = most active projects over the trailing 7 days.
// Scored purely on recent collaborator activity (tasks, milestones, canvas
// work, project chat, comments, feed posts, applauds). Projects with no
// recent activity never appear, so a dormant project can't stay "trending".
// Because the window is 7 days, the ranking naturally refreshes weekly as
// old activity ages out and new activity comes in.

const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projects = await base44.asServiceRole.entities.Project.list('-updated_date', 100);
    const visibleProjects = (projects || []).filter(p => p.is_archived !== true);

    if (visibleProjects.length === 0) {
      return Response.json({ trendingProjects: [] });
    }

    const projectIdSet = new Set(visibleProjects.map(p => p.id));

    // Pull recent activity sources (newest first). We only care about the
    // trailing week, so a few hundred newest records per source is plenty.
    const [tasks, milestones, annotations, chatMessages, comments, feedPosts, applauds] = await Promise.all([
      base44.asServiceRole.entities.Task.list('-created_date', 300),
      base44.asServiceRole.entities.ProjectMilestone.list('-created_date', 200),
      base44.asServiceRole.entities.CanvasAnnotation.list('-created_date', 200),
      base44.asServiceRole.entities.ProjectChatMessage.list('-created_date', 200),
      base44.asServiceRole.entities.Comment.list('-created_date', 300),
      base44.asServiceRole.entities.FeedPost.list('-created_date', 200),
      base44.asServiceRole.entities.ProjectApplaud.list('-created_date', 200)
    ]);

    const now = Date.now();
    const scoreMap = {};
    const lastActivityMap = {};

    for (const p of visibleProjects) {
      scoreMap[p.id] = 0;
      lastActivityMap[p.id] = 0;
    }

    // Recency boost: events closer to "now" weigh a little more, so within
    // the same 7-day window the most recently active projects edge ahead.
    const recencyBoost = (ts) => {
      const ageDays = (now - ts) / (24 * 60 * 60 * 1000);
      return 1 + Math.max(0, 1 - ageDays / WINDOW_DAYS) * 0.3;
    };

    const addScore = (projectId, ts, weight) => {
      if (!projectIdSet.has(projectId)) return;
      if (now - ts > WINDOW_MS) return; // outside the trailing week — ignore
      scoreMap[projectId] += weight * recencyBoost(ts);
      if (ts > lastActivityMap[projectId]) lastActivityMap[projectId] = ts;
    };

    const tsOf = (d) => (d ? new Date(d).getTime() : 0);

    // Tasks: created or updated within the week. Completion is a strong signal.
    for (const t of (tasks || [])) {
      const created = tsOf(t.created_date);
      const updated = tsOf(t.updated_date);
      const latest = Math.max(created, updated);
      addScore(t.project_id, latest, 3);
      if (t.status === 'done' && updated > 0 && now - updated < WINDOW_MS) {
        addScore(t.project_id, updated, 3); // completion bonus
      }
    }

    // Milestones: created or updated within the week.
    for (const m of (milestones || [])) {
      const created = tsOf(m.created_date);
      const updated = tsOf(m.updated_date);
      const latest = Math.max(created, updated);
      addScore(m.project_id, latest, 4);
      if (m.status === 'completed' && updated > 0 && now - updated < WINDOW_MS) {
        addScore(m.project_id, updated, 3);
      }
    }

    // Canvas annotations: collaborator work on the project canvas.
    for (const a of (annotations || [])) {
      addScore(a.project_id, tsOf(a.created_date), 3);
    }

    // Project chat: collaboration chatter (only real user messages count).
    for (const c of (chatMessages || [])) {
      if (c.role !== 'user') continue;
      addScore(c.project_id, tsOf(c.created_date), 2);
    }

    // Comments on the project.
    for (const c of (comments || [])) {
      addScore(c.project_id, tsOf(c.created_date), 1);
    }

    // Feed posts linked to the project.
    for (const f of (feedPosts || [])) {
      if (!f.related_project_id) continue;
      addScore(f.related_project_id, tsOf(f.created_date), 2);
    }

    // Applauds (community engagement).
    for (const a of (applauds || [])) {
      addScore(a.project_id, tsOf(a.created_date), 2);
    }

    // Baseline: a project touched at all this week (its own updated_date) counts.
    for (const p of visibleProjects) {
      addScore(p.id, tsOf(p.updated_date), 1);
    }

    const trendingProjects = visibleProjects
      .map(p => {
        const collaborators = p.current_collaborators_count || 0;
        const score = scoreMap[p.id] || 0;
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          logo_url: p.logo_url,
          classification: p.classification,
          status: p.status,
          area_of_interest: p.area_of_interest,
          collaborators,
          trendingScore: score,
          lastActivity: lastActivityMap[p.id] || 0
        };
      })
      .filter(p => p.trendingScore > 0)
      .sort((a, b) =>
        b.trendingScore - a.trendingScore ||
        b.lastActivity - a.lastActivity ||
        (b.collaborators || 0) - (a.collaborators || 0)
      )
      .slice(0, 5);

    return Response.json({ trendingProjects });
  } catch (error) {
    console.error('Error in getTrendingProjects:', error);
    return Response.json({ error: error.message, trendingProjects: [] }, { status: 500 });
  }
});