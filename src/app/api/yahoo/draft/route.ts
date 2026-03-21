import { NextResponse } from "next/server";
import { getDraftResults } from "@/lib/yahoo/client";

export async function GET() {
  try {
    const draft = await getDraftResults();
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching draft results:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft results" },
      { status: 500 }
    );
  }
}
