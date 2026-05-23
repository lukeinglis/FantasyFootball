import { http, HttpResponse } from "msw";

const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

function leagueUrl(path: string) {
  return new RegExp(
    `${YAHOO_API_BASE.replace(/\//g, "\\/")}\\/league\\/[^/]+\\/${path}(;[^?]*)?(\\?.*)?$`
  );
}

function teamUrl(path: string) {
  return new RegExp(
    `${YAHOO_API_BASE.replace(/\//g, "\\/")}\\/team\\/[^/]+\\/${path}(;[^?]*)?(\\?.*)?$`
  );
}

export const mockStandingsResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        league_id: "374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
        num_teams: 10,
        current_week: 14,
      },
      {
        standings: [
          {
            teams: {
              count: 2,
              0: {
                team: [
                  [
                    { team_key: "449.l.374164.t.1" },
                    { team_id: 1 },
                    { name: "Team Alpha" },
                    {
                      managers: [
                        { manager: { nickname: "Alice", manager_id: "1" } },
                      ],
                    },
                    {
                      team_logos: [
                        { team_logo: { url: "https://example.com/logo1.png" } },
                      ],
                    },
                  ],
                  {
                    team_standings: {
                      rank: 1,
                      outcome_totals: {
                        wins: 10,
                        losses: 3,
                        ties: 0,
                        percentage: ".769",
                      },
                      points_for: "1523.40",
                      points_against: "1201.20",
                      streak: { type: "W", value: 4 },
                      playoff_seed: 1,
                    },
                  },
                ],
              },
              1: {
                team: [
                  [
                    { team_key: "449.l.374164.t.2" },
                    { team_id: 2 },
                    { name: "Team Beta" },
                    {
                      managers: [
                        { manager: { nickname: "Bob", manager_id: "2" } },
                      ],
                    },
                  ],
                  {
                    team_standings: {
                      rank: 2,
                      outcome_totals: {
                        wins: 8,
                        losses: 5,
                        ties: 0,
                        percentage: ".615",
                      },
                      points_for: "1400.00",
                      points_against: "1300.00",
                      streak: { type: "L", value: 1 },
                      playoff_seed: 2,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  },
};

export const mockTeamsResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
      },
      {
        teams: {
          count: 2,
          0: {
            team: [
              [
                { team_key: "449.l.374164.t.1" },
                { team_id: 1 },
                { name: "Team Alpha" },
                {
                  managers: [
                    { manager: { nickname: "Alice", manager_id: "1" } },
                  ],
                },
                {
                  team_logos: [
                    { team_logo: { url: "https://example.com/logo1.png" } },
                  ],
                },
                { waiver_priority: 5 },
                { faab_balance: "75" },
              ],
              {
                team_standings: {
                  outcome_totals: { wins: 10, losses: 3, ties: 0 },
                  points_for: "1523.40",
                  points_against: "1201.20",
                },
              },
            ],
          },
          1: {
            team: [
              [
                { team_key: "449.l.374164.t.2" },
                { team_id: 2 },
                { name: "Team Beta" },
                {
                  managers: [
                    { manager: { nickname: "Bob", manager_id: "2" } },
                  ],
                },
                { waiver_priority: 3 },
              ],
              {
                team_standings: {
                  outcome_totals: { wins: 8, losses: 5, ties: 0 },
                  points_for: "1400.00",
                  points_against: "1300.00",
                },
              },
            ],
          },
        },
      },
    ],
  },
};

export const mockScoreboardResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
      },
      {
        scoreboard: {
          week: 14,
          0: {
            matchups: {
              count: 1,
              0: {
                matchup: {
                  week: 14,
                  status: "postgame",
                  is_playoffs: "0",
                  is_consolation: "0",
                  winner_team_key: "449.l.374164.t.1",
                  teams: {
                    0: {
                      team: [
                        [
                          { team_key: "449.l.374164.t.1" },
                          { team_id: 1 },
                          { name: "Team Alpha" },
                          {
                            managers: [
                              { manager: { nickname: "Alice" } },
                            ],
                          },
                        ],
                        {
                          team_points: { total: "142.50" },
                          team_projected_points: { total: "135.00" },
                        },
                      ],
                    },
                    1: {
                      team: [
                        [
                          { team_key: "449.l.374164.t.2" },
                          { team_id: 2 },
                          { name: "Team Beta" },
                          {
                            managers: [
                              { manager: { nickname: "Bob" } },
                            ],
                          },
                        ],
                        {
                          team_points: { total: "128.30" },
                          team_projected_points: { total: "130.00" },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

export const mockDraftResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
      },
      {
        draft_results: {
          count: 2,
          0: {
            draft_result: {
              pick: 1,
              round: 1,
              team_key: "449.l.374164.t.1",
              player_key: "449.p.100",
              players: [
                {
                  player: [
                    [
                      { player_key: "449.p.100" },
                      { player_id: 100 },
                      { name: { full: "Patrick Mahomes" } },
                      { display_position: "QB" },
                      { editorial_team_abbr: "KC" },
                    ],
                  ],
                },
              ],
            },
          },
          1: {
            draft_result: {
              pick: 2,
              round: 1,
              team_key: "449.l.374164.t.2",
              player_key: "449.p.200",
              players: [
                {
                  player: [
                    [
                      { player_key: "449.p.200" },
                      { player_id: 200 },
                      { name: { full: "Josh Allen" } },
                      { display_position: "QB" },
                      { editorial_team_abbr: "BUF" },
                    ],
                  ],
                },
              ],
            },
          },
        },
      },
    ],
  },
};

export const mockTransactionsResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
      },
      {
        transactions: {
          count: 2,
          0: {
            transaction: [
              {
                transaction_key: "449.l.374164.tr.1",
                transaction_id: 1,
                type: "add/drop",
                status: "successful",
                timestamp: "1700000000",
              },
              {
                players: {
                  count: 2,
                  0: {
                    player: [
                      [
                        { player_key: "449.p.300" },
                        { name: { full: "Tyreek Hill" } },
                        { display_position: "WR" },
                        { editorial_team_abbr: "MIA" },
                      ],
                      {
                        transaction_data: [
                          {
                            type: "add",
                            source_type: "freeagents",
                            destination_team_key: "449.l.374164.t.1",
                            destination_team_name: "Team Alpha",
                          },
                        ],
                      },
                    ],
                  },
                  1: {
                    player: [
                      [
                        { player_key: "449.p.400" },
                        { name: { full: "Davante Adams" } },
                        { display_position: "WR" },
                        { editorial_team_abbr: "LV" },
                      ],
                      {
                        transaction_data: [
                          {
                            type: "drop",
                            source_type: "team",
                            source_team_key: "449.l.374164.t.1",
                            source_team_name: "Team Alpha",
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
          1: {
            transaction: [
              {
                transaction_key: "449.l.374164.tr.2",
                transaction_id: 2,
                type: "trade",
                status: "successful",
                timestamp: "1700100000",
              },
              {
                players: {
                  count: 0,
                },
              },
            ],
          },
        },
      },
    ],
  },
};

export const mockGameKeyResponse = {
  fantasy_content: {
    game: [{ game_key: "449" }],
  },
};

export const mockLeagueMetadataResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        league_id: "374164",
        name: "Greybushes & Chili Dogs",
        season: "2024",
      },
    ],
  },
};

export const mockSettingsResponse = {
  fantasy_content: {
    league: [
      {
        league_key: "449.l.374164",
        league_id: 374164,
        name: "Greybushes & Chili Dogs",
        season: "2024",
        num_teams: 10,
        scoring_type: "head",
        current_week: 14,
        start_week: 1,
        end_week: 17,
        is_finished: 0,
      },
      {
        settings: [
          {
            playoff_start_week: 15,
            num_playoff_teams: 6,
            roster_positions: [
              { roster_position: { position: "QB", position_type: "O", count: 1 } },
              { roster_position: { position: "WR", position_type: "O", count: 2 } },
              { roster_position: { position: "BN", position_type: "BN", count: 6 } },
            ],
            stat_categories: {
              stats: [
                {
                  stat: {
                    stat_id: 4,
                    name: "Passing Yards",
                    display_name: "Pass Yds",
                    position_type: "O",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

export const handlers = [
  // Game key resolution
  http.get(`${YAHOO_API_BASE}/game/nfl`, () => {
    return HttpResponse.json(mockGameKeyResponse);
  }),

  // League metadata (used by getLeagueKey to validate)
  http.get(leagueUrl("metadata"), () => {
    return HttpResponse.json(mockLeagueMetadataResponse);
  }),

  // League settings
  http.get(leagueUrl("settings"), () => {
    return HttpResponse.json(mockSettingsResponse);
  }),

  // Standings
  http.get(leagueUrl("standings"), () => {
    return HttpResponse.json(mockStandingsResponse);
  }),

  // Scoreboard
  http.get(leagueUrl("scoreboard"), () => {
    return HttpResponse.json(mockScoreboardResponse);
  }),

  // Teams
  http.get(leagueUrl("teams"), () => {
    return HttpResponse.json(mockTeamsResponse);
  }),

  // Draft results (with players subresource)
  http.get(leagueUrl("draftresults"), () => {
    return HttpResponse.json(mockDraftResponse);
  }),

  // Transactions
  http.get(leagueUrl("transactions"), () => {
    return HttpResponse.json(mockTransactionsResponse);
  }),

  // Team matchups
  http.get(teamUrl("matchups"), () => {
    return HttpResponse.json({
      fantasy_content: {
        team: [
          [
            { team_key: "449.l.374164.t.1" },
            { name: "Team Alpha" },
          ],
          {
            matchups: {
              count: 1,
              0: {
                matchup: {
                  week: 1,
                  status: "postgame",
                  is_playoffs: "0",
                  is_consolation: "0",
                  winner_team_key: "449.l.374164.t.1",
                  teams: {
                    0: {
                      team: [
                        [
                          { team_key: "449.l.374164.t.1" },
                          { team_id: 1 },
                          { name: "Team Alpha" },
                          { managers: [{ manager: { nickname: "Alice" } }] },
                        ],
                        {
                          team_points: { total: "120.00" },
                          team_projected_points: { total: "115.00" },
                        },
                      ],
                    },
                    1: {
                      team: [
                        [
                          { team_key: "449.l.374164.t.2" },
                          { team_id: 2 },
                          { name: "Team Beta" },
                          { managers: [{ manager: { nickname: "Bob" } }] },
                        ],
                        {
                          team_points: { total: "105.00" },
                          team_projected_points: { total: "110.00" },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });
  }),

  // Team roster
  http.get(teamUrl("roster"), () => {
    return HttpResponse.json({
      fantasy_content: {
        team: [
          [
            { team_key: "449.l.374164.t.1" },
            { name: "Team Alpha" },
          ],
          {
            roster: [
              {
                week: 14,
                players: {
                  count: 1,
                  0: {
                    player: [
                      [
                        { player_key: "449.p.100" },
                        { player_id: 100 },
                        { name: { full: "Patrick Mahomes" } },
                        { display_position: "QB" },
                        { editorial_team_abbr: "KC" },
                        {
                          eligible_positions: [
                            { position: "QB" },
                          ],
                        },
                        { status: null },
                        { image_url: "https://example.com/mahomes.jpg" },
                        { bye_weeks: { week: 6 } },
                      ],
                      {
                        selected_position: [
                          {},
                          { position: "QB" },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });
  }),
];
