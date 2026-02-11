import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await base44.entities.Conversation.get(conversation_id);
    
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.conversation_type === 'group'
      ? conversation.participants?.includes(user.email)
      : (conversation.participant_1_email === user.email || conversation.participant_2_email === user.email);

    if (!isParticipant) {
      return Response.json({ error: 'Not authorized to create video call for this conversation' }, { status: 403 });
    }

    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY not set');
      return Response.json({ error: 'Video calling not configured' }, { status: 500 });
    }

    // Create a Daily room
    const roomName = `cu-call-${conversation_id}-${Date.now()}`;
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: conversation.conversation_type === 'group' ? 50 : 2,
          enable_screenshare: true,
          enable_chat: false,
          enable_knocking: false,
          enable_prejoin_ui: false,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4) // 4 hours
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Daily API error:', errorText);
      return Response.json({ error: 'Failed to create video room' }, { status: 500 });
    }

    const room = await response.json();

    // Send notification to other participants
    const notificationPromises = [];
    const callType = conversation.conversation_type === 'group' ? 'group' : 'direct';
    
    if (conversation.conversation_type === 'group') {
      conversation.participants?.forEach(email => {
        if (email !== user.email) {
          notificationPromises.push(
            base44.entities.Notification.create({
              user_email: email,
              title: `Video call in ${conversation.group_name || 'Group Chat'}`,
              message: `${user.full_name || user.email} started a video call`,
              type: 'direct_message',
              related_entity_id: conversation_id,
              actor_email: user.email,
              actor_name: user.full_name || user.email,
              read: false,
              metadata: {
                conversation_id: conversation_id,
                video_call_url: room.url,
                call_type: callType
              }
            })
          );
        }
      });
    } else {
      const otherEmail = conversation.participant_1_email === user.email
        ? conversation.participant_2_email
        : conversation.participant_1_email;
      
      notificationPromises.push(
        base44.entities.Notification.create({
          user_email: otherEmail,
          title: `Video call from ${user.full_name || user.email}`,
          message: 'Incoming video call',
          type: 'direct_message',
          related_entity_id: conversation_id,
          actor_email: user.email,
          actor_name: user.full_name || user.email,
          read: false,
          metadata: {
            conversation_id: conversation_id,
            video_call_url: room.url,
            call_type: callType
          }
        })
      );
    }

    await Promise.all(notificationPromises);

    return Response.json({
      room_url: room.url,
      room_name: room.name
    });

  } catch (error) {
    console.error('Error creating video call:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});