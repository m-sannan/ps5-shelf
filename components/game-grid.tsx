"use client";

import { useEffect, useMemo, useState } from "react";
import { DiscFace } from "@/components/game-case";
import { GamePanel } from "@/components/game-panel";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { artSrc } from "@/lib/art-src";
import { money } from "@/lib/format";
import { STATUS_LABELS, type Game, type PlayStatus } from "@/lib/types";

const FILTERS: { id: "all" | PlayStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lent_out", label: "Lent out" },
  { id: "for_sale", label: "For sale" },
  { id: "sold", label: "Sold" },
];

export function GameGrid({
  games: gamesProp,
  readOnly = false,
}: {
  games?: Game[];
  readOnly?: boolean;
}) {
  const { library } = useLibrary();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [openedId, setOpenedId] = useState<string | null>(null);

  const source = gamesProp ?? library.games;
  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((game) => {
      if (filter !== "all" && game.status !== filter) return false;
      if (q && !game.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [source, filter, query]);

  const opened = games.find((game) => game.id === openedId) ?? null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setOpenedId(null);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
                filter === item.id
                  ? "bg-[#2f2f32] text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your games"
          className="h-10 w-full rounded-full bg-black/30 sm:max-w-xs"
        />
      </div>

      <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/35">
        Library {games.length}
      </p>

      {games.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-medium">No copies here</p>
          <p className="mt-2 text-sm text-white/55">
            Add a game, or clear the search and filters.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setOpenedId(game.id)}
              className="group text-left"
            >
              <span className="block overflow-hidden rounded-lg bg-[#0e0e10] ring-1 ring-white/8 transition group-hover:ring-white/25">
                <span className="relative block aspect-[3/4]">
                  {game.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artSrc(game.coverImage)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-end p-3 text-sm font-semibold"
                      style={{
                        background: `linear-gradient(165deg, ${game.coverColor} 0%, #0b0b0d 80%)`,
                      }}
                    >
                      {game.title}
                    </span>
                  )}
                </span>
              </span>
              <span className="mt-2 block truncate text-sm text-white/90">
                {game.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/40">
                {game.status === "for_sale" && game.askingPrice != null
                  ? money(game.askingPrice, library.profile.currency)
                  : STATUS_LABELS[game.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      {opened && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#161616] sm:inset-5 sm:rounded-[22px] sm:border sm:border-white/10 sm:shadow-2xl"
          role="dialog"
          aria-label={opened.title}
        >
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenedId(null)}>
              Back
            </Button>
            <h2 className="min-w-0 truncate text-base font-medium">{opened.title}</h2>
          </div>
          <div className="flex-1 overflow-auto px-4 py-5 pb-10 sm:px-6">
            <div className="mx-auto flex max-w-lg items-end gap-4">
              <div className="w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-36">
                <div className="aspect-[3/4]">
                  {opened.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artSrc(opened.coverImage)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full items-end p-2 text-xs font-semibold"
                      style={{
                        background: `linear-gradient(165deg, ${opened.coverColor} 0%, #0b0b0d 80%)`,
                      }}
                    >
                      {opened.title}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/35">
                  Disc
                </p>
                <DiscFace game={opened} size={108} />
              </div>
            </div>
            <div className="mx-auto mt-6 max-w-lg">
              <GamePanel
                game={opened}
                readOnly={readOnly}
                hideChrome
                onClose={() => setOpenedId(null)}
                emptyHint=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
