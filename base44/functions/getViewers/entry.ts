import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Returns the recent viewer details for the current authenticated user.
 * Only the profile owner can retrieve their own viewer lists.
 * 
 * No payload required — uses the authenticated user's identity.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the full user record (service role to get all fields)
    const users = await base44.asServiceRole.entities.User.filter({ email: currentUser.email });
    const user = users?.[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      profile_viewers: user.profile_viewer_details || [],
      project_viewers: user.project_viewer_details || [],
      profile_views: user.profile_views || 0,
      project_views: user.project_views || 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});