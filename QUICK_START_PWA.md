# Quick Start: PWA & Push Notifications

Get your WagerPals PWA up and running in 5 minutes!

## Step 1: Generate VAPID Keys (30 seconds)

```bash
npx web-push generate-vapid-keys
```

Copy the output. You'll get something like:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
Private Key: UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
```

## Step 2: Add to Environment Variables (30 seconds)

Add to your `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
VAPID_SUBJECT=mailto:your-email@example.com
```

⚠️ **Important**: Replace with YOUR keys (don't use the example above)!

## Step 3: Run Database Migration (30 seconds)

```bash
npx tsx scripts/add-push-subscriptions.ts
```

## Step 4: Start Your App (10 seconds)

```bash
npm run dev
```

Or deploy to Vercel:
```bash
npx vercel --prod --yes
```

## Step 5: Test It! (3 minutes)

### On Your Computer
1. Open http://localhost:3000
2. Look for the notification prompt (bottom right)
3. Click "Enable" and allow notifications
4. Create a new event
5. You should see a notification! 🎉

### On Your Phone
1. Open your app URL in mobile browser
2. Look for the "Install" prompt (bottom left)
3. Follow the platform-specific instructions
4. Enable notifications when prompted
5. Add app to home screen
6. Test by creating an event

## That's It!

Your WagerPals PWA is now ready to use. Users can:

✅ Install it on their phones (no app store)  
✅ Receive push notifications for new events  
✅ Use it offline  
✅ Experience it like a native app  

## Need Help?

- **Detailed setup**: See `PWA_SETUP_GUIDE.md`
- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **General info**: See `README.md`

## Vercel Deployment Note

If deploying to Vercel, don't forget to:

1. Add your VAPID keys to Vercel environment variables
2. Run the migration on your production database
3. Test on a real mobile device (push requires HTTPS)

```bash
# Set environment variables on Vercel
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_SUBJECT
```

## Troubleshooting

**Notifications not working?**
- Check that VAPID keys are set correctly
- Verify you granted permission in browser
- Make sure you're using HTTPS (or localhost)

**Can't install app?**
- On iOS: Must use Safari (not Chrome)
- On Android: Make sure you didn't dismiss the prompt earlier

**Service worker errors?**
- Clear cache and hard reload (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for specific errors

---

🎮 Happy wagering with push notifications! 🔔

