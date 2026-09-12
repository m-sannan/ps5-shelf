"use client";

import { STATUS_LABELS, type Game } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => !["the", "of", "a", "and"].includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function VinylDisc({
  game,
  size = "md",
  selected = false,
  onClick,
}: {
  game: Game;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}) {
  const px = size === "lg" ? 220 : size === "sm" ? 132 : 172;
  const label = size === "lg" ? 88 : size === "sm" ? 52 : 68;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative shrink-0 text-left outline-none",
        onClick && "cursor-pointer",
      )}
      style={{ width: px, height: px }}
      aria-label={`${game.title}, ${STATUS_LABELS[game.status]}`}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full vinyl-disc transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:-translate-y-2",
          selected && "-translate-y-2 -rotate-6",
        )}
        style={{
          boxShadow: selected
            ? "0 24px 40px rgba(0,0,0,0.55), 0 0 0 3px rgba(232, 197, 124, 0.7)"
            : "0 18px 30px rgba(0,0,0,0.45)",
        }}
      >
        <span
          className="absolute left-1/2 top-1/2 overflow-hidden rounded-full border border-black/40 shadow-inner"
          style={{
            width: label,
            height: label,
            marginLeft: -label / 2,
            marginTop: -label / 2,
            background: game.coverImage
              ? `center / cover no-repeat url(${game.coverImage})`
              : `radial-gradient(circle at 30% 25%, #fff8 0, transparent 40%), linear-gradient(160deg, ${game.coverColor}, #111)`,
          }}
        >
          {!game.coverImage && (
            <span className="flex h-full w-full items-center justify-center font-heading text-[11px] font-semibold tracking-[0.18em] text-white/90">
              {initials(game.title)}
            </span>
          )}
        </span>
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] ring-1 ring-white/20" />
      </span>
    </button>
  );
}
