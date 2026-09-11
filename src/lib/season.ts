import historyData from "@/data/history.json";

/**
 * Season labels, derived rather than typed in.
 *
 * Page headers used to carry a hardcoded "2025 Season", which silently goes
 * stale the moment a new season is added to `history.json`. The history file
 * lists seasons newest-first and only ever contains completed ones, so its
 * first entry is the most recent season on record.
 */
const seasons = (historyData as { seasons: { year: number }[] }).seasons;

export const LAST_COMPLETED_SEASON: number = seasons[0]?.year ?? 0;

/** The season the league is currently playing, or about to. */
export const CURRENT_SEASON: number = LAST_COMPLETED_SEASON + 1;

/**
 * Header eyebrow for a page fed by the Yahoo API. "Live" is only true when the
 * feed actually answered; saying it above a "not connected" panel is a lie the
 * reader can see.
 */
export function feedLabel(connected: boolean): string {
  return connected ? "Live" : "Not connected";
}
