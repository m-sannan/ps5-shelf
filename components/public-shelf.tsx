"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CrateView } from "@/components/crate-view";
import {
  createCloudShelf,
  fetchPublicShelf,
  pushCloudShelf,
  statusOf,
} from "@/lib/cloud/client";
import type { Game, Profile } from "@/lib/types";
import {
  getServerStoreSnapshot,
  getStoreSnapshot,
  localPublicShelf,
  subscribeStore,
} from "@/lib/storage";

export function PublicShelf({ publicId }: { publicId: string }) {
  const [data, setData] = useState<{
    profile: Profile;
    games: Game[];
    privateShelf?: boolean;
    publicId?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const store = useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerStoreSnapshot);
  const handle = store.library?.profile?.handle?.trim().toLowerCase();
  const owner =
    store.cloud?.publicId === publicId ||
    Boolean(handle && handle === publicId.trim().toLowerCase());
  const visitorGames = owner ? [] : store.library?.games ?? [];

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
          publicId: payload.publicId,
        });
        return;
      } catch (err: unknown) {
        const state = getStoreSnapshot();
        const handle = state.library?.profile?.handle?.trim().toLowerCase();
        const owns =
          Boolean(state.cloud?.deviceSecret) &&
          Boolean(state.library) &&
          (state.cloud?.publicId === publicId || handle === publicId.trim().toLowerCase());
        if (owns && state.cloud) {
          try {
            try {
              await createCloudShelf({
                deviceSecret: state.cloud.deviceSecret,
                library: state.library,
                publicId: state.cloud.publicId,
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
              publicId: payload.publicId,
            });
            return;
          } catch {
            if (cancelled) return;
            const fallback = localPublicShelf(publicId);
            if (fallback) {
              setData({ ...fallback, publicId: state.cloud.publicId });
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
        <p className="text-sm text-white/50">Opening this Crate…</p>
      </div>
    );
  }

  if (data.privateShelf) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0d] px-4">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Crate</p>
          <h1 className="mt-2 text-2xl font-medium">{data.profile.name.trim() || "Crate"}</h1>
          <p className="mt-3 text-sm text-white/55">This Crate is private right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#161616] px-4 py-6 pb-16 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10 sm:px-6">
        <CrateView
          profile={data.profile}
          games={data.games}
          publicId={data.publicId || publicId}
          showCard
          visitorGames={visitorGames}
          isOwner={owner}
        />
      </div>
    </div>
  );
}
