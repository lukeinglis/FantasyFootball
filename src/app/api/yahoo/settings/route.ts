import { NextResponse } from "next/server";
import { getLeagueSettings } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getLeagueSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error, "league settings");
  }
}
