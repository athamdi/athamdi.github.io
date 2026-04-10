# mumbai.rent

Mumbai's anonymous rent truth-map. Users can drop rent pins without login, draw polygons to get instant area rent stats, and discover flatmates via private email relay.

## Tech stack

- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Postgres + PostGIS)
- Google Maps (`@vis.gl/react-google-maps`)
- Resend
- PostHog
- Vercel

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env template:

   ```bash
   cp .env.local.example .env.local
   ```

3. Fill in all env vars in `.env.local`.

4. Run local dev:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser key with Maps JS + Drawing enabled |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by browser and server routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged writes and reports |
| `RESEND_API_KEY` | Resend API key for flatmate connection relay |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL (default: `https://app.posthog.com`) |

## Supabase setup

1. Ensure PostGIS is available for your database.
2. Run `supabase/schema.sql` in your Supabase SQL editor.
3. (Recommended) Enable Row Level Security and add policies as needed for your deployment model.

## API routes

- `GET /api/pins` → active pins (not expired, report_count < 3)
- `POST /api/pins` → create a pin with IP hash rate limiting (max 3/day per hash)
- `POST /api/pins/[id]` with `{ action: "report" }` → increment report count
- `POST /api/stats` → polygon stats via Postgres function
- `POST /api/connect` → relay seeker message to owner via Resend (logs attempt)

## Deploy to Vercel

One-line deploy after pushing:

```bash
vercel --prod
```
