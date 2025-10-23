import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPushNotification } from '@/lib/push';

export async function POST() {
  try {
    console.log('[Test] Starting push notification test...');
    
    // Get all subscriptions
    const subscriptions = await db.pushSubscriptions.getAll();
    console.log('[Test] Found subscriptions:', subscriptions.length);
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No subscriptions found',
        count: 0,
      });
    }

    // Try to send to each subscription
    const results = [];
    for (const sub of subscriptions) {
      console.log('[Test] Attempting to send to:', sub.endpoint.substring(0, 50));
      
      // Skip mobile subscriptions (they don't have p256dh/auth)
      if (!sub.p256dh || !sub.auth) {
        console.log('[Test] Skipping mobile subscription');
        results.push({
          endpoint: sub.endpoint.substring(0, 50) + '...',
          success: false,
          error: 'Mobile subscription (Expo token) - use mobile notification API',
        });
        continue;
      }

      const success = await sendPushNotification(
        sub.endpoint,
        sub.p256dh,
        sub.auth,
        {
          title: '🧪 Direct Test',
          body: 'Testing direct subscription send',
          url: '/',
        }
      );

      results.push({
        endpoint: sub.endpoint.substring(0, 50) + '...',
        success,
      });
    }

    return NextResponse.json({
      success: true,
      totalSubscriptions: subscriptions.length,
      results,
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

