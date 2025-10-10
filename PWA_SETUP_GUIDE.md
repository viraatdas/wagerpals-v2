# PWA and Push Notifications Setup Guide

This guide will help you set up and test the Progressive Web App (PWA) and push notification features.

## Prerequisites

1. Complete the database setup from the main README
2. Have the app running either locally or deployed to Vercel

## Setup Steps

### 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

You'll get output like this:
```
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
```

### 2. Configure Environment Variables

Add these to your `.env.local` file (or Vercel environment variables):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

**Important Notes:**
- The public key MUST be prefixed with `NEXT_PUBLIC_` to be accessible on the client
- The private key should NOT have the `NEXT_PUBLIC_` prefix
- Replace `your-email@example.com` with a valid email address

### 3. Run Database Migration

Add the push subscriptions table:

```bash
npx tsx scripts/add-push-subscriptions.ts
```

### 4. Generate Icons (Optional for Testing)

For production, you should generate PNG icons:

1. Open `public/icons/generate-icons.html` in your browser
2. Right-click each canvas and save as:
   - `icon-192x192.png`
   - `icon-512x512.png`
3. Save both to `public/icons/` directory

SVG placeholders are included for development/testing.

### 5. Restart Your Development Server

```bash
npm run dev
```

Or redeploy to Vercel if testing in production.

## Testing PWA Installation

### On Desktop (Chrome/Edge)

1. Open your app in Chrome or Edge
2. Look for the install icon in the address bar (⊕ or 🖥️)
3. Click it and confirm installation
4. The app should open in a standalone window

### On Android (Chrome)

1. Open your app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home Screen" or "Install app"
4. Confirm installation
5. The app icon will appear on your home screen

### On iOS (Safari)

1. Open your app in Safari (iOS 16.4+ required for push notifications)
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app icon will appear on your home screen

## Testing Push Notifications

### Enable Notifications

1. After the app loads, you should see a notification prompt at the bottom right
2. Click "Enable" to grant notification permission
3. The browser will show a system permission dialog - click "Allow"
4. The subscription is now saved in the database

### Send Test Notification

Create a new betting event:

1. Go to "Create Event" page
2. Fill in event details
3. Submit the event
4. All subscribed users should receive a push notification

### Verify Subscription

Check the console logs to verify the subscription was created:

```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => 
    console.log('Subscription:', sub)
  )
)
```

### Debug Push Issues

If notifications aren't working:

1. **Check VAPID keys are set correctly**
   - Public key in client console: `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - Should not be empty

2. **Check notification permission**
   ```javascript
   console.log('Notification permission:', Notification.permission)
   ```
   - Should be "granted"

3. **Check service worker registration**
   ```javascript
   navigator.serviceWorker.ready.then(reg => 
     console.log('Service worker ready:', reg)
   )
   ```

4. **Check database subscriptions**
   - Verify subscriptions are being saved in the `push_subscriptions` table

5. **Check server logs**
   - Look for errors when sending notifications
   - Verify VAPID keys are loaded on server side

## Testing on Mobile Devices

### Local Testing

To test on a mobile device while running locally:

1. Get your computer's local IP address
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

2. Update your Next.js dev server to bind to 0.0.0.0:
   ```bash
   next dev -H 0.0.0.0
   ```

3. Access from mobile browser:
   ```
   http://YOUR_LOCAL_IP:3000
   ```

**Important:** Push notifications require HTTPS, so local testing of push will be limited. Deploy to Vercel for full testing.

### Production Testing

1. Deploy to Vercel (which provides HTTPS)
2. Access your production URL on mobile
3. Install the PWA following the instructions above
4. Enable notifications
5. Test by creating events

## Troubleshooting

### iOS-Specific Issues

- **Push notifications not working**: Ensure iOS 16.4 or later
- **Install prompt not showing**: Use Safari, not Chrome/Firefox on iOS
- **App opens in Safari**: User must add to home screen manually

### Android-Specific Issues

- **Install prompt not showing**: The prompt may have been dismissed previously
- **Clear the dismissal**: Clear site data or use incognito mode

### General Issues

- **Service worker not updating**: 
  - Clear cache and hard reload (Ctrl+Shift+R / Cmd+Shift+R)
  - Or go to DevTools > Application > Service Workers > Unregister

- **Notifications not received**:
  - Check browser notification settings
  - Verify VAPID keys match between client and server
  - Check server logs for errors

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Push Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Offline Caching | ✅ | ✅ | ✅ | ✅ |

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your VAPID private key secure
- The public key can be safely exposed to clients
- Push subscriptions are stored per device/browser
- Users can unsubscribe by clearing browser data or revoking permissions

## Production Checklist

Before deploying to production:

- [ ] Generate proper PNG icons (not SVG)
- [ ] Generate and set VAPID keys in Vercel environment variables
- [ ] Run push subscriptions migration on production database
- [ ] Test PWA installation on iOS and Android
- [ ] Test push notifications on mobile devices
- [ ] Verify HTTPS is working (required for push)
- [ ] Update manifest.json with correct URLs and theme colors
- [ ] Test offline functionality
- [ ] Monitor push notification delivery rates

## Additional Resources

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

