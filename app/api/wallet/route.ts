import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, verifyUserMatch } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

// GET /api/wallet?userId=xxx — get wallet balance and recent transactions
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const mismatch = verifyUserMatch(authResult.userId, userId);
  if (mismatch) return mismatch;

  const wallet = await db.wallets.getOrCreate(userId);
  const transactions = await db.transactions.getByUser(userId, 20);

  return NextResponse.json({ wallet, transactions });
}

// POST /api/wallet — deposit or withdraw
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { user_id, action, amount } = body;

  if (!user_id || !action || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const mismatch = verifyUserMatch(authResult.userId, user_id);
  if (mismatch) return mismatch;

  const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;
  if (parsedAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  if (parsedAmount > 500) {
    return NextResponse.json({ error: 'Maximum transaction amount is $500' }, { status: 400 });
  }

  // Ensure wallet exists
  await db.wallets.getOrCreate(user_id);

  if (action === 'deposit') {
    try {
      // Create a Stripe Payment Intent
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parsedAmount * 100), // Stripe uses cents
        currency: 'usd',
        metadata: {
          user_id,
          type: 'deposit',
        },
      });

      // Record pending transaction
      const transaction = {
        id: generateId(),
        user_id,
        type: 'deposit' as const,
        amount: parsedAmount,
        status: 'pending' as const,
        stripe_payment_intent_id: paymentIntent.id,
        description: `Deposit $${parsedAmount.toFixed(2)}`,
      };

      await db.transactions.create(transaction);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        transaction,
      });
    } catch (error: any) {
      console.error('[Wallet API] Stripe error:', error);
      if (error?.message?.includes('STRIPE_SECRET_KEY')) {
        return NextResponse.json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
  }

  if (action === 'withdraw') {
    // Deduct from wallet (atomic, prevents overdraft)
    const { success, wallet } = await db.wallets.deductBalance(user_id, parsedAmount);

    if (!success) {
      return NextResponse.json({
        error: 'Insufficient balance',
        balance: wallet?.balance || 0,
      }, { status: 400 });
    }

    // Record completed withdrawal transaction
    const transaction = {
      id: generateId(),
      user_id,
      type: 'withdrawal' as const,
      amount: -parsedAmount,
      status: 'completed' as const,
      description: `Withdrawal $${parsedAmount.toFixed(2)}`,
    };

    await db.transactions.create(transaction);

    return NextResponse.json({ wallet, transaction });
  }

  return NextResponse.json({ error: 'Invalid action. Use "deposit" or "withdraw"' }, { status: 400 });
}
