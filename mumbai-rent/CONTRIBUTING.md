# Contributing to mumbai.rent

Thanks for contributing to Mumbai's anonymous rent truth-map.

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (for local Supabase stack)
- Supabase CLI

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file and fill values:

   ```bash
   cp .env.local.example .env.local
   ```

3. Start local Supabase:

   ```bash
   supabase start
   ```

4. Apply PostGIS schema:

   ```bash
   supabase db reset
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/schema.sql
   ```

   > The schema enables PostGIS and creates all required tables/functions.

5. Start Next.js:

   ```bash
   npm run dev
   ```

## Notes on PostGIS in local Supabase

- `CREATE EXTENSION IF NOT EXISTS postgis;` is included in `supabase/schema.sql`.
- If extension creation fails, ensure your local Supabase stack image supports PostGIS.
- Keep all spatial operations in SRID 4326 to match Google Maps lat/lng coordinates.

## Pull request checklist

- Keep all TypeScript fully typed.
- Ensure API routes return JSON errors in shape `{ error: string }`.
- Run:

  ```bash
  npm run build
  ```

  before opening a PR.
