import { NextRequest, NextResponse } from "next/server";
import { getTeams, getTeamRoster } from "@/lib/yahoo/client";

export async function GET(request: NextRequest) {
  const teamKey = request.nextUrl.searchParams.get("teamKey");
  const week = request.nextUrl.searchParams.get("week");

  try {
    if (teamKey) {
      const roster = await getTeamRoster(
        teamKey,
        week ? parseInt(week, 10) : undefined
      );
      return NextResponse.json(roster);
    }

    const teams = await getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
