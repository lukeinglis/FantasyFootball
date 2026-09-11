/**
 * Type for the arcade canvases.
 *
 * A canvas cannot take a class name, so its text has to be assembled as a CSS
 * font shorthand string by hand. Both games did that with a literal
 * "sans-serif", which meant the one part of the site that draws its own text
 * was also the one part that ignored the site's typefaces and rendered in
 * whatever the operating system happens to call sans-serif.
 *
 * These helpers read the same custom properties the rest of the page uses, so
 * a game headline is set in the display face and a score readout in the mono
 * face, exactly as they would be in markup.
 *
 * The lookup is cached because `getComputedStyle` forces style resolution, and
 * these run inside a requestAnimationFrame draw loop that may set the font a
 * dozen times a frame. It is resolved lazily rather than at module load
 * because the font loader has not written the variables yet at import time.
 */

const cache = new Map<string, string>();

function family(role: "display" | "mono" | "body"): string {
  const cached = cache.get(role);
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return "sans-serif";

  // next/font puts its variables on whichever element carries the generated
  // class, and the root layout puts them on <body>, not <html>. Checking only
  // documentElement returned an empty string and silently fell through to the
  // system default, which is how the arcade ended up outside the type system
  // in the first place.
  const resolved =
    getComputedStyle(document.body).getPropertyValue(`--wire-${role}`).trim() ||
    getComputedStyle(document.documentElement).getPropertyValue(`--wire-${role}`).trim();
  // Keep a generic on the end: next/font names are hashed per build, and a
  // miss should degrade to a readable face rather than to the browser default
  // serif.
  if (!resolved) return "sans-serif";
  // Only a real answer is cached. Caching a miss would pin the games to the
  // system face for the life of the page if a frame ever drew before the
  // variables were readable.
  const stack = `${resolved}, sans-serif`;
  cache.set(role, stack);
  return stack;
}

/** Headline and score type: the condensed display face. */
export function displayFont(weight: string, px: number): string {
  return `${weight} ${px}px ${family("display")}`;
}

/** Readouts, labels, and HUD chrome: the mono face. */
export function monoFont(weight: string, px: number): string {
  return `${weight} ${px}px ${family("mono")}`;
}

/** Running prose inside a game panel. */
export function bodyFont(weight: string, px: number): string {
  return `${weight} ${px}px ${family("body")}`;
}
