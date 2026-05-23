import { NextRequest, NextResponse } from "next/server";
import { getScoreboard } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

  logger.info({ route: "/api/yahoo/scoreboard", week }, "request started");
  try {
    const scoreboard = await getScoreboard(week);
    logger.info({ route: "/api/yahoo/scoreboard", week }, "request completed");
    return NextResponse.json(scoreboard);
  } catch (error) {
    logger.error({ route: "/api/yahoo/scoreboard", week, err: error }, "request failed");
    return errorResponse(error, "scoreboard");
  }
}
