import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user profile by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Return public profile data only
    return Response.json({
      data: {
        email: targetUser.email,
        full_name: targetUser.full_name,
        profile_image: targetUser.profile_image,
        username: targetUser.username
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});