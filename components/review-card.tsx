"use client";

import { useState } from "react";
import { artSrc } from "@/lib/art-src";
import { starText } from "@/lib/crate";
import { shortDate } from "@/lib/format";
import { canvasPng, shareBlob } from "@/lib/share-blob";
import type { Game, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

export async function drawReviewCard(input: {
  game: Game;
  profile: Pick<Profile, "name" | "handle">;
  url?: string;
}) {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the review.");

  ctx.fillStyle = "#121214";
  ctx.fillRect(0, 0, width, height);

  const coverW = 280;
  const coverH = 373;
  const coverX = width - 64 - coverW;
  const coverY = (height - coverH) / 2;
  const coverSrc = input.game.coverImage ? artSrc(input.game.coverImage) : "";
  const cover = coverSrc ? await loadImage(coverSrc) : null;
  ctx.fillStyle = input.game.coverColor || "#2563eb";
  ctx.fillRect(coverX, coverY, coverW, coverH);
  if (cover) {
    const scale = Math.max(coverW / cover.width, coverH / cover.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(coverX, coverY, coverW, coverH);
    ctx.clip();
    ctx.drawImage(
      cover,
      coverX + (coverW - cover.width * scale) / 2,
      coverY + (coverH - cover.height * scale) / 2,
      cover.width * scale,
      cover.height * scale,
    );
    ctx.restore();
  }

  const left = 64;
  const maxText = coverX - left - 48;
  const name = input.profile.name.trim() || "Crate";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px Outfit, system-ui, sans-serif";
  ctx.fillText(input.profile.handle ? `${name}  ·  @${input.profile.handle}` : name, left, 88);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 52px Outfit, system-ui, sans-serif";
  const title = wrapLines(ctx, input.game.title, maxText, 2);
  title.forEach((line, index) => ctx.fillText(line, left, 160 + index * 58));

  const afterTitle = 160 + title.length * 58 + 18;
  ctx.fillStyle = "#fbbf24";
  ctx.font = "600 36px Outfit, system-ui, sans-serif";
  ctx.fillText(starText(input.game.rating) || "No rating", left, afterTitle);

  if (input.game.loggedAt) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "400 24px Outfit, system-ui, sans-serif";
    ctx.fillText(`Logged ${shortDate(input.game.loggedAt)}`, left, afterTitle + 40);
  }

  const review = input.game.review?.trim() ?? "";
  if (review) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "400 28px Outfit, system-ui, sans-serif";
    const lines = wrapLines(ctx, review, maxText, 5);
    lines.forEach((line, index) => ctx.fillText(line, left, afterTitle + 92 + index * 38));
  }

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "500 20px Outfit, system-ui, sans-serif";
  ctx.fillText("CRATE", left, height - 40);

  return canvas;
}

export function ReviewCard({
  game,
  profile,
  url,
  shareable = false,
  onOpen,
}: {
  game: Game;
  profile: Pick<Profile, "name" | "handle">;
  url?: string;
  shareable?: boolean;
  onOpen?: () => void;
}) {
  const review = game.review?.trim() ?? "";
  if (!review && !game.rating) return null;
  const name = profile.name.trim() || "Crate";

  const inner = (
    <div className="flex min-w-0 gap-4 text-left">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/50">
          {name}
          {profile.handle ? ` · @${profile.handle}` : ""}
        </p>
        <p className="mt-1 text-lg font-medium leading-tight">{game.title}</p>
        <div className="mt-1">
          <RatingStars value={game.rating} readOnly size="sm" />
        </div>
        {game.loggedAt ? (
          <p className="mt-1 text-xs text-white/40">Logged {shortDate(game.loggedAt)}</p>
        ) : null}
        {review ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{review}</p>
        ) : null}
      </div>
      {game.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artSrc(game.coverImage)}
          alt=""
          className="h-28 w-[84px] shrink-0 rounded object-cover sm:h-36 sm:w-[108px]"
        />
      ) : (
        <span
          className="h-28 w-[84px] shrink-0 rounded sm:h-36 sm:w-[108px]"
          style={{ background: game.coverColor }}
        />
      )}
    </div>
  );

  return (
    <div className="rounded-2xl bg-white/4 p-4 ring-1 ring-white/8">
      {onOpen ? (
        <button type="button" className="w-full min-w-0" onClick={onOpen}>
          {inner}
        </button>
      ) : (
        inner
      )}
      {shareable ? <ShareReviewButton game={game} profile={profile} url={url} /> : null}
    </div>
  );
}

export function ShareReviewButton({
  game,
  profile,
  url,
}: {
  game: Game;
  profile: Pick<Profile, "name" | "handle">;
  url?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  async function share() {
    setBusy(true);
    setHint("");
    try {
      const canvas = await drawReviewCard({ game, profile, url });
      const blob = await canvasPng(canvas);
      const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const stars = starText(game.rating);
      const take = game.review?.trim() ?? "";
      const outcome = await shareBlob({
        blob,
        filename: `crate-${slug}.png`,
        title: game.title,
        text: [game.title, stars, take].filter(Boolean).join("\n"),
        url,
      });
      setHint(
        outcome === "shared"
          ? "Opened the share sheet."
          : outcome === "copied"
            ? "Link copied. Image saved if your browser allows it."
            : outcome === "saved"
              ? "Saved the review image."
              : "",
      );
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Could not share that take.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="secondary" onClick={() => void share()} disabled={busy}>
        {busy ? "Preparing…" : "Share this take"}
      </Button>
      {hint ? <p className="text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}
