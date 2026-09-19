"use client";

import { useEffect, useState } from "react";
import { GameGrid } from "@/components/game-grid";
import { fetchPublicShelf, publicShelfPath } from "@/lib/cloud/client";
import type { Game, Profile } from "@/lib/types";
import { money } from "@/lib/format";
import { isForSale } from "@/lib/photos";

export function PublicShelf({ publicId }: { publicId: string }) {
  const [data, setData] = useState<{
    profile: Profile;
    games: Game[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicShelf(publicId)
      .then((payload) => {
        if (cancelled) return;
        setData({ profile: payload.profile, games: payload.games });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "This shelf is not public.");
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0d] px-4">
        <p className="text-sm text-white/60">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0d] px-4">
        <p className="text-sm text-white/50">Opening the public shelf…</p>
      </div>
    );
  }

  const listed = data.games.filter(isForSale);
  const rest = data.games.filter((game) => !isForSale(game));
  const asking = listed.reduce((sum, game) => sum + (game.askingPrice ?? 0), 0);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#161616] px-4 py-6 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public shelf</p>
        <h1 className="mt-1 text-2xl font-medium">{data.profile.name}'s library</h1>
        <p className="mt-1 text-sm text-white/50">
          {data.profile.city}
          {data.profile.city && data.profile.contact ? " · " : ""}
          {data.profile.contact}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-white/70">{data.profile.note}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/60">
          <span>{data.games.length} copies</span>
          {listed.length > 0 && (
            <>
              <span>·</span>
              <span>{listed.length} for sale</span>
              <span>·</span>
              <span>Asking {money(asking, data.profile.currency)}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-white/35">
          Copies with a gold For sale bar are listed. Asking price and condition are on the cover.
        </p>
        {listed.length > 0 && (
          <section className="mt-8 min-w-0">
            <h2 className="text-lg font-medium">For sale</h2>
            <p className="mt-1 text-sm text-white/50">Asking price and disc condition.</p>
            <div className="mt-4">
              <GameGrid games={listed} readOnly publicView showFilters={false} currency={data.profile.currency} />
            </div>
          </section>
        )}
        {rest.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-medium">On the shelf</h2>
            <p className="mt-1 text-sm text-white/50">The rest of the collection.</p>
            <div className="mt-4">
              <GameGrid games={rest} readOnly publicView showFilters={false} currency={data.profile.currency} />
            </div>
          </section>
        )}
        <p className="mt-8 text-xs text-white/30">{publicShelfPath(publicId)}</p>
      </div>
    </div>
  );
}
