import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate the request
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userEmail, coverImage, profileImage } = await req.json();
    
    if (!userEmail) {
      return Response.json({ error: 'User email is required' }, { status: 400 });
    }
    
    // Get the user to update
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Update the user's images
    const updateData = {};
    if (coverImage) updateData.cover_image = coverImage;
    if (profileImage) updateData.profile_image = profileImage;
    
    await base44.asServiceRole.entities.User.update(user.id, updateData);
    
    return Response.json({ 
      success: true, 
      message: 'User images updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user images:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});