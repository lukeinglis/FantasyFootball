import { NextRequest, NextResponse } from "next/server";
import { getTeamMatchups } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

const TEAM_KEY_RE = /^[a-z0-9]+\.l\.\d+\.t\.\d+$/i;

export async function GET(request: NextRequest) {
  const teamKey = request.nextUrl.searchParams.get("teamKey");

  if (!teamKey) {
    return NextResponse.json(
      { error: "teamKey query parameter is required" },
      { status: 400 }
    );
  }
  if (!TEAM_KEY_RE.test(teamKey)) {
    return NextResponse.json(
      { error: "teamKey is not a valid Yahoo team key" },
      { status: 400 }
    );
  }

  try {
    const matchups = await getTeamMatchups(teamKey);
    return NextResponse.json(matchups);
  } catch (error) {
    return errorResponse(error, "matchups");
  }
}
