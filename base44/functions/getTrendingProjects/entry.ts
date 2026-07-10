import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent visible projects
    const projects = await base44.asServiceRole.entities.Project.list('-updated_date', 100);

    const visibleProjects = (projects || []).filter(p =>
      p.is_visible_on_feed !== false && p.is_archived !== true
    );

    if (visibleProjects.length === 0) {
      return Response.json({ trendingProjects: [] });
    }

    const projectIdSet = new Set(visibleProjects.map(p => p.id));

    // Fetch recent engagement data in parallel
    const [tasks, applauds, feedPosts, comments] = await Promise.all([
      base44.asServiceRole.entities.Task.list('-created_date', 300),
      base44.asServiceRole.entities.ProjectApplaud.list('-created_date', 300),
      base44.asServiceRole.entities.FeedPost.list('-created_date', 200),
      base44.asServiceRole.entities.Comment.list('-created_date', 300)
    ]);

    const engagementMap = {};
    const now = Date.now();
    const RECENT_WINDOW = 14 * 24 * 60 * 60 * 1000; // 14 days

    for (const p of visibleProjects) {
      engagementMap[p.id] = {
        taskCount: 0,
        activeTaskCount: 0,
        applaudCount: 0,
        commentCount: 0,
        feedPostCount: 0,
        recentActivityScore: 0,
        lastActivity: 0
      };
    }

    // Count tasks
    for (const task of (tasks || [])) {
      if (!projectIdSet.has(task.project_id)) continue;
      const e = engagementMap[task.project_id];
      if (!e) continue;
      e.taskCount++;
      if (task.status === 'in_progress') e.activeTaskCount++;
      const d = new Date(task.created_date).getTime();
      if (now - d < RECENT_WINDOW) e.recentActivityScore += 3;
      if (d > e.lastActivity) e.lastActivity = d;
    }

    // Count applauds
    for (const applaud of (applauds || [])) {
      if (!projectIdSet.has(applaud.project_id)) continue;
      const e = engagementMap[applaud.project_id];
      if (!e) continue;
      e.applaudCount++;
      const d = new Date(applaud.created_date).getTime();
      if (now - d < RECENT_WINDOW) e.recentActivityScore += 2;
      if (d > e.lastActivity) e.lastActivity = d;
    }

    // Count feed posts
    for (const post of (feedPosts || [])) {
      if (!post.related_project_id || !projectIdSet.has(post.related_project_id)) continue;
      const e = engagementMap[post.related_project_id];
      if (!e) continue;
      e.feedPostCount++;
      const d = new Date(post.created_date).getTime();
      if (now - d < RECENT_WINDOW) e.recentActivityScore += 2;
      if (d > e.lastActivity) e.lastActivity = d;
    }

    // Count comments
    for (const comment of (comments || [])) {
      if (!projectIdSet.has(comment.project_id)) continue;
      const e = engagementMap[comment.project_id];
      if (!e) continue;
      e.commentCount++;
      const d = new Date(comment.created_date).getTime();
      if (now - d < RECENT_WINDOW) e.recentActivityScore += 1;
      if (d > e.lastActivity) e.lastActivity = d;
    }

    // Compute trending score and return top 5
    const trendingProjects = visibleProjects
      .map(p => {
        const e = engagementMap[p.id];
        const followers = p.followers_count || 0;
        const collaborators = p.current_collaborators_count || 0;

        const score =
          e.activeTaskCount * 3 +
          e.taskCount * 1 +
          e.applaudCount * 2 +
          e.feedPostCount * 2 +
          e.commentCount * 1 +
          collaborators * 2 +
          followers * 0.5 +
          e.recentActivityScore * 1.5;

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          logo_url: p.logo_url,
          classification: p.classification,
          status: p.status,
          area_of_interest: p.area_of_interest,
          engagement: {
            taskCount: e.taskCount,
            activeTaskCount: e.activeTaskCount,
            applaudCount: e.applaudCount,
            commentCount: e.commentCount,
            feedPostCount: e.feedPostCount,
            collaborators,
            followers
          },
          trendingScore: score,
          lastActivity: e.lastActivity
        };
      })
      .filter(p => p.trendingScore > 0)
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5);

    return Response.json({ trendingProjects });
  } catch (error) {
    console.error('Error in getTrendingProjects:', error);
    return Response.json({ error: error.message, trendingProjects: [] }, { status: 500 });
  }
});