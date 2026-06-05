# F1Pulse

Real-time Formula 1 live timing, standings, analytics and more.

Built with React + Vite, Supabase, Vercel and the OpenF1 API.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Database/Auth**: Supabase
- **Hosting**: Vercel
- **Data**: OpenF1 API (openf1.org)
- **Payments**: Stripe

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://iojsrgpgrustpmvqcfpe.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_OPENF1_API_KEY=...
VITE_OPENF1_API_PASSWORD=...
VITE_STRIPE_PRICE_ID=price_...
```

### 3. Database

Run the migration in the Supabase dashboard SQL editor:

```
supabase/migrations/001_init.sql
```

### 4. Stripe setup

1. Create a product in Stripe dashboard: "F1Pulse Pro" — £3.99/month recurring
2. Copy the Price ID to `VITE_STRIPE_PRICE_ID`
3. Add Supabase edge function secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. Deploy edge functions via Supabase dashboard:
   - `supabase/functions/create-checkout/index.ts`
   - `supabase/functions/stripe-webhook/index.ts`
5. Set up a Stripe webhook pointing to your `stripe-webhook` function URL for events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`

### 5. OpenF1 Secrets (edge functions)

In Supabase dashboard → Edge Functions → Secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy

Push to GitHub — Vercel auto-deploys. Add all `VITE_*` env vars in Vercel project settings.

## Features

### Free
- Live timing (10s refresh)
- Driver & constructor standings
- Race calendar
- Circuits

### Pro (£3.99/mo)
- Live timing with ~3s refresh
- Advanced analytics (lap charts, driver comparison, stint analysis)
- Mini-sector breakdowns
- Team radio
- Track map with live positions

## Notes

- OpenF1 data is available from 2023 onwards
- Live data requires the Sponsor tier on OpenF1 (which you have)
- The app is fully standalone — it shares nothing with swindon-airsoft.com
