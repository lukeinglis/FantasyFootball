import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

vi.mock("@/lib/yahoo/auth", () => ({
  getValidToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    getStale: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.resetModules();
});
afterAll(() => server.close());

async function loadClient() {
  const mod = await import("./client");
  return mod;
}

describe("getStandings", () => {
  it("parses standings from Yahoo response", async () => {
    const { getStandings } = await loadClient();
    const standings = await getStandings();

    expect(standings.leagueName).toBe("Greybushes & Chili Dogs");
    expect(standings.season).toBe("2024");
    expect(standings.teams).toHaveLength(2);

    const first = standings.teams[0];
    expect(first.teamName).toBe("Team Alpha");
    expect(first.managerName).toBe("Alice");
    expect(first.rank).toBe(1);
    expect(first.wins).toBe(10);
    expect(first.losses).toBe(3);
    expect(first.pointsFor).toBe(1523.4);
    expect(first.streak).toBe("W4");
    expect(first.playoffSeed).toBe(1);
  });

  it("sorts teams by rank", async () => {
    const { getStandings } = await loadClient();
    const standings = await getStandings();
    expect(standings.teams[0].rank).toBeLessThan(standings.teams[1].rank);
  });
});

describe("getTeams", () => {
  it("parses teams from Yahoo response", async () => {
    const { getTeams } = await loadClient();
    const teams = await getTeams();

    expect(teams).toHaveLength(2);

    const alpha = teams[0];
    expect(alpha.teamKey).toBe("449.l.374164.t.1");
    expect(alpha.teamName).toBe("Team Alpha");
    expect(alpha.managerName).toBe("Alice");
    expect(alpha.wins).toBe(10);
    expect(alpha.losses).toBe(3);
    expect(alpha.pointsFor).toBe(1523.4);
    expect(alpha.waiverPriority).toBe(5);
    expect(alpha.faabBalance).toBe(75);
  });

  it("handles missing faabBalance", async () => {
    const { getTeams } = await loadClient();
    const teams = await getTeams();
    const beta = teams[1];
    expect(beta.faabBalance).toBeNull();
  });
});

describe("getScoreboard", () => {
  it("parses scoreboard with matchup data", async () => {
    const { getScoreboard } = await loadClient();
    const scoreboard = await getScoreboard();

    expect(scoreboard.week).toBe(14);
    expect(scoreboard.matchups).toHaveLength(1);

    const matchup = scoreboard.matchups[0];
    expect(matchup.status).toBe("postgame");
    expect(matchup.winnerTeamKey).toBe("449.l.374164.t.1");
    expect(matchup.teams[0].teamName).toBe("Team Alpha");
    expect(matchup.teams[0].points).toBe(142.5);
    expect(matchup.teams[0].projectedPoints).toBe(135.0);
    expect(matchup.teams[1].teamName).toBe("Team Beta");
    expect(matchup.teams[1].points).toBe(128.3);
  });
});

describe("getDraftResults", () => {
  it("parses draft results with player details", async () => {
    const { getDraftResults } = await loadClient();
    const results = await getDraftResults();

    expect(results).toHaveLength(2);

    const firstPick = results[0];
    expect(firstPick.pick).toBe(1);
    expect(firstPick.round).toBe(1);
    expect(firstPick.playerName).toBe("Patrick Mahomes");
    expect(firstPick.position).toBe("QB");
    expect(firstPick.nflTeam).toBe("KC");
    expect(firstPick.teamKey).toBe("449.l.374164.t.1");

    const secondPick = results[1];
    expect(secondPick.playerName).toBe("Josh Allen");
    expect(secondPick.nflTeam).toBe("BUF");
  });
});

describe("getTransactions", () => {
  it("parses add/drop transactions", async () => {
    const { getTransactions } = await loadClient();
    const transactions = await getTransactions();

    expect(transactions).toHaveLength(2);

    const addDrop = transactions[0];
    expect(addDrop.type).toBe("add/drop");
    expect(addDrop.status).toBe("successful");
    expect(addDrop.timestamp).toBe(1700000000);
    expect(addDrop.players).toHaveLength(2);

    const added = addDrop.players[0];
    expect(added.playerName).toBe("Tyreek Hill");
    expect(added.transactionType).toBe("add");
    expect(added.position).toBe("WR");
    expect(added.nflTeam).toBe("MIA");

    const dropped = addDrop.players[1];
    expect(dropped.playerName).toBe("Davante Adams");
    expect(dropped.transactionType).toBe("drop");
  });

  it("parses trade transactions", async () => {
    const { getTransactions } = await loadClient();
    const transactions = await getTransactions();

    const trade = transactions[1];
    expect(trade.type).toBe("trade");
    expect(trade.transactionId).toBe(2);
  });
});

describe("getLeagueSettings", () => {
  it("parses league settings", async () => {
    const { getLeagueSettings } = await loadClient();
    const settings = await getLeagueSettings();

    expect(settings.name).toBe("Greybushes & Chili Dogs");
    expect(settings.season).toBe("2024");
    expect(settings.numTeams).toBe(10);
    expect(settings.scoringType).toBe("head");
    expect(settings.currentWeek).toBe(14);
    expect(settings.startWeek).toBe(1);
    expect(settings.endWeek).toBe(17);
    expect(settings.playoffStartWeek).toBe(15);
    expect(settings.numPlayoffTeams).toBe(6);
    expect(settings.isFinished).toBe(false);
    expect(settings.rosterPositions).toHaveLength(3);
    expect(settings.rosterPositions[0].position).toBe("QB");
    expect(settings.statCategories).toHaveLength(1);
    expect(settings.statCategories[0].name).toBe("Passing Yards");
  });
});

describe("error handling", () => {
  it("throws on 401 unauthorized", async () => {
    server.use(
      http.get(`${YAHOO_API_BASE}/game/nfl`, () =>
        HttpResponse.json({ fantasy_content: { game: [{ game_key: "449" }] } })
      ),
      http.get(/\/league\/.*\/metadata/, () =>
        HttpResponse.json({
          fantasy_content: { league: [{ league_key: "449.l.374164" }] },
        })
      ),
      http.get(/\/league\/.*\/standings/, () => {
        return HttpResponse.json(
          { error: "token_expired" },
          { status: 401 }
        );
      })
    );

    const { getStandings } = await loadClient();
    await expect(getStandings()).rejects.toThrow("Yahoo API error (401)");
  });

  it("throws on rate limit (HTTP 999) with no stale cache", async () => {
    server.use(
      http.get(`${YAHOO_API_BASE}/game/nfl`, () =>
        HttpResponse.json({ fantasy_content: { game: [{ game_key: "449" }] } })
      ),
      http.get(/\/league\/.*\/metadata/, () =>
        HttpResponse.json({
          fantasy_content: { league: [{ league_key: "449.l.374164" }] },
        })
      ),
      http.get(/\/league\/.*\/standings/, () => {
        return new HttpResponse("Rate limited", { status: 999 });
      })
    );

    const { getStandings } = await loadClient();
    await expect(getStandings()).rejects.toThrow("rate limited");
  });

  it("throws on network error with no stale cache", async () => {
    server.use(
      http.get(`${YAHOO_API_BASE}/game/nfl`, () =>
        HttpResponse.json({ fantasy_content: { game: [{ game_key: "449" }] } })
      ),
      http.get(/\/league\/.*\/metadata/, () =>
        HttpResponse.json({
          fantasy_content: { league: [{ league_key: "449.l.374164" }] },
        })
      ),
      http.get(/\/league\/.*\/standings/, () => {
        return HttpResponse.error();
      })
    );

    const { getStandings } = await loadClient();
    await expect(getStandings()).rejects.toThrow();
  });

  it("throws on malformed JSON response", async () => {
    server.use(
      http.get(`${YAHOO_API_BASE}/game/nfl`, () =>
        HttpResponse.json({ fantasy_content: { game: [{ game_key: "449" }] } })
      ),
      http.get(/\/league\/.*\/metadata/, () =>
        HttpResponse.json({
          fantasy_content: { league: [{ league_key: "449.l.374164" }] },
        })
      ),
      http.get(/\/league\/.*\/standings/, () => {
        return new HttpResponse("not json{{{", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      })
    );

    const { getStandings } = await loadClient();
    await expect(getStandings()).rejects.toThrow();
  });
});

describe("response transformation edge cases", () => {
  it("handles empty standings", async () => {
    server.use(
      http.get(/\/league\/.*\/standings/, () => {
        return HttpResponse.json({
          fantasy_content: {
            league: [
              { name: "Empty League", season: "2024" },
              { standings: [{ teams: { count: 0 } }] },
            ],
          },
        });
      })
    );

    const { getStandings } = await loadClient();
    const standings = await getStandings();
    expect(standings.teams).toHaveLength(0);
    expect(standings.leagueName).toBe("Empty League");
  });

  it("handles empty transactions", async () => {
    server.use(
      http.get(/\/league\/.*\/transactions/, () => {
        return HttpResponse.json({
          fantasy_content: {
            league: [
              { name: "Test League" },
              { transactions: { count: 0 } },
            ],
          },
        });
      })
    );

    const { getTransactions } = await loadClient();
    const transactions = await getTransactions();
    expect(transactions).toHaveLength(0);
  });
});
