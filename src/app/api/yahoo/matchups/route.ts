import { NextRequest, NextResponse } from "next/server";
import { getTeamMatchups } from "@/lib/yahoo/client";

export async function GET(request: NextRequest) {
  const teamKey = request.nextUrl.searchParams.get("teamKey");

  if (!teamKey) {
    return NextResponse.json(
      { error: "teamKey query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const matchups = await getTeamMatchups(teamKey);
    return NextResponse.json(matchups);
  } catch (error) {
    console.error("Error fetching matchups:", error);
    return NextResponse.json(
      { error: "Failed to fetch matchups" },
      { status: 500 }
    );
  }
}
