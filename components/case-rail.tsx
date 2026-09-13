"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { artSrc } from "@/lib/art-src";
import { DiscFace, GameCase } from "@/components/game-case";
import { GamePanel } from "@/components/game-panel";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { STATUS_LABELS, type PlayStatus } from "@/lib/types";

const FILTERS: { id: "all" | PlayStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lent_out", label: "Lent out" },
  { id: "for_sale", label: "For sale" },
  { id: "sold", label: "Sold" },
];

export function CaseRail({
  games: gamesProp,
  readOnly = false,
}: {
  games?: ReturnType<typeof useLibrary>["library"]["games"];
  readOnly?: boolean;
}) {
  const { library } = useLibrary();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [focus, setFocus] = useState(0);
  const [opened, setOpened] = useState(false);
  const touchX = useRef<number | null>(null);

  const source = gamesProp ?? library.games;
  const games = useMemo(() => {
    if (filter === "all") return source;
    return source.filter((game) => game.status === filter);
  }, [source, filter]);

  const safeFocus = games.length === 0 ? 0 : Math.min(focus, games.length - 1);
  const selected = games[safeFocus] ?? null;
  const backdrop = selected?.coverImage ? artSrc(selected.coverImage) : "";

  function move(delta: number) {
    setFocus((value) => Math.min(games.length - 1, Math.max(0, value + delta)));
    setOpened(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setFocus((value) => Math.min(games.length - 1, Math.max(0, value + 1)));
        setOpened(false);
      }
      if (event.key === "ArrowLeft") {
        setFocus((value) => Math.min(games.length - 1, Math.max(0, value - 1)));
        setOpened(false);
      }
      if (event.key === "Enter" && selected) setOpened(true);
      if (event.key === "Escape") setOpened(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [games.length, selected]);

  if (games.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-2xl font-medium">No cases here</p>
        <p className="mt-2 text-sm text-white/70">Add a copy, or switch the filter.</p>
      </div>
    );
  }

  return (
    <div className="aurora-stage">
      {backdrop && (
        <div
          className="aurora-hero"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="flex justify-center gap-2 px-4 pt-3">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setFocus(0);
                setOpened(false);
              }}
              className={`rounded-full px-3 py-1 text-xs ${
                filter === item.id
                  ? "bg-white text-black"
                  : "bg-black/40 text-white/85"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="coverflow flex-1"
          onTouchStart={(event) => {
            touchX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchX.current == null) return;
            const dx = event.changedTouches[0].clientX - touchX.current;
            if (dx < -40) move(1);
            if (dx > 40) move(-1);
            touchX.current = null;
          }}
        >
          {games.map((game, index) => {
            const offset = index - safeFocus;
            const abs = Math.abs(offset);
            return (
              <div
                key={game.id}
                className="coverflow-item"
                style={{
                  zIndex: 80 - abs,
                  transform: `
                    translate(-50%, -50%)
                    translateX(${offset * 132}px)
                    translateZ(${offset === 0 ? 140 : -abs * 95}px)
                    rotateY(${offset * -55}deg)
                    scale(${offset === 0 ? 1.12 : Math.max(0.84, 0.97 - abs * 0.03)})
                  `,
                  opacity: abs > 5 ? 0 : 1,
                  pointerEvents: abs > 5 ? "none" : "auto",
                }}
              >
                <div className="coverflow-stack">
                  <GameCase
                    game={game}
                    selected={offset === 0}
                    dimmed={offset !== 0}
                    onClick={() => {
                      if (index === safeFocus) setOpened(true);
                      else {
                        setFocus(index);
                        setOpened(false);
                      }
                    }}
                  />
                  <div className="coverflow-reflection">
                    <GameCase game={game} dimmed />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="aurora-titlebar">
            <p className="text-xl font-semibold sm:text-2xl">{selected.title}</p>
            <p className="text-sm text-white/70">
              {safeFocus + 1} of {games.length}
              {selected.status === "for_sale" && selected.askingPrice != null
                ? ` · ${money(selected.askingPrice, library.profile.currency)}`
                : ` · ${STATUS_LABELS[selected.status]}`}
            </p>
          </div>
        )}

        <div className="aurora-actions">
          <button type="button" onClick={() => setOpened(true)}>
            <span className="aurora-key aurora-key-a">A</span> Open
          </button>
          <button type="button" onClick={() => move(-1)}>
            <span className="aurora-key aurora-key-b">B</span> Prev
          </button>
          <button type="button" onClick={() => move(1)}>
            <span className="aurora-key aurora-key-x">X</span> Next
          </button>
          <button type="button" onClick={() => setOpened(true)}>
            <span className="aurora-key aurora-key-y">Y</span> Details
          </button>
        </div>
      </div>

      {opened && selected && (
        <div className="case-overlay" role="dialog" aria-label={`Opened ${selected.title}`}>
          {selected.coverImage && (
            <div
              className="aurora-hero"
              style={{ backgroundImage: `url(${artSrc(selected.coverImage)})` }}
            />
          )}
          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">
                Case open
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{selected.title}</h2>
              <div className="keep-case mt-8 opened">
                <div className="keep-tray">
                  <DiscFace game={selected} size={168} />
                </div>
                <div className="keep-lid">
                  <GameCase game={selected} size="lg" />
                </div>
              </div>
              <Button className="mt-6" variant="outline" onClick={() => setOpened(false)}>
                Back to the shelf
              </Button>
            </div>
            <GamePanel
              game={selected}
              readOnly={readOnly}
              onClose={() => setOpened(false)}
              emptyHint=""
            />
          </div>
        </div>
      )}
    </div>
  );
}
