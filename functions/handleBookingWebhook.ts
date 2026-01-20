import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata.booking_id;
      const providerEmail = session.metadata.provider_email;
      const clientEmail = session.metadata.client_email;

      if (!bookingId) {
        console.error('No booking_id in session metadata');
        return Response.json({ error: 'No booking ID' }, { status: 400 });
      }

      // Update booking status
      const booking = await base44.asServiceRole.entities.Booking.update(bookingId, {
        status: 'confirmed',
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent
      });

      // Get booking details
      const updatedBooking = await base44.asServiceRole.entities.Booking.get(bookingId);
      const serviceListing = await base44.asServiceRole.entities.ServiceListing.get(
        updatedBooking.service_listing_id
      );

      // Send notification to provider
      await base44.asServiceRole.entities.Notification.create({
        user_email: providerEmail,
        title: 'New Booking Received',
        message: `You have a new booking for ${serviceListing.title} on ${updatedBooking.booking_date} at ${updatedBooking.start_time}`,
        type: 'general',
        metadata: {
          booking_id: bookingId,
          service_listing_id: serviceListing.id
        }
      });

      // Send notification to client
      await base44.asServiceRole.entities.Notification.create({
        user_email: clientEmail,
        title: 'Booking Confirmed',
        message: `Your booking for ${serviceListing.title} on ${updatedBooking.booking_date} at ${updatedBooking.start_time} has been confirmed`,
        type: 'general',
        metadata: {
          booking_id: bookingId,
          service_listing_id: serviceListing.id
        }
      });

      console.log('Booking confirmed:', bookingId);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 400 });
  }
});