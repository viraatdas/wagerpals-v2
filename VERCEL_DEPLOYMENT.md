# 🚀 Vercel Deployment Guide - WagerPals PWA

## ✅ Local Setup Complete

Your local environment is ready:
- ✅ VAPID keys added to `.env.local`
- ✅ Database migration completed
- ✅ Push subscriptions table created

## 📤 Deploy to Vercel

### Step 1: Add Environment Variables to Vercel

Run these commands to add your VAPID keys to Vercel:

```bash
# Add public VAPID key
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production

# When prompted, paste:
BPET3DayFB3aaqpdwEp1MfiQKE2Ua2_tvpF7ZmzdCKYL4eobFMz7oARdO_0KnrbPO6jqS0yE8Db-yLZxjcByL-8

# Add private VAPID key
vercel env add VAPID_PRIVATE_KEY production

# When prompted, paste:
w4zJ4vESefRQQCuJTBPZcLGxK78hcP-9gXSijIAxTzs

# Add VAPID subject
vercel env add VAPID_SUBJECT production

# When prompted, paste:
mailto:admin@wagerpals.com
```

**Or use Vercel Dashboard:**
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add these three variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BPET3DayFB3aaqpdwEp1MfiQKE2Ua2_tvpF7ZmzdCKYL4eobFMz7oARdO_0KnrbPO6jqS0yE8Db-yLZxjcByL-8
VAPID_PRIVATE_KEY = w4zJ4vESefRQQCuJTBPZcLGxK78hcP-9gXSijIAxTzs
VAPID_SUBJECT = mailto:admin@wagerpals.com
```

### Step 2: Git Push and Deploy

```bash
# Stage all changes
git add .

# Commit
git commit -m "Add PWA and push notifications support"

# Push to trigger Vercel deployment
git push origin main
```

Vercel will automatically deploy your changes!

### Step 3: Verify Deployment

After deployment completes:

1. Visit your production URL
2. Open browser DevTools → Console
3. Check that service worker registered successfully
4. Look for notification prompt in bottom right
5. Enable notifications and test!

## 📱 Testing on Mobile

### iOS (Safari)
1. Open your production URL in Safari
2. Tap Share button (square with arrow up)
3. Scroll and tap "Add to Home Screen"
4. Open the app from home screen
5. Enable notifications when prompted
6. Create an event to test notifications

### Android (Chrome)
1. Open your production URL in Chrome
2. Tap "Install" when prompted (or menu → Add to Home Screen)
3. Open the app from home screen
4. Enable notifications when prompted
5. Create an event to test notifications

## 🔍 Troubleshooting

### Environment Variables Not Working?
```bash
# Check if they're set correctly
vercel env ls

# If needed, update them
vercel env rm NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
```

### Push Notifications Not Sending?
1. Check Vercel logs: `vercel logs`
2. Verify environment variables are set
3. Make sure database migration ran on production
4. Test subscription endpoint: `/api/push/subscribe`

### Need to Redeploy?
```bash
vercel --prod
```

## ✅ Production Checklist

- [x] VAPID keys generated
- [x] Keys added to local `.env.local`
- [x] Database migration run locally
- [ ] Environment variables added to Vercel
- [ ] Code pushed to Git
- [ ] Vercel deployed successfully
- [ ] Tested on mobile device (iOS)
- [ ] Tested on mobile device (Android)
- [ ] Push notifications working

## 🎉 You're Done!

Once deployed and tested, your WagerPals app is a full PWA with push notifications!

Users can now:
- 📲 Install it on their phones
- 🔔 Receive notifications for new events
- 📶 Use it offline
- 🚀 Experience it like a native app

No app store required! 🎊

