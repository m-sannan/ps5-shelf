"use client";

import { useMemo, useState } from "react";
import { GamePanel } from "@/components/game-panel";
import { useLibrary } from "@/components/library-provider";
import { VinylDisc } from "@/components/vinyl-disc";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { libraryStats } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/types";

export function ShareLibrary() {
  const { library, ready } = useLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const stats = libraryStats(library);
  const listed = useMemo(
    () => library.games.filter((game) => game.status !== "sold"),
    [library.games],
  );
  const selected = listed.find((game) => game.id === selectedId) ?? null;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/share`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Opening the crate…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 to-transparent p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200/80">
          For sale & show-around
        </p>
        <h1 className="font-heading mt-2 text-4xl sm:text-5xl">
          {library.profile.name}&apos;s shelf
        </h1>
        <p className="mt-2 text-muted-foreground">
          {library.profile.city}
          {library.profile.city && library.profile.contact ? " · " : ""}
          {library.profile.contact}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          {library.profile.note}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-black/30 px-3 py-1">
            {listed.length} copies on the shelf
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            {stats.forSale} listed
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            Asking {money(stats.asking)}
          </span>
        </div>
        <Button className="mt-6" onClick={copyLink}>
          {copied ? "Link copied" : "Copy share link"}
        </Button>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="shelf-plank rounded-md px-4 py-8 sm:px-8">
          {listed.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Everything sold. The crate is empty.
            </p>
          ) : (
            <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-10 sm:justify-start">
              {listed.map((game) => (
                <div key={game.id} className="flex w-[172px] flex-col items-center">
                  <VinylDisc
                    game={game}
                    selected={selectedId === game.id}
                    onClick={() => setSelectedId(game.id)}
                  />
                  <p className="mt-4 line-clamp-2 text-center text-sm font-medium">
                    {game.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-amber-200/80">
                    {game.status === "for_sale" && game.askingPrice != null
                      ? money(game.askingPrice)
                      : STATUS_LABELS[game.status]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <GamePanel
          game={selected}
          readOnly
          onClose={() => setSelectedId(null)}
          emptyHint="Tap a disc to see condition, asking price, and the real photos of that copy."
        />
      </div>
    </div>
  );
}
