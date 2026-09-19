"use client";

import { useEffect, useState } from "react";
import { GameGrid } from "@/components/game-grid";
import {
  createCloudShelf,
  fetchPublicShelf,
  publicShelfPath,
  pushCloudShelf,
  statusOf,
} from "@/lib/cloud/client";
import type { Game, Profile } from "@/lib/types";
import { money } from "@/lib/format";
import { isForSale } from "@/lib/photos";
import { getStoreSnapshot, localPublicShelf } from "@/lib/storage";

export function PublicShelf({ publicId }: { publicId: string }) {
  const [data, setData] = useState<{
    profile: Profile;
    games: Game[];
    privateShelf?: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await fetchPublicShelf(publicId);
        if (cancelled) return;
        setData({
          profile: payload.profile,
          games: payload.games,
          privateShelf: payload.privateShelf,
        });
        return;
      } catch (err: unknown) {
        const state = getStoreSnapshot();
        const owns =
          state.cloud?.publicId === publicId && Boolean(state.cloud.deviceSecret) && Boolean(state.library);
        if (owns && state.cloud) {
          try {
            try {
              await createCloudShelf({
                deviceSecret: state.cloud.deviceSecret,
                library: state.library,
                publicId,
              });
            } catch (createError) {
              if (statusOf(createError) === 409) {
                await pushCloudShelf({
                  deviceSecret: state.cloud.deviceSecret,
                  library: state.library,
                });
              } else {
                throw createError;
              }
            }
            const payload = await fetchPublicShelf(publicId);
            if (cancelled) return;
            setData({
              profile: payload.profile,
              games: payload.games,
              privateShelf: payload.privateShelf,
            });
            return;
          } catch {
            if (cancelled) return;
            const fallback = localPublicShelf(publicId);
            if (fallback) {
              setData(fallback);
              return;
            }
          }
        }
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "This shelf is not public.");
      }
    }

    void load();
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

  if (data.privateShelf) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0d] px-4">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public shelf</p>
          <h1 className="mt-2 text-2xl font-medium">{`${data.profile.name}'s library`}</h1>
          <p className="mt-3 text-sm text-white/55">This shelf is private right now.</p>
        </div>
      </div>
    );
  }

  const listed = data.games.filter(isForSale);
  const rest = data.games.filter((game) => !isForSale(game));
  const asking = listed.reduce((sum, game) => sum + (game.askingPrice ?? 0), 0);
  const seller = {
    city: data.profile.city,
    currency: data.profile.currency,
    contact: data.profile.contact,
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#161616] px-4 py-6 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public shelf</p>
        <h1 className="mt-1 text-2xl font-medium">{`${data.profile.name}'s library`}</h1>
        <p className="mt-1 text-sm text-white/50">
          {data.profile.city}
          {data.profile.city && data.profile.contact ? " · " : ""}
          {data.profile.contact}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-white/70">{data.profile.note}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/60">
          {listed.length > 0 && (
            <>
              <span>{listed.length} for sale</span>
              <span>·</span>
              <span>Asking {money(asking, data.profile.currency)}</span>
            </>
          )}
          {rest.length > 0 && (
            <>
              {listed.length > 0 ? <span>·</span> : null}
              <span>{rest.length} on the shelf</span>
            </>
          )}
        </div>
        {listed.length > 0 && (
          <section className="mt-8 min-w-0">
            <h2 className="text-lg font-medium">For sale</h2>
            <p className="mt-1 text-sm text-white/50">Tap a photo to zoom. Tap the title for the full copy.</p>
            <div className="mt-4">
              <GameGrid
                games={listed}
                readOnly
                publicView
                showFilters={false}
                layout="listings"
                currency={data.profile.currency}
                seller={seller}
              />
            </div>
          </section>
        )}
        {rest.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-medium">Collection</h2>
            <p className="mt-1 text-sm text-white/50">The rest of the shelf.</p>
            <div className="mt-4">
              <GameGrid
                games={rest}
                readOnly
                publicView
                showFilters={false}
                currency={data.profile.currency}
                seller={seller}
              />
            </div>
          </section>
        )}
        {listed.length === 0 && rest.length === 0 && (
          <p className="mt-10 text-sm text-white/50">Nothing on this public page yet.</p>
        )}
        <p className="mt-8 text-xs text-white/30">{publicShelfPath(publicId)}</p>
      </div>
    </div>
  );
}
