import { NextRequest, NextResponse } from "next/server";
import { getTeamMatchups } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

const TEAM_KEY_RE = /^[a-z0-9]+\.l\.\d+\.t\.\d+$/i;

export async function GET(request: NextRequest) {
  const teamKey = request.nextUrl.searchParams.get("teamKey");
  logger.info({ route: "/api/yahoo/matchups", teamKey }, "request started");

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
    logger.info({ route: "/api/yahoo/matchups", teamKey }, "request completed");
    return NextResponse.json(matchups);
  } catch (error) {
    logger.error({ route: "/api/yahoo/matchups", teamKey, err: error }, "request failed");
    return errorResponse(error, "matchups");
  }
}
