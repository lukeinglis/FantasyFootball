import { NextRequest, NextResponse } from "next/server";
import { getTeams, getTeamRoster } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

// Yahoo team keys look like "nfl.l.123456.t.4". Reject anything that
// doesn't fit this shape to avoid passing arbitrary strings to the API.
const TEAM_KEY_RE = /^[a-z0-9]+\.l\.\d+\.t\.\d+$/i;

export async function GET(request: NextRequest) {
  const teamKey = request.nextUrl.searchParams.get("teamKey");
  const weekRaw = request.nextUrl.searchParams.get("week");

  let week: number | undefined;
  if (weekRaw !== null) {
    const parsed = parseInt(weekRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 25) {
      week = parsed;
    } else {
      return NextResponse.json(
        { error: "week must be an integer between 1 and 25" },
        { status: 400 }
      );
    }
  }

  try {
    if (teamKey) {
      if (!TEAM_KEY_RE.test(teamKey)) {
        return NextResponse.json(
          { error: "teamKey is not a valid Yahoo team key" },
          { status: 400 }
        );
      }
      const roster = await getTeamRoster(teamKey, week);
      return NextResponse.json(roster);
    }

    const teams = await getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    return errorResponse(error, teamKey ? "team roster" : "teams");
  }
}
