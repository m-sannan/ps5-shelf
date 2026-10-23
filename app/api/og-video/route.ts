import { NextResponse } from "next/server";

// Short animated disc-loading preview for OG video previews.
// Replace the placeholder with the real MP4 bytes or host the file in /public.
export const runtime = "nodejs";

export async function GET() {
  // For now return a 302 to a public demo video; replace with the embedded or hosted MP4.
  // The generated 18KB disc-loading MP4 is ready — host it and update this route.
  return NextResponse.redirect(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    302,
  );
}
