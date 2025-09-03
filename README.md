# Top 100 Youth Cup — S26 (Next.js + Tailwind)

MVP app for registration → group draw → fixtures → live tables → seeded Round of 32.

This repo includes a **built-in registration page** (`/register`) so everything lives in one place.
The current build persists to **localStorage** for instant use. Hooks are ready for swapping storage to Supabase.

## Quick start

```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

Open:
- `/` — dashboard (Entrants, Settings, Groups, Fixtures, Tables, Knockout32)
- `/register` — public registration form (writes to localStorage in MVP)

## Roadmap (swap storage to Supabase)

- Add API routes to write/read entrants, fixtures, results.
- Netlify Function `forms-webhook` for optional Google Forms ingestion.
- Admin auth (Netlify Identity) to lock rounds & tables.
- Public embeds for Groups/Tables/Bracket.
- Tiebreaker configuration incl. Head-to-Head.

## Notes
- Timezone default: **Europe/London**.
- Forfeits record as 3–0 to the non-offending side in MVP.
- JSON export available from dashboard.
