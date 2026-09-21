import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();

    const publicProfiles = (allUsers || []).map(u => ({
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
      has_completed_onboarding: u.has_completed_onboarding || false,
      last_activity_at: u.last_activity_at || null
    }));

    return Response.json(publicProfiles, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}