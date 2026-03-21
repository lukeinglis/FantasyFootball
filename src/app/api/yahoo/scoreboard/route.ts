import { NextRequest, NextResponse } from "next/server";
import { getScoreboard } from "@/lib/yahoo/client";

export async function GET(request: NextRequest) {
  const week = request.nextUrl.searchParams.get("week");

  try {
    const scoreboard = await getScoreboard(
      week ? parseInt(week, 10) : undefined
    );
    return NextResponse.json(scoreboard);
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch scoreboard" },
      { status: 500 }
    );
  }
}
