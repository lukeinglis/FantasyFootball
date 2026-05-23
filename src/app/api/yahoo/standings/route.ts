import { NextResponse } from "next/server";
import { getStandings } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  logger.info({ route: "/api/yahoo/standings" }, "request started");
  try {
    const standings = await getStandings();
    logger.info({ route: "/api/yahoo/standings" }, "request completed");
    return NextResponse.json(standings);
  } catch (error) {
    logger.error({ route: "/api/yahoo/standings", err: error }, "request failed");
    return errorResponse(error, "standings");
  }
}
