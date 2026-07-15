# Backyard Hub — Asset Preparation Guide

This document describes how to prepare the Figma assets for the interactive backyard homepage at football.lukeinglis.me. The final illustrated scene is the navigation hub — each object in the backyard is a clickable zone that routes to a page.

## Final Scene Reference

The final approved illustration is at:
`/Users/linglis/.claude/image-cache/d7a7ca74-3abb-4c0f-9deb-d069c423cfe0/4.png`

Also save a copy to the repo as `public/backyard/scene-full.png`.

---

## Zone-to-Route Mapping

| # | Object in scene | Asset name | Routes to | Dynamic content? |
|---|----------------|-----------|-----------|:---:|
| 1 | Standings chalkboard (top-left) | `standings-board` | `/standings` | Yes |
| 2 | Arcade cabinet (left-center) | `arcade-cabinet` | `/games` | No |
| 3 | Articles clipboard (left) | `articles-clipboard` | `/articles` | No |
| 4 | Jerseys on clothesline (top-center) | `jerseys` | `/managers` | No |
| 5 | Retro TV (center) | `tv-frame` | `/stats` | Yes |
| 6 | Hall of Champions shelf (top-right) | `hall-of-champions` | `/history` | No |
| 7 | Matchups cork board (right) | `matchups-board` | `/matchups` | Yes |
| 8 | Grill area (right) | `grill-area` | `/league` | No |
| 9 | Doghouse (bottom-left) | `doghouse` | `/records?tab=hall-of-shame` | No |
| 10 | Draft table (bottom-center) | `draft-table` | `/draft` | No |
| 11 | Record book (on draft table) | `record-book` | `/records` | No |
| 12 | Laptop on cooler (bottom-center-right) | `laptop-cooler` | External: Yahoo Fantasy | No |
| 13 | Trades table (bottom-right) | `trades-table` | `/transactions` | No |
| 14 | "Greybushes & Chili Dogs" sign (top-left) | `league-sign` | `/` (home) | No |

---

## Dynamic Content Zones

Three zones will have live HTML data overlaid on top of the illustrated surface:

### 1. Standings Chalkboard
- **Surface:** Green chalkboard with wood frame
- **HTML overlay style:** Chalk-white text (#F5F0E8) on green (#2A4A3A), Nunito or handwriting font, faint grid lines
- **Data:** Live W-L standings table from Yahoo API

### 2. Matchups Cork Board
- **Surface:** Cork bulletin board with pushpins
- **HTML overlay style:** Cream-colored cards with pushpin accents, slight rotation on cards, handwriting-style font for team names and scores
- **Data:** This week's live matchup scores

### 3. TV Screen
- **Surface:** CRT television with dark screen
- **HTML overlay style:** Dark background with slight CRT glow/scanline effect, monospace or pixel font, green/amber text
- **Data:** Stats, power rankings, or rotating content

---

## Figma Workflow

### Step 1: Import the full scene
- Import the final backyard PNG into a new Figma file
- Set the frame to match the image resolution (1792x1024 or similar)
- Lock this as your reference layer

### Step 2: Trace click zones
- Create a new rectangle on top of the image for each of the 14 clickable objects
- Draw the rectangle to cover the full bounds of each object
- Name each rectangle with the asset name from the mapping table above
- These rectangles define the click areas

### Step 3: Export the 3 dynamic zone assets
These are the only objects that need to be exported as separate PNGs:

| Asset | What to include | Export settings |
|-------|----------------|----------------|
| `standings-board.png` | Full chalkboard: wood frame + green fill + "STANDINGS" header | 2x resolution, transparent background |
| `matchups-board.png` | Full cork board: frame + cork texture + "MATCHUPS" label + pushpins | 2x resolution, transparent background |
| `tv-frame.png` | Full TV: bezel + dark screen + wooden stand | 2x resolution, transparent background |

These get rendered as real `<img>` elements with HTML content positioned behind/over them.

### Step 4: Background approach (choose one)

**Option A (recommended — simpler):**
Use the full unmodified scene as one background image (`scene-full.png`). The clickable zones are invisible positioned `<div>` elements overlaid at the correct coordinates. No need to erase objects from the background.

**Option B (advanced):**
Duplicate the full scene and erase/paint-fill the 14 clickable objects, leaving just the background (sky, fence, grass, string lights, decorative items). Export as `scene-background.png`. Each clickable object is then exported as its own transparent PNG and positioned via CSS. More work but allows individual hover effects on each object.

### Step 5: Record zone coordinates
For each of the 14 clickable zones, note the rectangle's position in Figma:

```
Zone name: standings-board
X: ___px  (from left edge)
Y: ___px  (from top edge)  
Width: ___px
Height: ___px
```

Then convert to percentages:
- x% = (X / frame width) * 100
- y% = (Y / frame height) * 100
- w% = (Width / frame width) * 100
- h% = (Height / frame height) * 100

Or just share the Figma file — coordinates can be extracted from the rectangle positions.

---

## What to Deliver

| File | Description | Required? |
|------|------------|:---------:|
| `public/backyard/scene-full.png` | Full unmodified scene, highest resolution | Yes |
| `public/backyard/standings-board.png` | Chalkboard asset for dynamic overlay | Yes |
| `public/backyard/matchups-board.png` | Cork board asset for dynamic overlay | Yes |
| `public/backyard/tv-frame.png` | TV frame asset for dynamic overlay | Yes |
| Zone coordinate list (or Figma file link) | x%, y%, w%, h% for each of the 14 click zones | Yes |
| `public/backyard/scene-background.png` | Scene with objects removed (only if using Option B) | Optional |
| Individual zone PNGs (only if using Option B) | Each clickable object as transparent PNG | Optional |

---

## Implementation (what happens after assets are delivered)

1. **BackyardHub component** already exists at `src/components/home/BackyardHub.tsx` — will be rewritten to use the illustration instead of the current CSS card grid
2. The full scene image loads as a responsive `<Image>` via Next.js
3. Invisible `<Link>` elements are positioned over each zone using absolute positioning with percentage coordinates
4. The 3 dynamic zones get the exported frame PNGs as overlays with live HTML content behind them
5. Hover effects: subtle highlight/glow on each zone (CSS only)
6. Below 768px: the illustrated scene hides, replaced by a labeled card grid (already built) for mobile users
7. Below the hub: defending champion banner, season stats, dynasty rankings, live previews, articles (already built)

---

## AI Image Prompts

For reference, the hero scene and manager avatar prompts are saved in:
`image-prompts.md` (repo root)

### Manager Avatars (future task)
17 bobblehead-style cartoon portraits in Backyard Sports art style. One per manager with assigned jersey colors. Prompts are in `image-prompts.md`. Save generated images to `public/avatars/{name}.png`.

---

## Design Decisions Log

These decisions were made during the design process:

- **TV replaces stats chalkboard** as the primary dynamic content display
- **Cork board = Matchups** (moved from clipboard, which became Articles)
- **Doghouse = Wall of Shame** (links to `/records?tab=hall-of-shame`)
- **Jerseys = Manager Cards** zone, 5 jerseys with Auburn QB names (Newton, Marshall, Stidham, Nix, White)
- **Grill area = League Info** (rules + payouts)
- **Laptop on cooler = Yahoo Fantasy** external link
- **Auburn touches:** AU logos, War Eagle pennant, Auburn helmet, orange/blue bunting
- **No dynamic content overlaid directly on the illustration** except for the 3 designated zones (standings, matchups, TV)
- **Mobile:** Scene replaced by card grid below 768px
- **Stats + Power Rankings:** Merged into `/stats` with tabs (already implemented)
- **Mini-games:** Moved to dedicated `/games` page (already implemented)
