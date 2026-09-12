"use client";

import { useMemo, useState } from "react";
import { GamePanel } from "@/components/game-panel";
import { useLibrary } from "@/components/library-provider";
import { VinylDisc } from "@/components/vinyl-disc";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type PlayStatus } from "@/lib/types";

function chunk<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

const FILTERS: { id: "all" | PlayStatus; label: string }[] = [
  { id: "all", label: "All discs" },
  { id: "in_progress", label: "In progress" },
  { id: "completed_still_playing", label: "Still playing" },
  { id: "for_sale", label: "For sale" },
  { id: "lent_out", label: "Lent out" },
  { id: "sold", label: "Sold" },
];

export function VinylShelf() {
  const { library, ready } = useLibrary();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const games = useMemo(() => {
    if (filter === "all") return library.games;
    return library.games.filter((game) => game.status === filter);
  }, [library.games, filter]);

  const selected = library.games.find((game) => game.id === selectedId) ?? null;

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Pulling the crates…
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div>
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1 text-xs tracking-wide ${
                filter === item.id
                  ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-16 text-center">
            <p className="font-heading text-2xl">Empty crate</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No discs match this filter. Add a copy or switch views.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {chunk(games, 4).map((slice, row) => (
              <div key={row} className="shelf-plank rounded-md px-4 pb-5 pt-8 sm:px-8">
                <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-10 sm:justify-start">
                  {slice.map((game) => (
                    <div key={game.id} className="flex w-[172px] flex-col items-center">
                      <VinylDisc
                        game={game}
                        selected={selectedId === game.id}
                        onClick={() => setSelectedId(game.id)}
                      />
                      <p className="mt-4 line-clamp-2 text-center text-sm font-medium leading-tight">
                        {game.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-black/40 text-[10px] uppercase tracking-wider"
                      >
                        {STATUS_LABELS[game.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GamePanel
        game={selected}
        onClose={() => setSelectedId(null)}
        emptyHint="Click a disc to see what you paid, who borrowed it, and whether the story is finished."
      />
    </div>
  );
}
