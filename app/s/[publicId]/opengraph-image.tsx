import { ImageResponse } from "next/og";
import { publicShelf } from "@/lib/cloud/engine";
import { readCloud } from "@/lib/cloud/persist";
import { crateStats, diaryLine, favoriteFour } from "@/lib/crate";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Crate";

const ALLOWED = new Set([
  "upload.wikimedia.org",
  "shared.akamai.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
]);

async function coverBytes(url: string | null | undefined): Promise<ArrayBuffer | null> {
  if (!url) return null;
  try {
    if (url.startsWith("data:image/")) {
      const match = /^data:image\/(?:jpeg|jpg|png);base64,(.+)$/i.exec(url);
      if (!match) return null;
      const bytes = Buffer.from(match[1], "base64");
      if (bytes.byteLength === 0 || bytes.byteLength > 400_000) return null;
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    const parsed = new URL(url);
    if (!ALLOWED.has(parsed.hostname)) return null;
    const response = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "CratePS5Library/1.0 (https://ps5-shelf.vercel.app)",
        Accept: "image/jpeg,image/png",
      },
      signal: AbortSignal.timeout(4000),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok) return null;
    if (!type.includes("jpeg") && !type.includes("jpg") && !type.includes("png")) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > 1_500_000) return null;
    return bytes;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let name = "Crate";
  let line = "A PS5 shelf";
  let meta = "";
  let four: { title: string; color: string; cover: ArrayBuffer | null }[] = [];

  try {
    const data = await readCloud((blob) => publicShelf(blob, publicId));
    if (data && !data.privateShelf) {
      name = data.profile.name.trim() || "Crate";
      const stats = crateStats(data.games);
      const diary = diaryLine(data.games);
      line = diary || (stats.discs ? `${stats.discs} discs` : `${stats.total} games`);
      meta = [data.profile.handle ? `@${data.profile.handle}` : "", data.profile.city.trim()]
        .filter(Boolean)
        .join(" · ");
      const picked = favoriteFour(data.games, data.profile.favoriteIds);
      four = await Promise.all(
        picked.map(async (game) => ({
          title: game.title,
          color: game.coverColor || "#2563eb",
          cover: await coverBytes(game.coverImage),
        })),
      );
    }
  } catch {
    /* generic card */
  }

  const cards = four.length ? four : [{ title: "PS5", color: "#2563eb", cover: null }];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0b0b0d",
          color: "white",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 8, color: "rgba(255,255,255,0.4)" }}>CRATE</div>
        <div style={{ fontSize: 64, fontWeight: 600, marginTop: 16 }}>{name}</div>
        {meta ? (
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>{meta}</div>
        ) : null}
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", marginTop: 20 }}>{line}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {cards.map((game) => (
            <div
              key={game.title}
              style={{
                width: 160,
                height: 214,
                borderRadius: 14,
                background: game.cover ? "#111" : `linear-gradient(165deg, ${game.color} 0%, #111 80%)`,
                display: "flex",
                alignItems: "flex-end",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {game.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  src={game.cover as unknown as string}
                  width={160}
                  height={214}
                  style={{ objectFit: "cover", width: 160, height: 214 }}
                />
              ) : (
                <div style={{ display: "flex", padding: 12, fontSize: 16, fontWeight: 600 }}>
                  {game.title.slice(0, 22)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
