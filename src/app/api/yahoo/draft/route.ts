import { NextResponse } from "next/server";
import { getDraftResults } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  logger.info({ route: "/api/yahoo/draft" }, "request started");
  try {
    const draft = await getDraftResults();
    logger.info({ route: "/api/yahoo/draft" }, "request completed");
    return NextResponse.json(draft);
  } catch (error) {
    logger.error({ route: "/api/yahoo/draft", err: error }, "request failed");
    return errorResponse(error, "draft results");
  }
}
