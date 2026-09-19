"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CrateCardButton } from "@/components/crate-card";
import { GameGrid } from "@/components/game-grid";
import { GamePanel } from "@/components/game-panel";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { artSrc } from "@/lib/art-src";
import { crateSharePath, crateStats, diaryLine, partitionCrate, shelfOverlap, starText } from "@/lib/crate";
import type { Game, Profile } from "@/lib/types";

export function CrateView({
  profile,
  games,
  publicId,
  copyListing = false,
  showCard = true,
  visitorGames,
  isOwner = false,
}: {
  profile: Profile;
  games: Game[];
  publicId?: string;
  copyListing?: boolean;
  showCard?: boolean;
  visitorGames?: Game[];
  isOwner?: boolean;
}) {
  const [opened, setOpened] = useState<Game | null>(null);
  const path = publicId ? crateSharePath(publicId, profile) : "";
  const shareUrl =
    typeof window !== "undefined" && path
      ? `${window.location.origin}${path}`
      : path;
  const takes = games.filter((game) => game.review?.trim());
  const stats = crateStats(games);
  const diary = diaryLine(games);
  const { four, listed, collection, pinned } = partitionCrate(games, profile.favoriteIds);
  const twins =
    !isOwner && visitorGames && visitorGames.length
      ? shelfOverlap(visitorGames, games)
      : [];
  const seller = {
    city: profile.city,
    currency: profile.currency,
    contact: profile.contact,
  };
  const countLine = [
    stats.discs ? `${stats.discs} disc${stats.discs === 1 ? "" : "s"}` : `${stats.total} games`,
    stats.playing ? `${stats.playing} playing` : "",
    stats.listed ? `${stats.listed} available` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector("[data-photo-lightbox]")) return;
      setOpened(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (games.length === 0) {
    return (
      <p className="mt-8 text-sm text-white/50">Nothing on this Crate yet.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-10">
      <header className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Crate</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">
          {profile.name.trim() || "Crate"}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {[profile.handle ? `@${profile.handle}` : "", profile.city.trim()]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {diary ? (
          <p className="mt-3 max-w-2xl text-base text-white/80">{diary}</p>
        ) : null}
        {profile.note.trim() ? (
          <p className="mt-3 max-w-2xl text-sm text-white/60">{profile.note.trim()}</p>
        ) : null}
        <p className="mt-4 text-sm text-white/55">{countLine}</p>
        {twins.length > 0 ? (
          <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75 ring-1 ring-white/8">
            You both own {twins.length}
            {twins.length <= 6 ? `: ${twins.map((game) => game.title).join(", ")}` : "."}
          </p>
        ) : null}
        {showCard && path ? (
          <div className="mt-5">
            <CrateCardButton profile={profile} games={games} path={path} />
          </div>
        ) : null}
      </header>

      {four.length > 0 ? (
        <section>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
            {pinned ? "Favourites" : "On the shelf"}
          </p>
          <h2 className="mt-1 text-xl font-medium">Four on the shelf</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {four.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => setOpened(game)}
                className="group min-w-0 text-left"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-[#0e0e10] ring-1 ring-white/10 transition group-hover:ring-white/30">
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
                <span className="mt-2 block truncate text-sm text-white/90">{game.title}</span>
                {game.rating ? (
                  <span className="mt-0.5 block text-xs text-amber-300/90">{starText(game.rating)}</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {takes.length > 0 ? (
        <section className="min-w-0 space-y-3">
          <h2 className="text-lg font-medium">Takes</h2>
          <p className="text-sm text-white/50">Logged like a review. Tap to open the copy.</p>
          {takes.map((game) => (
            <ReviewCard
              key={game.id}
              game={game}
              profile={profile}
              url={shareUrl}
              shareable={isOwner}
              onOpen={() => setOpened(game)}
            />
          ))}
        </section>
      ) : null}

      {collection.length > 0 ? (
        <section className="min-w-0">
          <h2 className="text-lg font-medium">Collection</h2>
          <p className="mt-1 text-sm text-white/50">The rest of the shelf.</p>
          <div className="mt-4">
            <GameGrid
              games={collection}
              readOnly
              publicView
              showFilters={false}
              caption={false}
              currency={profile.currency}
              seller={seller}
              onOpenGame={setOpened}
            />
          </div>
        </section>
      ) : null}

      {listed.length > 0 ? (
        <section className="min-w-0">
          <h2 className="text-lg font-medium">A few copies available</h2>
          <p className="mt-1 text-sm text-white/50">
            Same shelf. Tap a photo to zoom. Tap the title for the full copy.
            {profile.contact.trim() ? ` ${profile.contact.trim()}` : ""}
          </p>
          <div className="mt-4">
            <GameGrid
              games={listed}
              readOnly
              publicView
              showFilters={false}
              layout="listings"
              copyListing={copyListing}
              currency={profile.currency}
              seller={seller}
              onOpenGame={setOpened}
            />
          </div>
        </section>
      ) : null}

      {path ? <p className="text-xs text-white/30">{path}</p> : null}

      {opened &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex h-dvh min-w-0 flex-col overflow-hidden bg-[#161616] sm:inset-5 sm:h-auto sm:rounded-[22px] sm:border sm:border-white/10 sm:shadow-2xl"
            role="dialog"
            aria-label={opened.title}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
              <Button variant="outline" size="sm" onClick={() => setOpened(null)}>
                Back
              </Button>
              <p className="min-w-0 truncate text-sm font-medium">{opened.title}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <GamePanel
                game={opened}
                onClose={() => setOpened(null)}
                emptyHint=""
                readOnly
                publicView
                hideChrome
                currency={profile.currency}
                author={profile}
                allowAdd={!isOwner}
                shareUrl={shareUrl}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
