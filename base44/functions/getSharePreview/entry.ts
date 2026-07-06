import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns an HTML page with dynamic Open Graph meta tags for social media previews.
 * Social crawlers (LinkedIn, Facebook, Twitter) don't execute JavaScript, so they
 * only see the initial HTML. This function fetches the project or user data and
 * injects the correct og:title, og:image, etc. into the HTML response.
 *
 * Real users get redirected to the actual app page via JavaScript.
 *
 * Query params:
 *   type=project&id=<project_id>
 *   type=profile&username=<username>
 */

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg';
const SITE_NAME = 'Collab Unity';
const BASE_URL = 'https://collabunity.io';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');
    const username = url.searchParams.get('username');

    let ogTitle = `${SITE_NAME} - Where Ideas Happen`;
    let ogDescription = 'Connect with talented professionals, collaborate on meaningful projects, and bring your vision to life on Collab Unity.';
    let ogImage = LOGO_URL;
    let redirectUrl = BASE_URL;

    if (type === 'project' && id) {
      const projects = await base44.asServiceRole.entities.Project.filter({ id });
      if (projects.length > 0) {
        const project = projects[0];
        ogTitle = `${project.title || 'Project'} | ${SITE_NAME}`;
        if (project.description) {
          ogDescription = project.description.slice(0, 200);
        }
        if (project.logo_url) {
          ogImage = project.logo_url;
        } else if (project.background_image_url) {
          ogImage = project.background_image_url;
        }
        redirectUrl = `${BASE_URL}/ProjectDetail?id=${encodeURIComponent(id)}`;
      }
    } else if (type === 'profile') {
      let user = null;
      if (username) {
        const users = await base44.asServiceRole.entities.User.filter({ username });
        if (users.length > 0) user = users[0];
      } else if (id) {
        try {
          user = await base44.asServiceRole.entities.User.get(id);
        } catch (e) {
          user = null;
        }
      }

      if (user) {
        ogTitle = `${user.full_name || 'User'} | ${SITE_NAME}`;
        ogDescription = user.bio
          ? user.bio.slice(0, 200)
          : `Check out ${user.full_name || 'this user'}'s profile on ${SITE_NAME}`;
        if (user.profile_image) {
          ogImage = user.profile_image;
        }
        if (username) {
          redirectUrl = `${BASE_URL}/UserProfile?username=${encodeURIComponent(username)}`;
        } else {
          redirectUrl = `${BASE_URL}/UserProfile?id=${encodeURIComponent(id)}`;
        }
      }
    }

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(redirectUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
</head>
<body>
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f8f7ff;">
    <div style="text-align:center;">
      <img src="${LOGO_URL}" alt="${SITE_NAME}" style="width:48px;height:48px;border-radius:8px;margin-bottom:16px;" />
      <p style="color:#5B47DB;font-weight:600;margin:0;">Loading Collab Unity...</p>
      <p style="color:#9ca3af;font-size:14px;margin-top:8px;"><a href="${escapeHtml(redirectUrl)}" style="color:#5B47DB;">Click here if you are not redirected</a></p>
    </div>
  </div>
  <script>window.location.replace("${escapeHtml(redirectUrl)}");</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating share preview:', error);
    // Fallback: redirect to main site
    const fallbackHtml = `<!doctype html>
<html><head><meta charset="UTF-8"><title>${SITE_NAME}</title></head>
<body><script>window.location.replace("${BASE_URL}");</script>
<noscript><meta http-equiv="refresh" content="0;url=${BASE_URL}"></noscript></body></html>`;
    return new Response(fallbackHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});