/**
 * The position palette.
 *
 * Position is the one genuinely categorical dimension on the site: a QB is not
 * more or less than a WR, so it is the one place that gets unordered hue rather
 * than ink weight. Everything else that looked like a colour scale (draft
 * round, finish, win percentage) is ordered, and is set in ink instead.
 *
 * This lives apart from `records.ts` because that module reads the draft files
 * off disk, and a client component that only wants a chip colour should not
 * drag `fs` into the browser bundle.
 *
 * The class names are written out in full on purpose. Tailwind scans source
 * text, so a name assembled at runtime with string replacement gets purged and
 * the chip renders unstyled.
 */

/** Chip styling for a position badge: pale fill, dark text, hairline edge. */
export const POS_COLORS: Record<string, string> = {
  QB: "bg-rose-100 text-rose-700 border-rose-300",
  RB: "bg-emerald-100 text-emerald-700 border-emerald-300",
  WR: "bg-sky-100 text-sky-700 border-sky-300",
  TE: "bg-amber-100 text-amber-700 border-amber-300",
  K: "bg-violet-100 text-violet-700 border-violet-300",
  DEF: "bg-slate-100 text-slate-700 border-slate-300",
};

/**
 * Text-only variant, for a position label that sits on paper rather than in a
 * chip.
 */
export const POS_TEXT: Record<string, string> = {
  QB: "text-rose-700",
  RB: "text-emerald-700",
  WR: "text-sky-700",
  TE: "text-amber-700",
  K: "text-violet-700",
  DEF: "text-slate-700",
};

/**
 * Solid fills for stacked bars, held at the same depth as POS_TEXT so a bar
 * segment and its legend read as the same colour. The brighter 500 shades were
 * legible but sat like candy against newsprint.
 */
export const POS_FILL: Record<string, string> = {
  QB: "bg-rose-700",
  RB: "bg-emerald-700",
  WR: "bg-sky-700",
  TE: "bg-amber-700",
  K: "bg-violet-700",
  DEF: "bg-slate-700",
};
