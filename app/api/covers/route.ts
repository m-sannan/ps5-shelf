import { searchCovers } from "@/lib/covers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ covers: [] });
  }
  try {
    const covers = await searchCovers(q);
    return NextResponse.json({ covers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      covers: [],
      error: "Search failed. Try a shorter title.",
    });
  }
}
