"use client";

import { useEffect, useMemo, useState } from "react";
import { DiscFace, GameCase } from "@/components/game-case";
import { GamePanel } from "@/components/game-panel";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { STATUS_LABELS, type PlayStatus } from "@/lib/types";

const FILTERS: { id: "all" | PlayStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "completed_still_playing", label: "Still playing" },
  { id: "for_sale", label: "For sale" },
  { id: "lent_out", label: "Lent out" },
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

  const source = gamesProp ?? library.games;
  const games = useMemo(() => {
    if (filter === "all") return source;
    return source.filter((game) => game.status === filter);
  }, [source, filter]);

  const safeFocus = games.length === 0 ? 0 : Math.min(focus, games.length - 1);
  const selected = games[safeFocus] ?? null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setFocus((value) => Math.min(games.length - 1, value + 1));
        setOpened(false);
      }
      if (event.key === "ArrowLeft") {
        setFocus((value) => Math.max(0, value - 1));
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
      <div className="flex min-h-[42vh] flex-col items-center justify-center text-center">
        <p className="text-2xl font-medium">No cases here</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a PS5 copy, or switch the filter.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setFocus(0);
              setOpened(false);
            }}
            className={`rounded-full px-3 py-1 text-xs tracking-wide ${
              filter === item.id
                ? "bg-white text-black"
                : "bg-white/8 text-white/70 hover:bg-white/12"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="coverflow">
        {games.map((game, index) => {
          const offset = index - safeFocus;
          return (
            <div
              key={game.id}
              className="coverflow-item"
              style={{
                zIndex: 40 - Math.abs(offset),
                transform: `translateX(${offset * 118}px) rotateY(${offset * -28}deg) scale(${offset === 0 ? 1.12 : 0.86})`,
                opacity: Math.abs(offset) > 4 ? 0 : 1,
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
        <div className="mt-2 text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
            {selected.title}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {safeFocus + 1} of {games.length} · {STATUS_LABELS[selected.status]}
            {selected.status === "for_sale" && selected.askingPrice != null
              ? ` · ${money(selected.askingPrice, library.profile.currency)}`
              : ""}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => setFocus((v) => Math.max(0, v - 1))}>
              Prev
            </Button>
            <Button onClick={() => setOpened(true)}>Open case</Button>
            <Button
              variant="outline"
              onClick={() => setFocus((v) => Math.min(games.length - 1, v + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {opened && selected && (
        <div className="case-overlay" role="dialog" aria-label={`Opened ${selected.title}`}>
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">
                Case opened
              </p>
              <h2 className="mt-2 text-3xl font-medium">{selected.title}</h2>
              <div className="keep-case mt-8 opened">
                <div className="keep-tray">
                  <DiscFace game={selected} size={168} />
                </div>
                <div className="keep-lid">
                  <GameCase game={selected} size="lg" />
                </div>
              </div>
              <p className="mt-6 max-w-md text-sm text-white/60">
                Front cover lifts off so you can see the disc. Upload box art
                and a photo of the actual disc from the details panel if the
                placeholder art is not yours.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setOpened(false)}>
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
