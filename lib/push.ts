import webpush from 'web-push';
import { db } from './db';

// VAPID keys should be set in environment variables
// Generate them with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@wagerpals.com';

// Track if VAPID details have been set
let vapidDetailsSet = false;

// Set VAPID details only when needed (at runtime, not during build)
function ensureVapidDetails() {
  if (!vapidDetailsSet && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    vapidDetailsSet = true;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  eventId?: string;
  tag?: string;
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Set VAPID details at runtime, not during build
    ensureVapidDetails();

    const subscription = {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    };

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    
    // If subscription is no longer valid, remove it from database
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription no longer valid, removing from database');
      await db.pushSubscriptions.delete(endpoint);
    }
    
    return false;
  }
}

export async function sendPushToAllSubscribers(
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const subscriptions = await db.pushSubscriptions.getAll();
  
  let success = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(sub.endpoint, sub.p256dh, sub.auth, payload)
    )
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      success++;
    } else {
      failed++;
    }
  });

  console.log(`Push notifications sent: ${success} succeeded, ${failed} failed`);
  
  return { success, failed };
}

