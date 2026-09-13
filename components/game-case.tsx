"use client";

import { artSrc } from "@/lib/art-src";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

function CoverArt({ game }: { game: Game }) {
  if (game.coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artSrc(game.coverImage)}
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
  const width = size === "lg" ? 236 : size === "sm" ? 72 : 188;
  const height = Math.round(width * 1.48);
  const className = cn(
    "game-case relative shrink-0 text-left",
    selected && "game-case-selected",
    dimmed && "opacity-55",
  );
  const style = { width, height };
  const inner = (
    <>
      <span className="game-case-spine" />
      <span className="game-case-face">
        <CoverArt game={game} />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/25 to-transparent" />
        <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/90">
          PS5
        </span>
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
    <div className="ps-disc" style={{ width: size, height: size }}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artSrc(art)} alt="" className="ps-disc-art" />
      ) : (
        <span
          className="ps-disc-art block"
          style={{ background: `linear-gradient(160deg, ${game.coverColor}, #111)` }}
        />
      )}
      <span className="ps-disc-print" />
      <span className="ps-disc-hub" />
      <span className="ps-disc-hole" />
      <span className="ps-disc-shine" />
    </div>
  );
}
