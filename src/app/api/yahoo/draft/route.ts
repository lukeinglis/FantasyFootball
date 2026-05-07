import { NextResponse } from "next/server";
import { getDraftResults } from "@/lib/yahoo/client";
import { errorResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const draft = await getDraftResults();
    return NextResponse.json(draft);
  } catch (error) {
    return errorResponse(error, "draft results");
  }
}
