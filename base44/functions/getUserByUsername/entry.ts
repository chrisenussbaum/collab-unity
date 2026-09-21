import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let username;
    try {
      const body = await req.json();
      username = body.username;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: username is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Public profile semantics (mirrors getPublicUserProfiles): reachable by
    // logged-out visitors on public profile pages, so no auth.me() gate here.
    const usersData = await base44.asServiceRole.entities.User.filter({
      username: username.trim()
    });

    const u = (usersData || [])[0];
    if (!u) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const publicProfile = {
      id: u.id,
      email: u.email,
      username: u.username || '',
      full_name: u.full_name || '',
      profile_image: u.profile_image || '',
      cover_image: u.cover_image || '',
      location: u.location || '',
      bio: u.bio || '',
      skills: u.skills || [],
      interests: u.interests || [],
      tools_technologies: u.tools_technologies || [],
      education: u.education || [],
      awards_certifications: u.awards_certifications || [],
      website_url: u.website_url || '',
      linkedin_url: u.linkedin_url || '',
      social_links: u.social_links || {},
      resume_url: u.resume_url || '',
      portfolio_items: u.portfolio_items || [],
      followed_projects: u.followed_projects || [],
      voice_intro_url: u.voice_intro_url || '',
      has_completed_onboarding: u.has_completed_onboarding || false
    };

    return new Response(
      JSON.stringify(publicProfile),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  } catch (error) {
    console.error('Error in getUserByUsername:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}