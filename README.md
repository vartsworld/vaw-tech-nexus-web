# VAW Technologies – Web Platform

Public marketing site plus the client, staff, HR, sales and admin portals for VAW Technologies.
Built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui and Supabase.

## Getting started

```bash
npm ci
npm run dev        # http://localhost:8080
npm run build      # production build into dist/
npm run lint
npx tsc -p tsconfig.app.json   # type check
```

## Repository layout

| Path | What lives here |
| --- | --- |
| `src/pages` | Route-level pages (lazy-loaded from `src/App.tsx`) |
| `src/components` | Shared and feature components (`pricing/`, `staff/`, `hr/`, `ui/` …) |
| `src/lib` | Pure helpers (pricing maths and validation, inquiry submission, utils) |
| `src/hooks` | Reusable hooks (e.g. `usePricingData`) |
| `src/integrations/supabase` | Supabase client and generated types |
| `supabase/migrations` | Database migrations applied to the Supabase project |
| `supabase/functions` | Edge functions |
| `public` | Static assets (fonts, images, manifests, sitemap, robots) |
| `docs` | Project notes and guides (all former root-level `.md` files) |
| `docs/sql` | One-off SQL scripts and schema references (former root-level `.sql` files) |
| `scripts` | Maintenance / verification scripts |
| `website_content` | Copy decks for the public pages |

## Pricing & quote requests

`/pricing` is a small storefront: visitors pick a package, add any number of add-ons, review the
estimate, then send their details. A second tab takes custom / special requests.
Packages, add-ons and the promo banner are managed from **HR → Pricing Manager**.
Requests are stored in the `inquiries` table (see `supabase/migrations/20261023000000_inquiries_public_insert.sql`)
and appear under **Admin → Pricing Inquiries**.

## Environment

The Supabase client uses the public anon key from `src/integrations/supabase/client.ts`. Do not commit `.env`
files; copy `.env.example` if you need local overrides.
