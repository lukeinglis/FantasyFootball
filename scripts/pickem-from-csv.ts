/**
 * Fold an Airtable pick'em CSV export into src/data/pickem.json.
 *
 * Only `entries` is rewritten; the games and roster stay hand-authored, so the
 * script is safe to re-run each time more picks land.
 *
 * Usage: npx tsx scripts/pickem-from-csv.ts "~/Downloads/Table 1-Grid view.csv"
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const dataPath = resolve(
  import.meta.dirname || __dirname,
  "../src/data/pickem.json",
);

interface Team {
  seed: number;
  name: string;
  record: string;
}
interface Game {
  id: number;
  teams: [Team, Team];
}
interface Pick {
  team: string;
  total: number;
}
interface Entry {
  name: string;
  picks: Pick[];
  total: number;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Airtable writes the winner as "#5: King Cakes"; we store just the name. */
function stripSeed(value: string): string {
  const idx = value.indexOf(":");
  return (idx === -1 ? value : value.slice(idx + 1)).trim();
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/pickem-from-csv.ts <path-to-csv>");
  process.exit(1);
}

const file = JSON.parse(readFileSync(dataPath, "utf8")) as {
  roster: string[];
  games: Game[];
  entries: Entry[];
};

const rows = parseCsv(
  readFileSync(csvPath.replace(/^~/, process.env.HOME ?? "~"), "utf8"),
);
const header = rows[0].map((h) => h.trim());
const body = rows.slice(1);

const gameCols = file.games.map((g) => {
  const pickCol = header.indexOf(`Game ${g.id}`);
  const totalCol = header.indexOf(`Game ${g.id} total points`);
  if (pickCol === -1 || totalCol === -1) {
    throw new Error(`CSV is missing columns for Game ${g.id}`);
  }
  return { game: g, pickCol, totalCol };
});

/**
 * Managers sometimes type a nickname into the form. Map those back to the
 * name the rest of the site uses, so the pick'em page matches the records
 * and history pages.
 */
const NAME_ALIASES: Record<string, string> = {
  Dom: "Damaso",
};

const problems: string[] = [];
const entries: Entry[] = body.map((row) => {
  // Airtable's primary field is "Name-Total", e.g. "Cody-2045".
  const raw = row[header.indexOf("Name")].split("-")[0].trim();
  const name = NAME_ALIASES[raw] ?? raw;

  const picks = gameCols.map(({ game, pickCol, totalCol }) => {
    const team = stripSeed(row[pickCol]);
    const total = Number(row[totalCol]);

    const valid = game.teams.some((t) => t.name === team);
    if (!valid) {
      problems.push(
        `${name} picked "${team}" in Game ${game.id}, which is not ${game.teams
          .map((t) => `"${t.name}"`)
          .join(" or ")}`,
      );
    }
    if (!Number.isFinite(total)) {
      problems.push(`${name} has a non-numeric total for Game ${game.id}`);
    }
    return { team, total };
  });

  const total = picks.reduce((sum, p) => sum + p.total, 0);
  const stated = Number(row[header.indexOf("Total points")]);
  if (Number.isFinite(stated) && stated !== total) {
    problems.push(
      `${name}: game totals sum to ${total} but the CSV says ${stated}`,
    );
  }

  return { name, picks, total };
});

for (const entry of entries) {
  if (!file.roster.includes(entry.name)) {
    problems.push(
      `"${entry.name}" is not in the roster in pickem.json — check the spelling`,
    );
  }
}

if (problems.length > 0) {
  console.error("Refusing to write, the CSV did not line up:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

entries.sort((a, b) => a.name.localeCompare(b.name));
file.entries = entries;
writeFileSync(dataPath, `${JSON.stringify(file, null, 2)}\n`);

const missing = file.roster.filter(
  (m) => !entries.some((e) => e.name === m),
);
console.log(`Wrote ${entries.length} entries to src/data/pickem.json`);
console.log(
  missing.length > 0
    ? `Still waiting on: ${missing.join(", ")}`
    : "All 12 managers are in.",
);
