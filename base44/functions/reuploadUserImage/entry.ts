import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, imageUrl } = await req.json();
    
    if (!email || !imageUrl) {
      return Response.json({ error: 'Email and imageUrl are required' }, { status: 400 });
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
    }

    // Get the image as a blob
    const imageBlob = await imageResponse.blob();
    
    // Convert blob to File object
    const fileName = imageUrl.split('/').pop() || 'profile-image.jpg';
    const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

    // Upload through Base44
    const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
    
    if (!uploadResult.file_url) {
      return Response.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Update the user's profile image using service role
    const users = await base44.asServiceRole.entities.User.filter({ email });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      profile_image: uploadResult.file_url
    });

    return Response.json({
      success: true,
      old_url: imageUrl,
      new_url: uploadResult.file_url,
      message: 'Profile image re-uploaded and updated successfully'
    });

  } catch (error) {
    console.error('Error re-uploading user image:', error);
    return Response.json({ 
      error: error.message || 'Failed to re-upload image' 
    }, { status: 500 });
  }
});