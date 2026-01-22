# 🚀 Quick Start Guide - WagerPals Mobile

Get your WagerPals mobile app running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- iOS Simulator (Mac) or Android Emulator installed
- Your existing WagerPals backend running

## Step 1: Update Database (1 minute)

From the root directory:

```bash
npm run db:migrate-mobile
```

This adds mobile support to your existing database.

## Step 2: Configure Mobile App (2 minutes)

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and add:

```env
# Your backend URL (use your local IP for testing on physical device)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Copy these from your web app's .env.local
EXPO_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
EXPO_PUBLIC_STACK_PUBLISHABLE_KEY=your_stack_publishable_key
```

## Step 3: Run the App (1 minute)

### Option A: iOS Simulator (Mac only)
```bash
npm run ios
```

### Option B: Android Emulator
```bash
npm run android
```

### Option C: Your Phone
```bash
npm start
```
Then scan the QR code with Expo Go app (available on App Store/Play Store).

## Step 4: Test It Out! (1 minute)

1. **Sign In** - Use your existing account or create a new one
2. **Choose Username** - Pick a username (first time only)
3. **Create Group** - Tap "+ Create Group" and make a test group
4. **Join Group** - Try joining with the 6-digit code

## 🎉 You're Done!

Your WagerPals mobile app is now running!

## What's Next?

### For Development:
- Implement remaining screens (see `IMPLEMENTATION_SUMMARY.md`)
- Test push notifications (requires physical device)
- Test deep linking
- Customize branding and colors

### For Production:
- Update app icons in `assets/`
- Configure bundle IDs in `app.json`
- Build with EAS: `eas build --platform all`
- Submit to app stores: `eas submit --platform all`

## Common Issues

### "Cannot connect to backend"
- Make sure your backend is running
- If testing on physical device, use your computer's local IP instead of localhost
- Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000`

### "Username already taken"
- This is expected if you're using the same account on web
- The username was already set on web

### Push notifications not working
- Push notifications only work on physical devices (not simulator)
- Make sure you granted notification permissions
- Check that your Expo push token is being saved (check backend logs)

## Need Help?

- Check `mobile/README.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for what's implemented
- Check backend logs for API errors
- Check Expo logs for mobile errors

---

**Pro Tip**: Test on a physical device for the best experience! Push notifications and deep linking work better on real devices.





