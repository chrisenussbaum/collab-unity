import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      recipient_email, 
      title, 
      message, 
      type, 
      related_project_id,
      related_entity_id,
      actor_email,
      actor_name,
      metadata,
      preference_key
    } = await req.json();

    if (!recipient_email || !title || !message || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check user's notification preferences
    const recipient = await base44.asServiceRole.entities.User.filter({
      email: recipient_email
    });

    if (recipient.length > 0) {
      const prefs = recipient[0].notification_preferences || {};
      
      // If preference key is provided and user has disabled it, don't send notification
      if (preference_key && prefs[preference_key] === false) {
        return Response.json({ 
          success: true, 
          skipped: true,
          reason: 'User has disabled this notification type' 
        });
      }
    }

    // Create the notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: recipient_email,
      title,
      message,
      type,
      related_project_id,
      related_entity_id,
      actor_email: actor_email || user.email,
      actor_name: actor_name || user.full_name,
      metadata,
      read: false
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error("Error sending notification:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});