# 📱 iOS Push Notifications - Troubleshooting Guide

## ⚠️ iOS-Specific Requirements

iOS has **stricter requirements** than Android for push notifications:

### 1. iOS Version ✅
- **Minimum: iOS 16.4+** (released March 2023)
- Push notifications don't work on older iOS versions
- Check: Settings → General → About → iOS Version

### 2. Must Be Installed as PWA ⚠️
- **Critical:** Just visiting in Safari is NOT enough
- Must use "Add to Home Screen" 
- Push only works when opened from the home screen icon
- Won't work when using Safari directly

### 3. Safari Only 🌐
- Must use **Safari browser**
- Chrome/Firefox on iOS don't support PWA push notifications
- Check: Are you in Safari?

### 4. HTTPS Required 🔒
- **localhost doesn't work on iOS** (unlike desktop)
- Must be deployed to production with HTTPS
- Vercel automatically provides HTTPS

### 5. Must Grant Permission 🔔
- Notification permission must be granted IN the app
- System settings alone aren't enough
- Need to trigger subscription within the PWA

---

## 🔧 Step-by-Step Fix

### Step 1: Verify iOS Version
```
Settings → General → About → iOS Version
```
✅ Must be 16.4 or higher

### Step 2: Deploy to Production (If Testing Locally)
```bash
# iOS requires HTTPS - localhost won't work
git push origin main
# Wait for Vercel deployment
```

### Step 3: Install as PWA in Safari

1. Open Safari on your iPhone
2. Go to: `https://your-app.vercel.app`
3. Tap the **Share button** (□↑ at bottom)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. Find the app icon on your home screen

### Step 4: Open from Home Screen

⚠️ **Important:** Don't open in Safari!

1. Close Safari completely
2. Tap the WagerPals icon on your home screen
3. App should open in full-screen mode (no Safari UI)

### Step 5: Enable Notifications IN the App

1. Look for notification prompt in the app
2. Tap "Enable" button
3. When iOS asks for permission, tap "Allow"
4. ✅ You should now be subscribed

### Step 6: Test with Debug Page

Visit in your installed PWA:
```
https://your-app.vercel.app/ios-test
```

This page will show you:
- ✅ If you're on iOS
- ✅ If app is installed (standalone mode)
- ✅ If subscription is active
- ✅ All requirements met

### Step 7: Send Test Notification

From another device or computer:
```bash
TEST_URL=https://your-app.vercel.app npm run test:push
```

Or use the test page button.

---

## 🐛 Common Issues

### Issue: "I enabled notifications in iOS Settings but nothing works"

**Problem:** iOS Settings enables notifications for the app, but you also need to **subscribe within the app itself**.

**Solution:**
1. Open app from home screen (not Safari)
2. Look for the notification prompt in the app
3. Click "Enable" button
4. Grant permission when iOS asks

---

### Issue: "No notification prompt appears"

**Possible causes:**

**1. Not installed as PWA**
- Check: Do you see Safari's address bar?
- If yes → Not installed, go back to Step 3
- If no → Good! Continue

**2. Already dismissed prompt**
```javascript
// In browser console (while in installed PWA):
localStorage.getItem('pushNotificationPromptDismissed')
// If it returns 'true', clear it:
localStorage.removeItem('pushNotificationPromptDismissed')
// Refresh the app
```

**3. Permission already denied**
```
Go to: Settings → WagerPals → Notifications
Make sure "Allow Notifications" is ON
Then try subscribing again in the app
```

---

### Issue: "Push notifications still not working"

**Check these:**

**1. Are you opening from home screen?**
```javascript
// Check in console (in installed PWA):
window.matchMedia('(display-mode: standalone)').matches
// Should return: true
// If false → You're not in installed PWA mode
```

**2. Is service worker registered?**
```javascript
// Check in console:
navigator.serviceWorker.ready.then(reg => 
  console.log('Service worker:', reg)
);
// Should show registration object
```

**3. Do you have a subscription?**
```javascript
// Check in console:
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub =>
    console.log('Subscription:', sub ? 'Active ✅' : 'None ❌')
  )
);
```

**4. Check VAPID key:**
```javascript
// Check in console:
console.log('VAPID:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
// Should show your key (starts with 'B...')
```

---

### Issue: "Notifications work on desktop but not iOS"

This is usually because:
1. ❌ Not installed as PWA on iOS
2. ❌ Opening in Safari instead of from home screen
3. ❌ Testing on localhost (needs HTTPS/production)
4. ❌ iOS version < 16.4

**Solution:** Deploy to Vercel and install as PWA

---

## ✅ Verification Checklist

Use this page to verify everything:
```
https://your-app.vercel.app/ios-test
```

All should be green ✅:
- [ ] Is iOS Device
- [ ] iOS 16.4 or higher
- [ ] Installed as PWA (standalone mode)
- [ ] HTTPS
- [ ] Service Worker Support
- [ ] Push API Support
- [ ] VAPID Key Configured
- [ ] Notification Permission: granted
- [ ] Has Active Subscription

---

## 🧪 Testing Flow

### On Your iPhone:

1. **Install PWA**
   - Safari → your-app.vercel.app
   - Share → Add to Home Screen

2. **Open from Home Screen**
   - Tap app icon (not Safari)

3. **Subscribe**
   - Click "Enable" in app
   - Allow when iOS asks

4. **Verify subscription**
   - Visit `/ios-test` in the PWA
   - Check all items are green

### From Another Device:

5. **Send test**
   ```bash
   npm run test:push
   # or
   curl -X POST https://your-app.vercel.app/api/push/send \
     -H "Content-Type: application/json" \
     -d '{"title":"iOS Test","body":"Testing!"}'
   ```

6. **Check iPhone**
   - Should see notification even if app is closed
   - Tap notification → opens app

---

## 🚨 Critical Differences: iOS vs Desktop

| Feature | Desktop | iOS |
|---------|---------|-----|
| **localhost testing** | ✅ Works | ❌ Doesn't work |
| **Must install PWA** | ❌ Optional | ✅ Required |
| **Browser support** | All major | Safari only |
| **Minimum version** | Any recent | iOS 16.4+ |
| **Permission prompt** | Automatic | Must be in installed PWA |

---

## 📞 Still Not Working?

1. **Check iOS version again** - Must be 16.4+
2. **Deploy to production** - localhost won't work
3. **Install as PWA** - "Add to Home Screen" in Safari
4. **Open from home screen** - Not from Safari
5. **Visit `/ios-test`** - See what's failing
6. **Check Vercel logs** - `vercel logs` for server errors

---

## 🎯 Quick Checklist

Before asking for help, verify:

- [ ] iOS 16.4 or higher
- [ ] Deployed to Vercel (HTTPS)
- [ ] Added to Home Screen in Safari
- [ ] Opening from home screen icon (not Safari)
- [ ] Granted notification permission IN the app
- [ ] `/ios-test` page shows all green checks
- [ ] Subscription exists (check /ios-test)
- [ ] VAPID keys set in Vercel environment

---

## 💡 Pro Tips

1. **Always test on production** - iOS doesn't support localhost push
2. **Close Safari completely** - Force quit, then open PWA from home screen
3. **Delete and reinstall** - If really stuck, delete app and reinstall from Safari
4. **Check iOS Settings** - Settings → WagerPals → Notifications must be ON
5. **Use /ios-test page** - It shows exactly what's wrong

---

## 🔗 Helpful Links

- [Apple's PWA Documentation](https://developer.apple.com/documentation/usernotifications)
- [iOS 16.4 Release Notes](https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-16_4-release-notes)
- [Can I Use - Web Push on iOS](https://caniuse.com/push-api)

---

**Remember:** iOS push notifications only work on iOS 16.4+ in installed PWAs opened from the home screen! 📱✨

