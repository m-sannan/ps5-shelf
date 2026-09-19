import { ImageResponse } from "next/og";
import { publicShelf } from "@/lib/cloud/engine";
import { readCloud } from "@/lib/cloud/persist";
import { crateStats, diaryLine, favoriteFour } from "@/lib/crate";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Crate";

export default async function Image({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let name = "Crate";
  let line = "A PS5 shelf";
  let meta = "";
  let four: { title: string; color: string }[] = [];

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
      four = favoriteFour(data.games, data.profile.favoriteIds).map((game) => ({
        title: game.title,
        color: game.coverColor || "#2563eb",
      }));
    }
  } catch {
    /* generic card */
  }

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
          {(four.length ? four : [{ title: "PS5", color: "#2563eb" }]).map((game) => (
            <div
              key={game.title}
              style={{
                width: 160,
                height: 214,
                borderRadius: 14,
                background: `linear-gradient(165deg, ${game.color} 0%, #111 80%)`,
                display: "flex",
                alignItems: "flex-end",
                padding: 12,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {game.title.slice(0, 22)}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
