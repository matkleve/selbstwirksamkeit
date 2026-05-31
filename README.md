# Selbstwirksamkeit

Ein persönliches Erfolgs-Journal basierend auf Banduras Self-Efficacy-Forschung.

Du trägst kleine und große Erfolge ein — und wirst zufällig daran erinnert, mit dem Framing: *"Das war erst vor 3 Tagen. Vertrau dir."*

## Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth + Postgres)
- **Tailwind CSS v4**

## Setup

### 1. Supabase Projekt anlegen

1. Neues Projekt auf [supabase.com](https://supabase.com)
2. Im SQL Editor die Migration ausführen:

```sql
-- supabase/migrations/001_entries.sql (Inhalt copy-pasten)
```

### 2. Lokale Entwicklung

```bash
git clone https://github.com/DEIN_USER/selbstwirksamkeit
cd selbstwirksamkeit

npm install

cp .env.local.example .env.local
# .env.local mit deinen Supabase-Credentials befüllen

npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000)

### 3. Deployment (Vercel — empfohlen)

```bash
npx vercel
```

Umgebungsvariablen in Vercel Dashboard eintragen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Datenbankschema

```
entries
  id          uuid (PK)
  user_id     uuid (FK → auth.users)
  text        text
  category    text
  created_at  timestamptz
```

Row Level Security ist aktiviert — jeder User sieht nur seine eigenen Einträge.

## Projektstruktur

```
selbstwirksamkeit/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Haupt-App (Client Component)
│   └── globals.css
├── lib/
│   ├── supabase.ts       # Browser-Client
│   ├── types.ts          # Entry, Category
│   └── utils.ts          # timeAgo, nudgeText
└── supabase/
    └── migrations/
        └── 001_entries.sql
```

## Wissenschaftlicher Hintergrund

Albert Banduras Self-Efficacy-Theorie (1977) zeigt, dass Selbstwirksamkeit am stärksten durch *mastery experiences* wächst — also das bewusste Erinnern eigener Erfolge. Menschen unterschätzen systematisch wie kürzlich Erfolge waren. Die App wirkt diesem Bias direkt entgegen.
