import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
}
