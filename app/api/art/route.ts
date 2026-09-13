import { NextRequest, NextResponse } from "next/server";

const ALLOWED = [
  "upload.wikimedia.org",
  "shared.akamai.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
];

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") ?? "";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  if (!ALLOWED.includes(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }
  const upstream = await fetch(parsed.toString(), {
    headers: { "User-Agent": "CratePS5Library/1.0" },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
  const type = upstream.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
