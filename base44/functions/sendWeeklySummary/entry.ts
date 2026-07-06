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

    // ── 1. Fetch all users (digest goes to everyone, respecting opt-out) ──
    const allUsers = await sr.entities.User.list('-created_date', 500);
    const eligibleUsers = allUsers.filter(u =>
      u.email &&
      u.has_completed_onboarding &&
      u.notification_preferences?.weekly_digest !== false
    );

    if (eligibleUsers.length === 0) {
      return Response.json({ success: true, message: 'No eligible users for the weekly digest.' });
    }

    // ── 2. Fetch trending projects (visible on feed, not archived) ──
    const visibleProjects = await sr.entities.Project.filter({ is_archived: false, is_visible_on_feed: true });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Recent applauds for trending score
    let recentApplauds = [];
    try {
      const allApplauds = await sr.entities.ProjectApplaud.list('-created_date', 300);
      recentApplauds = allApplauds.filter(a => a.created_date && new Date(a.created_date) >= new Date(sevenDaysAgo));
    } catch (e) {
      console.warn('Could not fetch applauds for trending score:', e.message);
    }

    const applaudsByProject = {};
    for (const a of recentApplauds) {
      applaudsByProject[a.project_id] = (applaudsByProject[a.project_id] || 0) + 1;
    }

    // Score and rank trending projects
    const trendingProjects = visibleProjects
      .map(p => ({
        ...p,
        _trendScore: (p.followers_count || 0) + (p.current_collaborators_count || 0) * 3 + (applaudsByProject[p.id] || 0) * 2
      }))
      .sort((a, b) => b._trendScore - a._trendScore)
      .slice(0, 20);

    // ── 3. Fetch learning resources & blog articles (curated content) ──
    const articles = await sr.entities.ResourceArticle.filter({ is_published: true }, '-published_at', 5);
    const learningResources = await sr.entities.LearningResource.list('-created_date', 5);

    // ── 4. Fetch personalized industry news per unique interest ──
    // Collect unique interests across eligible users (cap to top 5 most common to bound LLM usage)
    const interestCounts = {};
    for (const u of eligibleUsers) {
      const interests = u.interests || u.skills || [];
      interests.slice(0, 3).forEach(i => {
        const key = i?.trim().toLowerCase();
        if (key) interestCounts[key] = (interestCounts[key] || 0) + 1;
      });
    }
    const interestSet = new Set(
      Object.entries(interestCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k)
    );

    const newsByInterest = {};
    const fetchNewsForInterest = async (interest) => {
      try {
        const result = await sr.integrations.Core.InvokeLLM({
          prompt: `Find the top 3 most relevant and recent (this week) industry news stories, trends, or developments for someone interested in "${interest}". For each, provide a concise headline, a 1-2 sentence summary, and a source URL. Focus on real, current news from reputable sources.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              stories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    headline: { type: 'string' },
                    summary: { type: 'string' },
                    url: { type: 'string' }
                  },
                  required: ['headline', 'summary']
                }
              }
            }
          }
        });
        return result?.stories || [];
      } catch (e) {
        console.warn(`Failed to fetch news for interest "${interest}":`, e.message);
        return [];
      }
    };

    const uniqueInterests = [...interestSet];
    console.log(`Fetching news for ${uniqueInterests.length} unique interests...`);
    await Promise.all(uniqueInterests.map(async (interest) => {
      newsByInterest[interest] = await fetchNewsForInterest(interest);
    }));
    console.log('News fetching complete.');

    // ── 5. Helper: pick personalized trending projects for a user ──
    const pickTrendingForUser = (user) => {
      const userInterests = (user.interests || []).map(i => i.toLowerCase());
      const userSkills = (user.skills || []).map(s => s.toLowerCase());
      const userTags = [...userInterests, ...userSkills];

      if (userTags.length === 0) return trendingProjects.slice(0, 3);

      // Score each project by interest/skill overlap
      const scored = trendingProjects.map(p => {
        const projSkills = (p.skills_needed || []).map(s => s.toLowerCase());
        const projArea = (p.area_of_interest || '').toLowerCase();
        const projIndustry = (p.industry || '').toLowerCase();
        let matchScore = 0;
        for (const tag of userTags) {
          if (projSkills.some(s => s.includes(tag) || tag.includes(s))) matchScore += 2;
          if (projArea.includes(tag) || tag.includes(projArea)) matchScore += 2;
          if (projIndustry.includes(tag) || tag.includes(projIndustry)) matchScore += 1;
        }
        return { project: p, matchScore };
      });

      // Prioritize matched projects, fall back to general trending
      const matched = scored.filter(s => s.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
      const picks = matched.length >= 3
        ? matched.slice(0, 3).map(s => s.project)
        : [...matched.map(s => s.project), ...trendingProjects.filter(p => !matched.some(m => m.project.id === p.id))].slice(0, 3);

      return picks;
    };

    // ── 6. Helper: pick personalized news for a user ──
    const pickNewsForUser = (user) => {
      const userInterests = (user.interests || []).map(i => i.toLowerCase());
      const collected = [];
      const seen = new Set();
      for (const interest of userInterests.slice(0, 3)) {
        const stories = newsByInterest[interest] || [];
        for (const story of stories) {
          const key = (story.headline || '').toLowerCase();
          if (!seen.has(key)) {
            collected.push(story);
            seen.add(key);
          }
          if (collected.length >= 3) break;
        }
        if (collected.length >= 3) break;
      }
      return collected;
    };

    // ── 7. HTML section builders ──
    const buildNewsSection = (newsStories) => {
      if (newsStories.length === 0) return '';
      return `
        <tr><td style="padding: 28px 32px 8px;">
          <h2 style="margin:0 0 16px; font-size:18px; color:#1a1a2e;">📰 Industry News</h2>
          ${newsStories.map(story => `
            <div style="margin-bottom:14px; padding:14px 16px; background:#f5f3ff; border-radius:10px;">
              <a href="${story.url || '#'}" style="font-size:15px; color:#5B47DB; font-weight:700; text-decoration:none; line-height:1.4;">${story.headline}</a>
              <p style="margin:6px 0 0; font-size:13px; color:#555; line-height:1.5;">${story.summary || ''}</p>
            </div>
          `).join('')}
        </td></tr>
      `;
    };

    const buildTrendingSection = (projects) => {
      if (projects.length === 0) return '';
      const statusColors = {
        seeking_collaborators: '#f59e0b',
        in_progress: '#10b981',
        completed: '#6b7280'
      };
      return `
        <tr><td style="padding: 28px 32px 8px;">
          <h2 style="margin:0 0 16px; font-size:18px; color:#1a1a2e;">🔥 Trending Projects</h2>
          ${projects.map(p => {
            const statusColor = statusColors[p.status] || '#6b7280';
            const projectUrl = `https://collabunity.io/ProjectDetail?id=${p.id}`;
            return `
              <div style="margin-bottom:14px; padding:14px 16px; background:#fafafa; border-left:3px solid ${statusColor}; border-radius:8px;">
                <a href="${projectUrl}" style="font-size:15px; color:#1a1a2e; font-weight:700; text-decoration:none;">${p.title}</a>
                <span style="font-size:11px; background:${statusColor}20; color:${statusColor}; padding:2px 8px; border-radius:12px; font-weight:600; text-transform:capitalize; margin-left:8px;">${(p.status || '').replace('_', ' ')}</span>
                ${p.description ? `<p style="margin:6px 0 0; font-size:13px; color:#666; line-height:1.5;">${p.description.substring(0, 140)}${p.description.length > 140 ? '...' : ''}</p>` : ''}
                <p style="margin:6px 0 0; font-size:12px; color:#888;">
                  ${(p.skills_needed || []).slice(0, 4).map(s => `<span style="background:#ede9fe; color:#5B47DB; padding:2px 8px; border-radius:10px; margin-right:4px;">${s}</span>`).join('')}
                </p>
              </div>
            `;
          }).join('')}
        </td></tr>
      `;
    };

    const buildLearningSection = (resources, blogs) => {
      const blogHTML = blogs.length > 0 ? blogs.slice(0, 2).map(a => `
        <div style="margin-bottom:10px; padding:12px 14px; background:#f0fdf4; border-radius:8px;">
          <strong style="font-size:14px; color:#1a1a2e;">${a.title}</strong>
          <p style="margin:4px 0 0; font-size:13px; color:#555;">${a.excerpt || ''}</p>
        </div>
      `).join('') : '';

      const resourceHTML = resources.length > 0 ? resources.slice(0, 3).map(r => `
        <div style="margin-bottom:8px;">
          <a href="${r.url}" style="font-size:14px; color:#5B47DB; font-weight:600; text-decoration:none;">${r.title}</a>
          <span style="font-size:12px; color:#888; margin-left:8px;">${r.format || ''} · ${r.category || ''}</span>
        </div>
      `).join('') : '';

      if (!blogHTML && !resourceHTML) return '';

      return `
        <tr><td style="padding: 28px 32px 8px;">
          <h2 style="margin:0 0 16px; font-size:18px; color:#1a1a2e;">🎓 Learning & Resources</h2>
          ${blogHTML}
          ${resourceHTML}
        </td></tr>
      `;
    };

    // ── 8. Send personalized digest to each user ──
    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const user of eligibleUsers) {
      const userTrending = pickTrendingForUser(user);
      const userNews = pickNewsForUser(user);
      const userLearning = learningResources;
      const userBlogs = articles;

      // Skip if there's nothing to show at all
      if (userTrending.length === 0 && userNews.length === 0 && userLearning.length === 0 && userBlogs.length === 0) {
        emailsSkipped++;
        continue;
      }

      const interestLabel = (user.interests && user.interests.length > 0)
        ? user.interests.slice(0, 2).join(' & ')
        : 'Collaborators';

      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0; padding:0; background:#f0f0f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f7; padding: 32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr><td style="background: linear-gradient(135deg, #5B47DB 0%, #7C6AE8 100%); padding: 36px 32px; text-align:center;">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                    alt="Collab Unity" width="48" height="48" style="border-radius:12px; margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;" />
                  <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">Your Weekly Digest</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">Trending projects, industry news & resources for ${interestLabel}</p>
                </td></tr>

                ${buildNewsSection(userNews)}
                ${buildTrendingSection(userTrending)}
                ${buildLearningSection(userLearning, userBlogs)}

                <!-- CTA -->
                <tr><td style="padding: 24px 32px 32px; text-align:center;">
                  <a href="https://collabunity.io" style="display:inline-block; background:#5B47DB; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">
                    Explore on Collab Unity →
                  </a>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding: 16px 32px; background:#f9f9ff; border-top:1px solid #ede9fe; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#aaa;">You're receiving this weekly digest as a Collab Unity member.<br/>Update your <a href="https://collabunity.io/NotificationSettings" style="color:#5B47DB;">notification preferences</a> to opt out.</p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      try {
        await sr.integrations.Core.SendEmail({
          to: user.email,
          subject: `📰 Your Weekly Collab Unity Digest`,
          body: emailBody,
          from_name: 'Collab Unity'
        });
        emailsSent++;
      } catch (emailError) {
        console.warn(`Failed to send digest to ${user.email}:`, emailError.message);
        emailsSkipped++;
      }
    }

    return Response.json({
      success: true,
      emails_sent: emailsSent,
      emails_skipped: emailsSkipped,
      unique_interests_fetched: uniqueInterests.length
    });

  } catch (error) {
    console.error('sendWeeklySummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});