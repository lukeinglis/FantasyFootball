import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";
import logger from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  logger.info({ route: "/api/yahoo/transactions" }, "request started");
  try {
    const transactions = await getTransactions();
    logger.info({ route: "/api/yahoo/transactions" }, "request completed");
    return NextResponse.json(transactions);
  } catch (error) {
    logger.error({ route: "/api/yahoo/transactions", err: error }, "request failed");
    return errorResponse(error, "transactions");
  }
}
