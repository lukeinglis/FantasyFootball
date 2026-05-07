# Greybushes & Chili Dogs

Fantasy football league homepage, powered by Yahoo Fantasy Sports API and deployed on Vercel.

**Live site:** [football.lukeinglis.me](https://football.lukeinglis.me)

## Features

- **Live Standings** with playoff cutoff indicator
- **Weekly Matchups** with week selector and live scores
- **Team Detail** pages with roster, matchup history, and stats
- **Draft Board** (snake/linear) with position color coding
- **Transaction Log** with add/drop/trade filtering
- **Record Book** for all-time league records
- **League History** with past champions table
- **Wall of Shame** for last-place punishments
- **League Rules** page
- **Members** roster (active + emeritus)
- **Payouts** with prize breakdown
- **Articles** via MDX for league commentary

## Tech Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS 4
- Yahoo Fantasy Sports API (OAuth 2.0)
- Vercel KV for distributed caching
- MDX for articles

## Setup

### 1. Clone and install

```bash
git clone git@github.com:lukeinglis/FantasyFootball.git
cd FantasyFootball
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `YAHOO_CLIENT_ID` | Yes | From [Yahoo Developer](https://developer.yahoo.com/apps/create/) |
| `YAHOO_CLIENT_SECRET` | Yes | From Yahoo Developer app |
| `YAHOO_REDIRECT_URI` | Yes | `http://localhost:3000/api/auth/callback` (dev) |
| `YAHOO_LEAGUE_ID` | Yes | Your league's numeric ID (default: `655705`) |
| `YAHOO_GAME_KEY` | No | `nfl` to auto-discover, or a numeric key |
| `KV_REST_API_URL` | No | Vercel KV endpoint (omit for in-memory cache) |
| `KV_REST_API_TOKEN` | No | Vercel KV token |
| `CRON_SECRET` | No | Bearer token for `/api/cron/refresh` |

### 3. Register a Yahoo Developer App

1. Go to [developer.yahoo.com/apps/create/](https://developer.yahoo.com/apps/create/)
2. Set **Redirect URI** to `http://localhost:3000/api/auth/callback`
3. Enable **Fantasy Sports** read access
4. Copy the Client ID and Client Secret to `.env.local`

### 4. Start dev server and authenticate

```bash
npm run dev
```

Visit `http://localhost:3000/api/auth/yahoo` to start the OAuth flow. After approving, you'll be redirected back and tokens will be stored.

### 5. Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (update `YAHOO_REDIRECT_URI` to your production callback URL)
4. Add a Vercel KV store and connect it
5. Visit `/api/auth/yahoo` on the deployed site to authenticate
6. Optionally set `CRON_SECRET` and the daily cron job will pre-warm caches

## Data Files

Static data lives in `src/data/`. Edit these JSON files directly:

| File | Purpose |
|------|---------|
| `members.json` | Active and emeritus league members |
| `history.json` | Past season champions, runners-up, third place |
| `payouts.json` | Buy-in, prize structure, weekly payouts |
| `punishments.json` | Last-place punishments for Wall of Shame |
| `records.json` | All-time league records |
| `rules.json` | League rules and bylaws |

## Articles

Add MDX files to `src/content/articles/` with frontmatter:

```yaml
---
title: "Your Article Title"
date: 2026-08-15
author: "Your Name"
excerpt: "Short preview text"
---
```

## Project Structure

```
src/
  app/           # Next.js pages and API routes
  components/    # Shared React components
  content/       # MDX articles
  data/          # Static JSON data files
  lib/           # Utilities, Yahoo client, caching
    yahoo/       # Yahoo Fantasy API client + auth
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```
