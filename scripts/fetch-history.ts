/**
 * One-time script to fetch historical league data from Yahoo Fantasy API.
 * Pulls standings for each past season and writes to src/data/history.json.
 *
 * Usage: npx tsx scripts/fetch-history.ts
 */

import { readFileSync } from "fs";

// Load .env.local manually (no dotenv dependency needed)
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found, rely on existing env */ }

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";
const LEAGUE_ID = process.env.YAHOO_LEAGUE_ID || "655705";

// Yahoo NFL game keys by season (2013-2025)
const NFL_GAME_KEYS: Record<number, string> = {
  2013: "314",
  2014: "331",
  2015: "348",
  2016: "359",
  2017: "371",
  2018: "380",
  2019: "390",
  2020: "399",
  2021: "406",
  2022: "414",
  2023: "423",
  2024: "449",
  2025: "461",
};

interface SeasonRecord {
  year: number;
  champion?: string;
  championTeam?: string;
  runnerUp?: string;
  runnerUpTeam?: string;
  third?: string;
  thirdTeam?: string;
  lastPlace?: string;
  lastPlaceTeam?: string;
  notes?: string;
}

async function getToken(): Promise<string> {
  // Try to read from Vercel KV first, fall back to env
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/yahoo:tokens`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const tokens = JSON.parse(data.result);
          // Check if token needs refresh
          if (Date.now() + 5 * 60 * 1000 < tokens.expiresAt) {
            return tokens.accessToken;
          }
          // Refresh the token
          return await refreshToken(tokens.refreshToken);
        }
      }
    } catch (e) {
      console.error("KV read failed:", e);
    }
  }

  throw new Error(
    "No tokens found. Make sure KV_REST_API_URL and KV_REST_API_TOKEN are set in .env.local, " +
    "and you have authenticated via the website first."
  );
}

async function refreshToken(refreshTokenValue: string): Promise<string> {
  const clientId = (process.env.YAHOO_CLIENT_ID || "").replace(/&$/, "");
  const clientSecret = process.env.YAHOO_CLIENT_SECRET || "";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function yahooFetch(path: string, token: string): Promise<unknown> {
  const url = `${YAHOO_API_BASE}${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 999) {
    console.warn(`  Rate limited on ${path}, waiting 30s...`);
    await new Promise((r) => setTimeout(r, 30000));
    return yahooFetch(path, token);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Yahoo API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

function dig(obj: unknown, ...keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

async function fetchSeasonStandings(
  year: number,
  gameKey: string,
  token: string
): Promise<SeasonRecord | null> {
  const leagueKey = `${gameKey}.l.${LEAGUE_ID}`;
  console.log(`  Fetching ${year} season (${leagueKey})...`);

  try {
    const raw = await yahooFetch(`/league/${leagueKey}/standings`, token);
    const league = dig(raw, "fantasy_content", "league");
    const standingsData = Array.isArray(league) ? (league as unknown[])[1] : null;
    const teamsObj = (standingsData as Record<string, unknown>)?.standings;
    const teamsArray = Array.isArray(teamsObj) ? (teamsObj[0] as Record<string, unknown>)?.teams : {};

    const count = (teamsArray as Record<string, unknown>)?.count as number || 0;
    if (count === 0) {
      console.log(`  No teams found for ${year}`);
      return null;
    }

    interface TeamInfo {
      rank: number;
      teamName: string;
      managerName: string;
    }

    const teams: TeamInfo[] = [];
    for (let i = 0; i < count; i++) {
      const teamData = (teamsArray as Record<string, unknown>)[String(i)];
      const td = (teamData as Record<string, unknown>)?.team;
      if (!td) continue;

      const info = Array.isArray(td) ? td[0] : td;
      const standings = Array.isArray(td) ? (td[1] as Record<string, unknown>)?.team_standings : null;

      const infoArray = Array.isArray(info) ? info : [info];
      const flat: Record<string, unknown> = {};
      for (const item of infoArray) {
        if (typeof item === "object" && item !== null) {
          Object.assign(flat, item);
        }
      }

      teams.push({
        rank: (standings as Record<string, unknown>)?.rank as number || 99,
        teamName: flat.name as string || "",
        managerName:
          ((flat.managers as unknown[])?.[ 0] as Record<string, unknown>)?.manager
            ? ((((flat.managers as unknown[])[0]) as Record<string, unknown>).manager as Record<string, unknown>)?.nickname as string || ""
            : "",
      });
    }

    teams.sort((a, b) => a.rank - b.rank);
    const last = [...teams].sort((a, b) => b.rank - a.rank)[0];

    const record: SeasonRecord = { year };
    if (teams[0]) {
      record.champion = teams[0].managerName || teams[0].teamName;
      record.championTeam = teams[0].teamName;
    }
    if (teams[1]) {
      record.runnerUp = teams[1].managerName || teams[1].teamName;
      record.runnerUpTeam = teams[1].teamName;
    }
    if (teams[2]) {
      record.third = teams[2].managerName || teams[2].teamName;
      record.thirdTeam = teams[2].teamName;
    }
    if (last && last.rank > 2) {
      record.lastPlace = last.managerName || last.teamName;
      record.lastPlaceTeam = last.teamName;
    }

    console.log(`  ${year}: Champion: ${record.champion} (${record.championTeam})`);
    return record;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("(400)") || msg.includes("Invalid")) {
      console.log(`  ${year}: League not found for this game key`);
    } else {
      console.error(`  ${year}: Error:`, msg.slice(0, 150));
    }
    return null;
  }
}

async function main() {
  console.log("Fetching Yahoo OAuth token...");
  const token = await getToken();
  console.log("Token acquired.\n");

  console.log("Fetching historical standings...");
  const seasons: SeasonRecord[] = [];

  for (const [yearStr, gameKey] of Object.entries(NFL_GAME_KEYS)) {
    const year = Number(yearStr);
    const record = await fetchSeasonStandings(year, gameKey, token);
    if (record) {
      seasons.push(record);
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (seasons.length === 0) {
    console.log("\nNo historical data found. The league ID may not match past seasons.");
    return;
  }

  seasons.sort((a, b) => b.year - a.year);

  const historyData = { seasons };
  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(process.cwd(), "src", "data", "history.json");
  fs.writeFileSync(outPath, JSON.stringify(historyData, null, 2) + "\n");
  console.log(`\nWrote ${seasons.length} seasons to ${outPath}`);

  // Also populate punishments.json with last-place finishers
  const punishments = seasons
    .filter((s) => s.lastPlace)
    .map((s) => ({
      season: s.year,
      loser: s.lastPlace,
      team: s.lastPlaceTeam,
    }));

  if (punishments.length > 0) {
    const punPath = path.join(process.cwd(), "src", "data", "punishments.json");
    fs.writeFileSync(
      punPath,
      JSON.stringify({ punishments }, null, 2) + "\n"
    );
    console.log(`Wrote ${punishments.length} last-place entries to ${punPath}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
