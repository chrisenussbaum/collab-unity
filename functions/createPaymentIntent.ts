import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, amount, description } = await req.json();

    if (!project_id || !amount || amount < 50) {
      return Response.json({ 
        error: 'Invalid payment parameters. Minimum amount is $0.50' 
      }, { status: 400 });
    }

    // Fetch project details
    const project = await base44.entities.Project.get(project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate marketplace fee (3%)
    const grossAmount = Math.round(amount * 100); // Convert to cents
    const marketplaceFee = Math.round(grossAmount * 0.03);
    const netAmount = grossAmount - marketplaceFee;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: grossAmount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        project_id,
        project_title: project.title,
        payer_email: user.email,
        payer_name: user.full_name || user.email,
        payee_email: project.created_by,
        marketplace_fee: marketplaceFee,
        net_amount: netAmount,
      },
      description: description || `Funding for project: ${project.title}`,
    });

    // Create transaction record
    await base44.asServiceRole.entities.Transaction.create({
      project_id,
      project_title: project.title,
      payer_email: user.email,
      payer_name: user.full_name || user.email,
      payee_email: project.created_by,
      payee_name: project.created_by,
      gross_amount: grossAmount,
      marketplace_fee: marketplaceFee,
      net_amount: netAmount,
      currency: 'usd',
      status: 'pending',
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      transaction_type: 'project_funding',
      description: description || `Funding for ${project.title}`,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: paymentIntent.id,
      amount: grossAmount,
      fee: marketplaceFee,
      netAmount: netAmount,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return Response.json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    }, { status: 500 });
  }
});