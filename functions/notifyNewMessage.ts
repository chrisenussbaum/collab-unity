import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message_id } = await req.json();

    if (!message_id) {
      return Response.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Get the message
    const messages = await base44.asServiceRole.entities.Message.filter({ id: message_id });
    if (messages.length === 0) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const message = messages[0];

    // Get conversation to find recipient
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ 
      id: message.conversation_id 
    });
    
    if (conversations.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];
    const sender = await base44.asServiceRole.entities.User.filter({ email: message.sender_email });
    
    // Determine recipient(s)
    let recipients = [];
    if (conversation.conversation_type === 'direct') {
      const recipientEmail = conversation.participant_1_email === message.sender_email
        ? conversation.participant_2_email
        : conversation.participant_1_email;
      recipients = [recipientEmail];
    } else {
      // Group chat - notify all participants except sender
      recipients = (conversation.participants || []).filter(email => email !== message.sender_email);
    }

    // Send notification to each recipient
    const results = await Promise.all(
      recipients.map(async (recipientEmail) => {
        try {
          // Check if recipient has messages notifications enabled
          const recipientUser = await base44.asServiceRole.entities.User.filter({ 
            email: recipientEmail 
          });
          
          if (recipientUser.length > 0) {
            const prefs = recipientUser[0].notification_preferences || {};
            if (prefs.messages === false) {
              return { skipped: true, recipient: recipientEmail };
            }
          }

          const notification = await base44.asServiceRole.entities.Notification.create({
            user_email: recipientEmail,
            title: `New message from ${sender[0]?.full_name || 'someone'}`,
            message: message.content?.substring(0, 100) || 'Sent a message',
            type: 'direct_message',
            related_entity_id: conversation.id,
            actor_email: message.sender_email,
            actor_name: sender[0]?.full_name,
            metadata: {
              sender_profile_image: sender[0]?.profile_image,
              conversation_id: conversation.id
            },
            read: false
          });
          
          return { success: true, notification };
        } catch (error) {
          console.error(`Failed to notify ${recipientEmail}:`, error);
          return { error: error.message, recipient: recipientEmail };
        }
      })
    );

    return Response.json({ success: true, results });
  } catch (error) {
    console.error("Error in notifyNewMessage:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});