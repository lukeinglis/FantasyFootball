# AI Image Generation Prompts

## 1. Hero Backyard Scene

Use with DALL-E 3 or GPT-4o image generation. Generate at 1792x1024 (landscape).

### Prompt:
A wide-angle illustration of a suburban backyard during a late afternoon cookout, in the style of Humongous Entertainment's Backyard Football (late 1990s PC game). The scene is warm, colorful, and hand-painted looking.

The backyard features:
- A worn grass "football field" patch in the center with faded chalk lines
- A hand-painted wooden scoreboard leaning against a fence (left side)
- A clipboard with a lineup sheet clipped to the wooden fence
- A folding card table with draft cards scattered on it
- A trophy shelf or small display case near the grill with tiny gold trophies
- A charcoal grill with smoke rising, a cooler beside it, and lawn chairs
- A clothesline with colorful team jerseys hanging
- A cork bulletin board on the fence with pinned notes
- A small doghouse with a funny "SHAME" sign
- A kiddie arcade cabinet (like a mini Street Fighter machine) in the corner
- A chalkboard mounted on the fence with stats written in chalk
- A folding table set up as a "swap meet" with a hand-lettered "TRADES" sign
- String lights hanging overhead between the house and fence
- A suburban fence (wooden, not chain link) around the yard
- Warm sunset sky with soft clouds

Style: Painterly, slightly cartoonish, warm color palette (grass greens, sky blues, wood browns, sunset oranges). Hand-drawn feel, thick outlines, slightly imperfect. Not photorealistic. Think Backyard Football game art meets Norman Rockwell warmth. No people/characters visible — this is the setting, not a portrait.

### Negative prompt (if supported):
No photorealism, no 3D rendering, no dark/moody lighting, no modern UI elements, no text overlays

---

## 2. Manager Avatar Prompts

Use with DALL-E 3 or GPT-4o. Generate each at 512x512 (square).

### Base style prompt (prepend to each):
"A cartoon portrait in the style of Humongous Entertainment's Backyard Sports games (late 1990s). Bobblehead proportions: oversized round head, small body. Wearing a football jersey and backwards baseball cap. Bright, friendly expression. Simple solid-color background. Thick black outlines. Flat shading with warm colors. No text."

### Per-manager variations:
Generate each with a different jersey color and slight variation in expression/pose. Use these jersey color assignments:

1. Austin — Red jersey (#D32F2F)
2. Bryan — Blue jersey (#1565C0)
3. Cody — Green jersey (#2E7D32)
4. Colin — Purple jersey (#7B1FA2)
5. Damaso — Orange jersey (#E65100)
6. Evan — Teal jersey (#00838F)
7. Greg — Yellow jersey (#F9A825)
8. John — Navy jersey (#1A237E)
9. Kyle — Maroon jersey (#880E4F)
10. Luke — Burnt orange jersey (#DD550C)
11. Patrick — Gold jersey (#FFD700) — defending champion, add a tiny crown or trophy detail
12. Phil — Forest green jersey (#1B5E20)
13. Rob — Steel blue jersey (#455A64)
14. Ross — Crimson jersey (#B71C1C)
15. Trey — Cyan jersey (#0097A7)
16. Tyler — Lime jersey (#689F38)
17. Zach — Coral jersey (#FF7043)

### Usage:
After generating, save as `/public/avatars/{name}.png` (lowercase) and reference in members.json or the manager card components.

