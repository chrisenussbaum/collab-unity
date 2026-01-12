import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  try {
    // Initialize base44 client BEFORE any Stripe validation
    const base44 = createClientFromRequest(req);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
    }

    // Verify webhook signature using async method (required for Deno)
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Find the transaction record
      const transactions = await base44.asServiceRole.entities.Transaction.filter({
        stripe_payment_intent_id: paymentIntent.id
      });

      if (transactions.length > 0) {
        const transaction = transactions[0];
        
        // Update transaction status
        await base44.asServiceRole.entities.Transaction.update(transaction.id, {
          status: 'completed',
          payment_date: new Date().toISOString(),
          stripe_charge_id: paymentIntent.latest_charge,
        });

        // Create notification for project owner
        await base44.asServiceRole.entities.Notification.create({
          user_email: transaction.payee_email,
          title: 'Payment Received!',
          message: `You received $${(transaction.net_amount / 100).toFixed(2)} for project "${transaction.project_title}"`,
          type: 'general',
          related_project_id: transaction.project_id,
          actor_email: transaction.payer_email,
          actor_name: transaction.payer_name,
          metadata: {
            transaction_id: transaction.id,
            gross_amount: transaction.gross_amount,
            net_amount: transaction.net_amount,
          }
        });

        // Create notification for payer
        await base44.asServiceRole.entities.Notification.create({
          user_email: transaction.payer_email,
          title: 'Payment Successful',
          message: `Your payment of $${(transaction.gross_amount / 100).toFixed(2)} for "${transaction.project_title}" was successful`,
          type: 'general',
          related_project_id: transaction.project_id,
          metadata: {
            transaction_id: transaction.id,
          }
        });
      }
    }

    // Handle payment failure
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      const transactions = await base44.asServiceRole.entities.Transaction.filter({
        stripe_payment_intent_id: paymentIntent.id
      });

      if (transactions.length > 0) {
        const transaction = transactions[0];
        
        await base44.asServiceRole.entities.Transaction.update(transaction.id, {
          status: 'failed',
        });

        // Notify payer of failure
        await base44.asServiceRole.entities.Notification.create({
          user_email: transaction.payer_email,
          title: 'Payment Failed',
          message: `Your payment for "${transaction.project_title}" could not be processed. Please try again.`,
          type: 'general',
          related_project_id: transaction.project_id,
        });
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ 
      error: 'Webhook handler failed',
      details: error.message 
    }, { status: 500 });
  }
});