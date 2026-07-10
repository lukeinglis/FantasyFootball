import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import logger from "@/lib/logger";

export function GET() {
  logger.info({ route: "/api/health", version: packageJson.version }, "health check");
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
}
