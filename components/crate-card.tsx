"use client";

import { useState } from "react";
import { artSrc } from "@/lib/art-src";
import { crateStats, diaryLine, favoriteFour } from "@/lib/crate";
import type { Game, Profile } from "@/lib/types";
import { canvasPng, shareBlob } from "@/lib/share-blob";
import { Button } from "@/components/ui/button";

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function drawCrateCard(
  profile: Profile,
  games: Game[],
  path: string,
) {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the card.");

  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#161616";
  roundRect(ctx, 48, 48, width - 96, height - 96, 36);
  ctx.fill();

  const four = favoriteFour(games, profile.favoriteIds);
  const stats = crateStats(games);
  const diary = diaryLine(games);
  const covers = await Promise.all(
    four.map(async (game) => {
      if (!game.coverImage) return { game, image: null as HTMLImageElement | null };
      return { game, image: await loadImage(artSrc(game.coverImage)) };
    }),
  );

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "600 28px Outfit, system-ui, sans-serif";
  ctx.fillText("CRATE", 96, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 72px Outfit, system-ui, sans-serif";
  const name = profile.name.trim() || "Crate";
  ctx.fillText(name.slice(0, 22), 96, 230);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 28px Outfit, system-ui, sans-serif";
  const meta = [profile.handle ? `@${profile.handle}` : "", profile.city.trim()]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) ctx.fillText(meta, 96, 280);

  if (diary) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "400 26px Outfit, system-ui, sans-serif";
    ctx.fillText(diary.slice(0, 54), 96, 330);
  }

  const gap = 18;
  const left = 96;
  const right = width - 96;
  const rowWidth = right - left;
  const cardW = four.length ? (rowWidth - gap * (four.length - 1)) / four.length : 0;
  const cardH = cardW * (4 / 3);
  const top = 380;

  covers.forEach(({ game, image }, index) => {
    const x = left + index * (cardW + gap);
    roundRect(ctx, x, top, cardW, cardH, 16);
    ctx.save();
    ctx.clip();
    if (image) {
      const scale = Math.max(cardW / image.width, cardH / image.height);
      const dw = image.width * scale;
      const dh = image.height * scale;
      ctx.drawImage(image, x + (cardW - dw) / 2, top + (cardH - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = game.coverColor || "#2563eb";
      ctx.fillRect(x, top, cardW, cardH);
      ctx.fillStyle = "#fff";
      ctx.font = "600 22px Outfit, system-ui, sans-serif";
      const title = game.title.slice(0, 18);
      ctx.fillText(title, x + 14, top + cardH - 24);
    }
    ctx.restore();
  });

  const countLine = [
    stats.discs ? `${stats.discs} disc${stats.discs === 1 ? "" : "s"}` : `${stats.total} games`,
    stats.playing ? `${stats.playing} playing` : "",
    stats.listed ? `${stats.listed} available` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "500 30px Outfit, system-ui, sans-serif";
  ctx.fillText(countLine, 96, top + cardH + 70);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "400 24px Outfit, system-ui, sans-serif";
  const url = path.replace(/^\//, "");
  ctx.fillText(url.slice(0, 42), 96, height - 110);

  return canvas;
}

export function CrateCardButton({
  profile,
  games,
  path,
}: {
  profile: Profile;
  games: Game[];
  path: string;
}) {
  const [busy, setBusy] = useState<"share" | "save" | "">("");
  const [hint, setHint] = useState("");

  async function cardBlob() {
    const canvas = await drawCrateCard(profile, games, path);
    return canvasPng(canvas);
  }

  function slug() {
    return profile.handle || profile.name.trim().toLowerCase().replace(/\s+/g, "-") || "crate";
  }

  function absoluteUrl() {
    if (!path) return "";
    if (typeof window === "undefined") return path;
    return path.startsWith("http") ? path : `${window.location.origin}${path}`;
  }

  async function share() {
    setBusy("share");
    setHint("");
    try {
      const blob = await cardBlob();
      const url = absoluteUrl();
      const outcome = await shareBlob({
        blob,
        filename: `crate-${slug()}.png`,
        title: `${profile.name.trim() || "Crate"} on Crate`,
        text: diaryLine(games) || "A PS5 shelf.",
        url,
      });
      setHint(
        outcome === "shared"
          ? "Opened the share sheet."
          : outcome === "copied"
            ? "Link copied, and the image was saved."
            : outcome === "saved"
              ? "Saved the Crate card."
              : "",
      );
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Could not share the Crate.");
    } finally {
      setBusy("");
    }
  }

  async function save() {
    setBusy("save");
    setHint("");
    try {
      const blob = await cardBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `crate-${slug()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setHint("Saved the image.");
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Could not save the card.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void share()} disabled={Boolean(busy)}>
          {busy === "share" ? "Preparing…" : "Share Crate"}
        </Button>
        <button
          type="button"
          className="text-sm text-white/50 hover:text-white disabled:opacity-40"
          onClick={() => void save()}
          disabled={Boolean(busy)}
        >
          {busy === "save" ? "Saving…" : "Save image"}
        </button>
      </div>
      {hint ? <p className="text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}
