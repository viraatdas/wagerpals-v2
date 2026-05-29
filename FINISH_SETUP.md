# WagerPals — Finish Setup (your action items)

Everything below is code-complete. These steps need credentials/logins only you can do.

---

## 1. iMessage extension → get the iOS build green

**Why it was failing:** the iMessage extension ships as its own app target with bundle id
`com.wagerpals.app.messages`. The EAS production builds errored with:

```
No profiles for 'com.wagerpals.app.messages' were found. Automatic signing is
disabled and unable to generate a profile.
```

The extension code + Expo config plugin are correct (prebuild succeeds, the build only
fails at the signing step). EAS just has no Apple provisioning profile for the extra
bundle id. You have to create it once, interactively, logged into Apple.

### Runbook (run from the `mobile/` directory)

```bash
cd mobile

# 1. Make sure you're on the right Expo account (the project owner is "birud")
npx eas whoami            # should print: birud

# 2. Set up credentials for the EXTENSION target interactively.
#    Do NOT pass --non-interactive — you need to answer the Apple 2FA prompt.
npx eas credentials --platform ios
#   → choose: production  (build profile)
#   → when asked for the target/bundle id, pick / add:  com.wagerpals.app.messages
#   → "Set up a new Distribution Certificate / Provisioning Profile?"  → Yes
#   → log in with your Apple Developer account (Apple ID + app-specific password
#     or 2FA code). Apple team id is 3C4383262W.
#   EAS will register the App ID com.wagerpals.app.messages and generate the
#   distribution provisioning profile for it.
#   Repeat for the main app id com.wagerpals.app if EAS says it's missing too.

# 3. Now build for the store (interactive, so it can finish any Apple prompts)
npx eas build --platform ios --profile production

# 4. When the build is green, submit to TestFlight / App Store
npx eas submit --platform ios --latest
```

If `eas credentials` doesn't surface the extension bundle id automatically, run a build
once first — `npx eas build --platform ios --profile production` — and when it reaches
credentials it will prompt: *"You don't have credentials for target
com.wagerpals.app.messages, generate them now?"* → **Yes** → Apple login. That single
interactive build registers the profile; future builds reuse it.

---

## 2. Stripe (real-money wallet) → add your keys

The wallet backend is finished and the DB tables are live (`wallets`, `transactions`
created, wallets backfilled for all existing users). It will start working the moment
these keys exist. **Use TEST keys first** (`sk_test_…` / `pk_test_…`) to verify, then
swap to live keys.

Add these in **Vercel → wagerpals-v2 → Settings → Environment Variables** (Production):

| Key | Where to get it | Used by |
|-----|-----------------|---------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_…` / `sk_live_…`) | `/api/wallet`, webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | same page (`pk_test_…` / `pk_live_…`) | profile deposit form (client) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → "Signing secret" (`whsec_…`) | webhook signature check |

### Wire the webhook (one time, in the Stripe Dashboard)
1. Developers → Webhooks → **Add endpoint**
2. Endpoint URL: `https://www.wagerpals.io/api/webhooks/stripe`
3. Events to send: `payment_intent.succeeded` and `payment_intent.payment_failed`
4. Copy the **Signing secret** → that's `STRIPE_WEBHOOK_SECRET` above.

After adding the env vars, redeploy (or `vercel --prod`) so they take effect.

> Compliance note: this moves real money. Before going to **live** keys, make sure you
> understand Stripe's terms for your use case (collecting funds, payouts/withdrawals).
> Deposits use Stripe PaymentIntents; withdrawals currently just debit the in-app wallet
> balance (they do not yet push money back out via Stripe payouts — wire that separately
> if you need real cash-out).

---

## 3. Promote the redesign to production

The new "Midnight Glass" design is on branch `redesign/midnight-glass` and deployed to a
preview. When you're happy with it:

```bash
git checkout main && git merge redesign/midnight-glass
npx vercel --prod     # or just push main if Vercel git auto-deploy is on
```
