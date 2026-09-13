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
      className="flex h-full w-full items-end p-3 text-white"
      style={{
        background: `linear-gradient(165deg, ${game.coverColor} 0%, #071018 78%)`,
      }}
    >
      <p className="text-left text-base font-semibold leading-tight">{game.title}</p>
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
  const width = size === "lg" ? 250 : size === "sm" ? 64 : 198;
  const height = Math.round(width * 1.42);
  const className = cn(
    "game-case relative shrink-0 text-left",
    selected && "game-case-selected",
    dimmed && "opacity-80",
  );
  const inner = (
    <>
      <span className="game-case-spine" />
      <span className="game-case-face">
        <span className="game-case-banner">
          <span>PS5</span>
          <span className="tracking-[0.2em]">PLAYSTATION</span>
        </span>
        <span className="game-case-art">
          <CoverArt game={game} />
        </span>
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className={className} style={{ width, height }} aria-hidden>
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
      style={{ width, height }}
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
