# Selbstwirksamkeit — Product Overview

## Mission
A private, daily journal that helps users track their psychological self-efficacy using a
2D emotional grid. Over time, patterns emerge that reveal how internal states, relationships,
and contexts shape mood and agency.

## Core Concept
Every entry is placed on a grid:
- **X axis (Valenz):** −5 (very difficult/negative) to +5 (very positive/good)
- **Y axis (Referenz):** −5 (self-focused) to +5 (other-focused)

This creates four quadrants with distinct psychological meanings, enabling nuanced
tracking beyond simple "good/bad" mood logging.

## User Journey
1. User opens app → places dot on grid → writes reflection text
2. Contextual chips add who, where, what activity
3. Body state (gestresst / ruhig / müde) enriches physiological context
4. Negative entries trigger optional cognitive reframe
5. Dashboard and Motivation pages surface patterns and growth insights over time

## Tech Stack
- Next.js 15 App Router (server + client components)
- Supabase Auth + Postgres with RLS
- Tailwind CSS v4 (`@theme inline` for CSS-var-backed tokens)
- DM Sans (body) + DM Serif Display (quotes, titles)
- lucide-react icons, recharts for data visualisation
- @ducanh2912/next-pwa for PWA/service-worker

## Routing
| Route | Purpose |
|---|---|
| `/` | New entry (home) |
| `/dashboard` | Analytics — balance, calendar heatmap, time-of-day, quadrant map |
| `/motivation` | Research-backed insights + exercises from the user's own data |
| `/timeline` | Full scrollable entry list |
| `/mirror` | Mirror landing — open insight, session history, reminders (see `mirror-page.md`) |
| `/reset-password` | Auth flow |
| `/auth/callback` | Supabase PKCE callback |
