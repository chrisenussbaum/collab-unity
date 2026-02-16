import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle both direct calls and entity automation events
    const booking_id = payload.booking_id || payload.event?.entity_id;

    if (!booking_id) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.ServiceBooking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Check provider's notification preferences
    const provider = await base44.asServiceRole.entities.User.filter({ 
      email: booking.provider_email 
    });
    
    if (provider.length > 0) {
      const prefs = provider[0].notification_preferences || {};
      if (prefs.booking_requests === false) {
        return Response.json({ 
          success: true, 
          skipped: true,
          reason: 'Provider has disabled booking request notifications' 
        });
      }
    }

    // Notify provider of new booking request
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: booking.provider_email,
      title: 'New Booking Request',
      message: `${booking.client_name} requested to book "${booking.service_title}" on ${booking.booking_date} at ${booking.start_time}`,
      type: 'general',
      related_entity_id: booking_id,
      actor_email: booking.client_email,
      actor_name: booking.client_name,
      read: false,
      metadata: {
        booking_id: booking_id,
        redirect_to: 'mybookings'
      }
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error("Error in notifyBookingRequest:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});