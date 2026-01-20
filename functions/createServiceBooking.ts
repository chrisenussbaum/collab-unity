import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      service_listing_id,
      provider_email,
      provider_name,
      client_email,
      client_name,
      service_title,
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      client_notes
    } = await req.json();

    if (!service_listing_id || !provider_email || !client_email || !booking_date || !start_time || !end_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the booking
    const booking = await base44.asServiceRole.entities.ServiceBooking.create({
      service_listing_id,
      provider_email,
      provider_name,
      client_email,
      client_name,
      service_title,
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      client_notes,
      status: 'pending'
    });

    // Send notification to provider
    await base44.asServiceRole.entities.Notification.create({
      user_email: provider_email,
      title: 'New Booking Request',
      message: `${client_name} has requested to book "${service_title}" on ${booking_date} at ${start_time}`,
      type: 'general',
      related_entity_id: booking.id,
      actor_email: client_email,
      actor_name: client_name,
      metadata: {
        booking_id: booking.id,
        booking_date,
        start_time,
        end_time
      }
    });

    // Send confirmation notification to client
    await base44.asServiceRole.entities.Notification.create({
      user_email: client_email,
      title: 'Booking Request Sent',
      message: `Your booking request for "${service_title}" with ${provider_name} on ${booking_date} at ${start_time} has been sent`,
      type: 'general',
      related_entity_id: booking.id,
      actor_email: provider_email,
      actor_name: provider_name,
      metadata: {
        booking_id: booking.id,
        booking_date,
        start_time,
        end_time
      }
    });

    return Response.json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});