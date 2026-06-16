import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only guard (for manual invocations; automations use service role context)
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    const sr = base44.asServiceRole;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all active projects (not archived, not completed)
    const activeProjects = await sr.entities.Project.filter({ is_archived: false });
    const inProgressProjects = activeProjects.filter(p => p.status !== 'completed');

    if (inProgressProjects.length === 0) {
      return Response.json({ success: true, message: 'No active projects found.' });
    }

    // Fetch recent activity logs (last 7 days) for active projects
    const allActivityLogs = await sr.entities.ActivityLog.list('-created_date', 200);
    const recentLogs = allActivityLogs.filter(log =>
      log.created_date && new Date(log.created_date) >= new Date(sevenDaysAgo) &&
      inProgressProjects.some(p => p.id === log.project_id)
    );

    // Fetch latest published resource articles (blogs)
    const articles = await sr.entities.ResourceArticle.filter({ is_published: true }, '-published_at', 3);

    // Fetch latest learning resources
    const learningResources = await sr.entities.LearningResource.list('-created_date', 3);

    // Build a map of project_id -> recent activity summaries
    const activityByProject = {};
    for (const log of recentLogs) {
      if (!activityByProject[log.project_id]) activityByProject[log.project_id] = [];
      activityByProject[log.project_id].push(log.action_description);
    }

    // Collect unique user emails from collaborators of active projects
    const emailSet = new Set();
    for (const project of inProgressProjects) {
      if (Array.isArray(project.collaborator_emails)) {
        project.collaborator_emails.forEach(e => { if (e) emailSet.add(e); });
      }
    }

    if (emailSet.size === 0) {
      return Response.json({ success: true, message: 'No collaborators found on active projects.' });
    }

    // Build blog section HTML
    const blogSection = articles.length > 0 ? `
      <tr><td style="padding: 24px 32px 8px;">
        <h3 style="margin:0 0 12px; font-size:16px; color:#5B47DB;">📝 Latest from the Blog</h3>
        ${articles.map(a => `
          <div style="margin-bottom:10px; padding:10px 14px; background:#f5f3ff; border-radius:8px;">
            <strong style="font-size:14px; color:#1a1a2e;">${a.title}</strong>
            <p style="margin:4px 0 0; font-size:13px; color:#555;">${a.excerpt || ''}</p>
          </div>
        `).join('')}
      </td></tr>
    ` : '';

    // Build learning resources section HTML
    const learningSection = learningResources.length > 0 ? `
      <tr><td style="padding: 8px 32px 8px;">
        <h3 style="margin:0 0 12px; font-size:16px; color:#5B47DB;">🎓 Learning Hub Picks</h3>
        ${learningResources.map(r => `
          <div style="margin-bottom:8px;">
            <a href="${r.url}" style="font-size:14px; color:#5B47DB; font-weight:600; text-decoration:none;">${r.title}</a>
            <span style="font-size:12px; color:#888; margin-left:8px;">${r.format || ''} · ${r.category || ''}</span>
          </div>
        `).join('')}
      </td></tr>
    ` : '';

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const email of emailSet) {
      // Find projects this user is part of
      const userProjects = inProgressProjects.filter(p =>
        Array.isArray(p.collaborator_emails) && p.collaborator_emails.includes(email)
      );

      // Build project update rows
      const projectRows = userProjects.map(project => {
        const activities = activityByProject[project.id] || [];
        const activityHTML = activities.length > 0
          ? `<ul style="margin:6px 0 0; padding-left:18px; font-size:13px; color:#444;">
              ${activities.slice(0, 5).map(a => `<li style="margin-bottom:3px;">${a}</li>`).join('')}
             </ul>`
          : `<p style="margin:6px 0 0; font-size:13px; color:#888; font-style:italic;">No new activity this week.</p>`;

        const statusColors = {
          seeking_collaborators: '#f59e0b',
          in_progress: '#10b981',
          completed: '#6b7280'
        };
        const statusColor = statusColors[project.status] || '#6b7280';

        return `
          <div style="margin-bottom:16px; padding:14px 16px; background:#fafafa; border-left:3px solid ${statusColor}; border-radius:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:15px; color:#1a1a2e;">${project.title}</strong>
              <span style="font-size:11px; background:${statusColor}20; color:${statusColor}; padding:2px 8px; border-radius:12px; font-weight:600; text-transform:capitalize;">${(project.status || '').replace('_', ' ')}</span>
            </div>
            ${project.description ? `<p style="margin:4px 0 0; font-size:13px; color:#666;">${project.description.substring(0, 120)}${project.description.length > 120 ? '...' : ''}</p>` : ''}
            ${activityHTML}
          </div>
        `;
      }).join('');

      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0; padding:0; background:#f0f0f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f7; padding: 32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr><td style="background: linear-gradient(135deg, #5B47DB 0%, #7C6AE8 100%); padding: 32px; text-align:center;">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                    alt="Collab Unity" width="48" height="48" style="border-radius:12px; margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;" />
                  <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">Your Weekly Collab Unity Summary</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:14px;">Here's what happened on your projects this week</p>
                </td></tr>

                <!-- Projects Section -->
                <tr><td style="padding: 28px 32px 8px;">
                  <h2 style="margin:0 0 16px; font-size:18px; color:#1a1a2e;">🚀 Your Active Projects</h2>
                  ${userProjects.length > 0 ? projectRows : '<p style="color:#888; font-size:14px;">You have no active projects this week. <a href="https://collabunity.io" style="color:#5B47DB;">Start one now →</a></p>'}
                </td></tr>

                ${blogSection}
                ${learningSection}

                <!-- CTA -->
                <tr><td style="padding: 16px 32px 32px; text-align:center;">
                  <a href="https://collabunity.io" style="display:inline-block; background:#5B47DB; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    Go to Collab Unity →
                  </a>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding: 16px 32px; background:#f9f9ff; border-top:1px solid #ede9fe; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#aaa;">You're receiving this because you're an active collaborator on Collab Unity.<br/>© 2025 Collab Unity. All rights reserved.</p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      await sr.integrations.Core.SendEmail({
        to: email,
        subject: `🚀 Your Weekly Collab Unity Update`,
        body: emailBody,
        from_name: 'Collab Unity'
      });

      emailsSent++;
    }

    return Response.json({
      success: true,
      emails_sent: emailsSent,
      emails_skipped: emailsSkipped,
      active_projects: inProgressProjects.length
    });

  } catch (error) {
    console.error('sendWeeklySummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});