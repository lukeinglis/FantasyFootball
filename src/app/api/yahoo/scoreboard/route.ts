import { NextRequest, NextResponse } from "next/server";
import { getScoreboard } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

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

  try {
    const scoreboard = await getScoreboard(week);
    return NextResponse.json(scoreboard);
  } catch (error) {
    return errorResponse(error, "scoreboard");
  }
}
