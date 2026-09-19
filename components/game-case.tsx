"use client";

import { useRef } from "react";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { discArt } from "@/lib/photos";
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

export function CoverMarks({
  game,
  compact = false,
}: {
  game: Game;
  compact?: boolean;
}) {
  const listed =
    game.status === "for_sale" ||
    (game.status !== "sold" && (game.askingPrice ?? 0) > 0);
  return (
    <>
      {game.copyKind === "digital" && game.status !== "sold" ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Digital
        </span>
      ) : null}
      {game.status === "sold" ? (
        <span className="absolute inset-0 z-10 grid place-items-center bg-black/45">
          <span className="-rotate-12 rounded border-2 border-white px-3 py-1 text-[11px] font-bold tracking-[0.28em] text-white shadow-lg">
            SOLD
          </span>
        </span>
      ) : listed ? (
        compact ? (
          <span className="absolute left-1.5 top-1.5 z-10 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            For sale
          </span>
        ) : (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-amber-400 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-black">
            For sale
          </span>
        )
      ) : null}
    </>
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
        <span className="game-case-art relative overflow-hidden">
          <CoverArt game={game} />
          <CoverMarks game={game} />
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

export function DiscFace({
  game,
  size = 180,
}: {
  game: Game;
  size?: number | "fill";
}) {
  const art = discArt(game);
  const fill = size === "fill";
  return (
    <div
      className="ps-disc"
      style={fill ? { width: "100%", height: "100%", aspectRatio: "1" } : { width: size, height: size }}
    >
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

export function DiscPicker({
  game,
  size = 108,
  onPick,
  readOnly = false,
}: {
  game: Game;
  size?: number;
  onPick?: (url: string) => void;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canEdit = Boolean(onPick) && !readOnly;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => inputRef.current?.click()}
        className="block rounded-full disabled:cursor-default"
        aria-label={canEdit ? "Upload a disc photo" : `${game.title} disc`}
      >
        <DiscFace game={game} size={size} />
      </button>
      {canEdit ? (
        <>
          <p className="text-xs text-white/40">Tap the disc to change its photo</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file && onPick) onPick(await fileToDataUrl(file));
            }}
          />
        </>
      ) : null}
    </div>
  );
}

