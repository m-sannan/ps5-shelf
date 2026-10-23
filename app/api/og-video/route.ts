import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Temporary clearer sample while custom animation is refined.
  // Replace with the real disc-loading MP4 once hosted in /public or Blob.
  return NextResponse.redirect(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    302,
  );
}
