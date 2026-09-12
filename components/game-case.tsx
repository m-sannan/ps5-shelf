"use client";

import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

function CoverArt({ game }: { game: Game }) {
  if (game.coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={game.coverImage}
        alt={game.title}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-3 text-white"
      style={{
        background: `linear-gradient(165deg, ${game.coverColor} 0%, #071018 78%)`,
      }}
    >
      <span className="text-[10px] font-semibold tracking-[0.28em] text-white/70">
        PS5
      </span>
      <p className="text-left text-lg font-semibold leading-tight drop-shadow">
        {game.title}
      </p>
    </div>
  );
}

export function GameCase({
  game,
  size = "md",
  selected = false,
  dimmed = false,
  onClick,
}: {
  game: Game;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const width = size === "lg" ? 210 : size === "sm" ? 118 : 156;
  const height = Math.round(width * 1.46);
  const className = cn(
    "game-case relative shrink-0 text-left",
    selected && "game-case-selected",
    dimmed && "opacity-70",
  );
  const style = { width, height };
  const inner = (
    <>
      <span className="game-case-spine" />
      <span className="game-case-face">
        <CoverArt game={game} />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/20 to-transparent" />
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className={className} style={style} aria-hidden>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={game.title}
      className={className}
      style={style}
    >
      {inner}
    </button>
  );
}

export function DiscFace({ game, size = 180 }: { game: Game; size?: number }) {
  const art = game.discPhoto || game.coverImage;
  return (
    <div className="disc-face relative" style={{ width: size, height: size }}>
      <span
        className="absolute inset-[18%] overflow-hidden rounded-full"
        style={{
          background: art
            ? `center / cover no-repeat url(${art})`
            : `radial-gradient(circle at 30% 25%, #fff6, transparent 42%), linear-gradient(160deg, ${game.coverColor}, #111)`,
        }}
      />
      {!art && (
        <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
          {game.title}
        </span>
      )}
      <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#05070c] ring-1 ring-white/30" />
    </div>
  );
}
