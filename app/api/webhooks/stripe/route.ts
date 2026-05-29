import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.user_id;
      const type = paymentIntent.metadata.type;

      if (type === 'deposit' && userId) {
        const amount = paymentIntent.amount / 100; // Convert from cents

        // Credit wallet
        await db.wallets.getOrCreate(userId);
        await db.wallets.updateBalance(userId, amount);

        // Update transaction status
        const transaction = await db.transactions.getByStripeId(paymentIntent.id);
        if (transaction) {
          await db.transactions.updateStatus(transaction.id, 'completed');
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Mark transaction as failed
      const transaction = await db.transactions.getByStripeId(paymentIntent.id);
      if (transaction) {
        await db.transactions.updateStatus(transaction.id, 'failed');
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
