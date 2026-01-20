import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

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
      booking_date, 
      start_time, 
      end_time, 
      duration_hours,
      total_amount,
      client_notes
    } = await req.json();

    if (!service_listing_id || !provider_email || !booking_date || !start_time || !end_time || !total_amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get service listing details
    const serviceListing = await base44.asServiceRole.entities.ServiceListing.get(service_listing_id);
    if (!serviceListing) {
      return Response.json({ error: 'Service listing not found' }, { status: 404 });
    }

    // Create booking record with pending status
    const booking = await base44.asServiceRole.entities.Booking.create({
      service_listing_id,
      provider_email,
      client_email: user.email,
      client_name: user.full_name,
      booking_date,
      start_time,
      end_time,
      duration_hours,
      total_amount,
      currency: 'USD',
      status: 'pending_payment',
      payment_status: 'pending',
      client_notes: client_notes || ''
    });

    // Create Stripe checkout session
    const origin = req.headers.get('origin') || 'https://app.base44.com';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceListing.title,
            description: `${booking_date} at ${start_time} (${duration_hours}h)`,
          },
          unit_amount: Math.round(total_amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/discover?tab=services`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        booking_id: booking.id,
        service_listing_id,
        provider_email,
        client_email: user.email
      },
      customer_email: user.email,
    });

    // Update booking with stripe session ID
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      stripe_session_id: session.id
    });

    return Response.json({ 
      sessionId: session.id,
      sessionUrl: session.url,
      bookingId: booking.id
    });

  } catch (error) {
    console.error('Error creating booking checkout:', error);
    return Response.json({ 
      error: error.message || 'Failed to create booking checkout' 
    }, { status: 500 });
  }
});