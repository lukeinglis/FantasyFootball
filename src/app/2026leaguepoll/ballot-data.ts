export const DRAFT_DATE_OPTIONS = [
  "Saturday, August 23 at 3:00 PM CT",
  "Sunday, August 24 at 3:00 PM CT",
  "Saturday, August 30 at 3:00 PM CT",
  "Sunday, August 31 at 3:00 PM CT",
];

export const CHALLENGE_SCHEDULE = [
  { week: 1, challenge: "Most Points by a Kicker" },
  { week: 2, challenge: "Most Points by a Non-QB" },
  { week: 3, challenge: "Most Points by RB Duo" },
  { week: 4, challenge: "Most Points by WR Trio" },
  { week: 5, challenge: "Most Points" },
  { week: 6, challenge: "Most Points by a Losing Team" },
  { week: 7, challenge: "TD Scorer Parlay" },
  { week: 8, challenge: "Pick All 6 League Matchups, Points as Tiebreaker" },
  { week: 9, challenge: "Biggest Margin of Victory" },
  { week: 10, challenge: "Fewest Points by a Winning Team" },
  { week: 11, challenge: "Most Points by a Defense" },
  { week: 12, challenge: "Most Points by a Single Player" },
  {
    week: 13,
    challenge:
      "Most Bench Points, 1 QB Max, Must Field Full Starting Lineup",
  },
  { week: 14, challenge: "Highest Combined Matchup Point Total" },
] as const;

export const KEEPER_RULES = [
  "Each team may keep up to 2 players",
  "Managers are not required to use either keeper",
  "Keeper cost = the same draft round in which the player was selected the previous season",
  "A free-agent keeper uses the latest available draft round",
  "One FA keeper = Round 16",
  "Two FA keepers = Rounds 16 and 15",
  "Example: Keeping a Round 2 player and a free agent costs R2 and R16",
  "Keepers must be submitted 24 hours before the draft",
] as const;
