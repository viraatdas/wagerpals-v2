# 🧪 Testing Push Notifications

Multiple ways to test your push notifications are working!

## Prerequisites

1. **Subscribe to notifications first!**
   - Open your app (localhost or production)
   - Click "Enable" on the notification prompt
   - Grant permission in the browser dialog
   - This creates a subscription in your database

---

## Method 1: NPM Script (Easiest) ⭐

```bash
npm run test:push
```

This sends a test notification to all subscribers.

**Expected output:**
```
🔔 Testing Push Notifications...
Target: http://localhost:3000

Sending test notification...
Payload: {
  "title": "🧪 Test Notification",
  "body": "This is a test push notification from WagerPals!",
  "url": "/",
  "tag": "test-notification"
}

✅ Success!

Results:
  - Sent successfully: 1
  - Failed: 0

🎉 Notification sent! Check your browser/device.
```

**For production testing:**
```bash
TEST_URL=https://your-app.vercel.app npm run test:push
```

---

## Method 2: cURL Command

**Local testing:**
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎲 Test Event",
    "body": "Testing push notifications!",
    "url": "/",
    "tag": "test"
  }'
```

**Production testing:**
```bash
curl -X POST https://your-app.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎲 Test Event",
    "body": "Testing push notifications!",
    "url": "/",
    "tag": "test"
  }'
```

**Expected response:**
```json
{
  "sent": true,
  "success": 1,
  "failed": 0
}
```

---

## Method 3: Browser Console

Open your browser console and run:

```javascript
fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '🧪 Browser Test',
    body: 'Testing from browser console!',
    url: '/',
    tag: 'console-test'
  })
})
.then(r => r.json())
.then(data => console.log('Result:', data));
```

---

## Method 4: Create a Real Event (Most Realistic)

1. Go to your app's "Create Event" page
2. Fill out the form and create an event
3. A notification should be sent automatically!
4. Check your browser/device for the notification

This tests the full integration.

---

## Method 5: Postman / Thunder Client

Use any API client:

**Endpoint:** `POST /api/push/send`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "title": "🎲 New Bet!",
  "body": "Will it rain tomorrow? Come place your bet!",
  "url": "/events/some-event-id",
  "eventId": "some-event-id",
  "tag": "event-created"
}
```

---

## Checking Subscriptions

To see how many subscribers you have:

**Method 1: Check database directly**
```bash
# If you have psql access
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM push_subscriptions;"
```

**Method 2: Add a debug endpoint** (optional)

Create `/app/api/push/subscriptions/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const subscriptions = await db.pushSubscriptions.getAll();
  return NextResponse.json({
    count: subscriptions.length,
    subscriptions: subscriptions.map(s => ({
      id: s.id,
      user_id: s.user_id,
      created_at: s.created_at,
    }))
  });
}
```

Then visit: `http://localhost:3000/api/push/subscriptions`

---

## Troubleshooting

### "success: 0" - No subscribers found

**Solution:**
1. Open your app in a browser
2. Look for the notification prompt (bottom right)
3. Click "Enable"
4. Grant permission when browser asks
5. Try the test again

### "Failed: 1" - Notification failed to send

**Common causes:**
1. **VAPID keys not set** - Check `.env.local`
2. **Invalid subscription** - User may have cleared browser data
3. **Browser closed** - Some browsers need to be open

**Check logs:**
```bash
# In your terminal running npm run dev
# Look for error messages
```

### Can't find notification

**Desktop:**
- Check notification center (top right on Mac, bottom right on Windows)
- Check browser notification settings
- Make sure notifications aren't in Do Not Disturb mode

**Mobile:**
- Check notification shade
- Verify app has notification permission in Settings
- Make sure phone isn't on silent/DND

### Testing on mobile

1. Deploy to Vercel (push requires HTTPS)
2. Install PWA on your phone
3. Enable notifications
4. Run test from another device:
   ```bash
   TEST_URL=https://your-app.vercel.app npm run test:push
   ```

---

## Expected Notification

When it works, you should see:

**Desktop:**
- Browser notification appears (top or bottom of screen)
- Shows WagerPals icon
- Title: Your test title
- Body: Your test message
- Clicking opens the app

**Mobile:**
- Push notification in notification shade
- Shows app icon
- Notification sound/vibration
- Tapping opens the PWA to the URL

---

## Quick Test Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:** `http://localhost:3000`

3. **Enable notifications:**
   - Click "Enable" button
   - Grant permission

4. **In a new terminal, send test:**
   ```bash
   npm run test:push
   ```

5. **Check for notification!** 🔔

---

## Production Testing

```bash
# Set your production URL
export TEST_URL=https://wagerpals.vercel.app

# Send test
npm run test:push
```

Or directly:
```bash
TEST_URL=https://wagerpals.vercel.app npm run test:push
```

---

## Advanced: Test Different Notification Types

**Event created:**
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎲 New Event: Will it rain tomorrow?",
    "body": "Created by Alice",
    "url": "/events/123",
    "eventId": "123",
    "tag": "event-123"
  }'
```

**Custom message:**
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🏆 Bet Resolved!",
    "body": "Your bet on rain won! +$50",
    "url": "/events/123",
    "tag": "resolution"
  }'
```

---

## Debugging Tips

**Check service worker:**
```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => 
  console.log('SW ready:', reg)
);
```

**Check subscription:**
```javascript
// In browser console
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub =>
    console.log('Subscription:', sub ? 'Active' : 'None')
  )
);
```

**Check VAPID key:**
```javascript
// In browser console
console.log('VAPID:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

---

## Summary

**Quickest way to test:**
1. `npm run dev`
2. Open http://localhost:3000
3. Enable notifications
4. In new terminal: `npm run test:push`
5. 🔔 Notification appears!

**Need help?** Check the browser console for errors or server logs for issues.

