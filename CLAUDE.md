# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

**All feature work belongs on the `features` branch, never on `master`.**

```bash
git switch features          # or: git switch -c features origin/features
# ... make changes ...
git add <files>
git commit -m "feat: …"
git push origin features
```

`master` is for stable releases — only merge when the user explicitly asks.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (also generates public/sw.js via next-pwa)
npm run lint     # ESLint via next lint
```

No test suite exists in this project.

## Environment

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

### Data flow

`app/page.tsx` is a **Server Component** that calls `lib/supabase-server.ts` → `createServerSupabaseClient()` on every request. It checks the session server-side via `supabase.auth.getUser()`:

- **No session** → renders `<AuthForm />` (client component with its own Supabase browser client; calls `router.refresh()` after sign-in so the server re-runs and picks up the new cookie)
- **Authenticated** → fetches all entries and passes them as `initialEntries` to `<AppShell />` (eliminates the loading spinner)

All mutations (add/delete entry, sign-out) happen inside `AppShell` using the browser Supabase client from `lib/supabase.ts`. After sign-out, `router.refresh()` sends the user back to the auth screen.

### Component tree

```
app/page.tsx               ← Server Component, auth check + initial data fetch
├── components/auth-form.tsx       ← 'use client', email/password login+signup
└── components/app-shell.tsx       ← 'use client', owns tab state + entry state
    ├── components/dashboard-tab.tsx    ← streak, today's entries, memory cards
    ├── components/add-entry-tab.tsx    ← 'use client', textarea + category tags
    ├── components/reminder-tab.tsx     ← random past-entry nudge
    ├── components/entry-list-tab.tsx   ← 'use client', list with category filter
    └── components/category-pills.tsx   ← shared display-only pill row
```

### Theming

Light/dark/system preference is stored in `localStorage` under `selbstwirksamkeit-theme`. Theme is applied by toggling `.light`/`.dark` on `<html>`. An inline `<script>` in `app/layout.tsx` runs before paint to prevent FOUC. CSS custom properties in `app/globals.css` define all semantic color tokens (e.g. `--accent`, `--border`, `--muted`). Tailwind v4 maps these via `@theme inline` — there is no `tailwind.config.ts`.

### Key types (`lib/types.ts`)

- `Entry` — `{ id, user_id, text, categories: Category[], created_at }`
- `Category` — fixed union: `'allgemein' | 'studium' | 'arbeit / bewerbung' | 'projekt' | 'persönlich'`

### Database

Supabase Postgres with RLS — users only see their own rows. Migrations in `supabase/migrations/`. The `categories` column is `text[]` (migration 002 replaced the old single `category text` column).

## PWA

`app/manifest.ts` generates `/manifest.webmanifest` via Next.js built-in support. `@ducanh2912/next-pwa` (configured in `next.config.ts`) generates `public/sw.js` during production build — that file is gitignored. Service worker is disabled in development.

Current icons in `public/icons/` are SVG placeholders. Replace with real PNG files for full iOS PWA support:
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512, maskable)

## Deployment

Production: <https://selbstwirksamkeit.vercel.app>  
Deploy with `npx vercel`. Set the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel dashboard.
