import { NextResponse } from "next/server";
import { getStandings } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const standings = await getStandings();
    return NextResponse.json(standings);
  } catch (error) {
    return errorResponse(error, "standings");
  }
}
