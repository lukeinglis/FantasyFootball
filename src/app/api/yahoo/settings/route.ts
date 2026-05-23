import { NextResponse } from "next/server";
import { getLeagueSettings } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  logger.info({ route: "/api/yahoo/settings" }, "request started");
  try {
    const settings = await getLeagueSettings();
    logger.info({ route: "/api/yahoo/settings" }, "request completed");
    return NextResponse.json(settings);
  } catch (error) {
    logger.error({ route: "/api/yahoo/settings", err: error }, "request failed");
    return errorResponse(error, "league settings");
  }
}
