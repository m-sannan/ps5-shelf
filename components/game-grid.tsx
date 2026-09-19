"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CoverMarks, DiscFace, DiscPicker } from "@/components/game-case";
import { GamePanel } from "@/components/game-panel";
import { ListingCard } from "@/components/listing-card";
import { PhotoLightbox } from "@/components/photo-gallery";
import { RatingStars } from "@/components/rating-stars";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { artSrc } from "@/lib/art-src";
import { money } from "@/lib/format";
import {
  conditionPhotos,
  coverOf,
  isCompleted,
  isForSale,
  isPlaying,
  listingShots,
  playLabel,
} from "@/lib/photos";
import {
  CONDITION_LABELS,
  type CurrencyCode,
  type Game,
  type Profile,
} from "@/lib/types";

type FilterId = "all" | "playing" | "done" | "for_sale" | "sold";

export function GameGrid({
  games: gamesProp,
  readOnly = false,
  publicView = false,
  showFilters,
  currency,
  layout = "grid",
  copyListing = false,
  seller,
  caption,
  onOpenGame,
}: {
  games?: Game[];
  readOnly?: boolean;
  publicView?: boolean;
  showFilters?: boolean;
  currency?: CurrencyCode;
  layout?: "grid" | "listings";
  copyListing?: boolean;
  seller?: Pick<Profile, "city" | "currency" | "contact">;
  caption?: string | false;
  onOpenGame?: (game: Game) => void;
}) {
  const { library, updateGame } = useLibrary();
  const filtersOn = showFilters ?? true;
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [shelfView, setShelfView] = useState<"art" | "disc">("art");
  const [shotIndex, setShotIndex] = useState<number | null>(null);
  const moneyCurrency = currency ?? library.profile.currency;
  const sellerCard = seller ?? {
    city: library.profile.city,
    currency: moneyCurrency,
    contact: library.profile.contact,
  };
  const shelfToggle = !publicView && !readOnly;

  const source = gamesProp ?? library.games;
  const saleCount = source.filter(isForSale).length;
  const soldCount = source.filter((game) => game.status === "sold").length;
  const playingCount = source.filter(isPlaying).length;
  const doneCount = source.filter((game) => game.status === "completed").length;
  const filters: { id: FilterId; label: string; count: number }[] = publicView
    ? [
        { id: "all", label: "All", count: source.length },
        { id: "for_sale", label: "For sale", count: saleCount },
      ]
    : [
        { id: "all", label: "All", count: source.length },
        { id: "playing", label: "Playing", count: playingCount },
        { id: "done", label: "Done", count: doneCount },
        { id: "for_sale", label: "For sale", count: saleCount },
        { id: "sold", label: "Sold", count: soldCount },
      ];

  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = source.filter((game) => {
      if (filter === "playing" && !isPlaying(game)) return false;
      if (filter === "done" && game.status !== "completed") return false;
      if (filter === "for_sale" && !isForSale(game)) return false;
      if (filter === "sold" && game.status !== "sold") return false;
      if (q && !game.title.toLowerCase().includes(q)) return false;
      return true;
    });
    return next.slice().sort((a, b) => {
      const rank = (game: Game) => {
        if (game.status === "sold") return 3;
        if (isPlaying(game)) return 0;
        if (isCompleted(game)) return 1;
        return 2;
      };
      return rank(a) - rank(b);
    });
  }, [source, filter, query]);

  const opened = onOpenGame ? null : source.find((game) => game.id === openedId) ?? null;
  const openedShots = opened ? listingShots(opened) : [];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector("[role='listbox']")) return;
      if (document.querySelector("[data-photo-lightbox]")) return;
      setOpenedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function selectGame(game: Game) {
    if (onOpenGame) {
      onOpenGame(game);
      return;
    }
    setOpenedId(game.id);
  }

  function openShot(src: string | null | undefined) {
    if (!src || !opened) return;
    const shots = listingShots(opened);
    const index = shots.findIndex((shot) => shot.src === src);
    setShotIndex(index >= 0 ? index : 0);
  }

  return (
    <div className="min-w-0">
      {filtersOn && (
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((item) => (
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
              {item.label} {item.count}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={publicView ? "Search games" : "Search your games"}
          className="h-10 w-full min-w-0 rounded-full bg-black/30 sm:max-w-xs"
        />
      </div>
      )}

      {shelfToggle && (
        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setShelfView("art")}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              shelfView === "art" ? "bg-[#2f2f32] text-white" : "text-white/45 hover:text-white"
            }`}
          >
            Artwork
          </button>
          <button
            type="button"
            onClick={() => setShelfView("disc")}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              shelfView === "disc" ? "bg-[#2f2f32] text-white" : "text-white/45 hover:text-white"
            }`}
          >
            Discs
          </button>
        </div>
      )}

      {layout !== "listings" && caption !== false && (
      <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/35">
        {caption ?? (publicView ? "Copies" : "Library")} {games.length}
      </p>
      )}

      {games.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-medium">
            {filter === "for_sale"
              ? "Nothing listed for sale"
              : filter === "playing"
                ? "Nothing in the stack"
                : filter === "done"
                  ? "Nothing marked done"
                  : filter === "sold"
                    ? "Nothing sold yet"
                    : "No copies here"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/55">
            {filter === "for_sale"
              ? "Open a game and turn on For sale. It will show up here and on your public link."
              : filter === "playing"
                ? "Open a game and set it to Playing. That’s your current stack."
                : publicView
                  ? "Nothing listed in this view."
                  : "Add a game, or clear the search and filters."}
          </p>
        </div>
      ) : layout === "listings" ? (
        <div className="mt-4 space-y-4">
          {games.map((game) => (
            <ListingCard
              key={game.id}
              game={game}
              profile={sellerCard}
              onOpen={() => selectGame(game)}
              canCopy={copyListing}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {games.map((game) => {
            const cover = coverOf(game);
            const listed = isForSale(game);
            const copyCount = conditionPhotos(game).length;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => selectGame(game)}
                className="group min-w-0 text-left"
              >
                <span className="block overflow-hidden rounded-lg bg-[#0e0e10] ring-1 ring-white/8 transition group-hover:ring-white/25">
                  {shelfToggle && shelfView === "disc" ? (
                    <span className="relative block aspect-square">
                      <span className="absolute inset-[11%]">
                        <DiscFace game={game} size="fill" />
                      </span>
                      <CoverMarks game={game} compact />
                    </span>
                  ) : (
                  <span className="relative block aspect-[3/4]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artSrc(cover)}
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
                    <CoverMarks game={game} />
                  </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-sm text-white/90">
                  {game.title}
                </span>
                {game.rating ? (
                  <span className="mt-0.5 block">
                    <RatingStars value={game.rating} readOnly size="sm" />
                  </span>
                ) : null}
                <span className="mt-0.5 block truncate text-xs text-white/40">
                  {listed && game.askingPrice != null
                    ? `${money(game.askingPrice, moneyCurrency)} · ${CONDITION_LABELS[game.condition]}${
                        copyCount ? ` · ${copyCount} photo${copyCount === 1 ? "" : "s"}` : ""
                      }`
                    : game.status === "sold"
                      ? "Sold"
                      : game.copyKind === "digital"
                        ? playLabel(game.status)
                        : !publicView && game.borrowedFrom
                          ? `${playLabel(game.status)} · from ${game.borrowedFrom}`
                          : `${playLabel(game.status)} · ${CONDITION_LABELS[game.condition]}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {opened &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex h-dvh min-w-0 flex-col overflow-hidden bg-[#161616] sm:inset-5 sm:h-auto sm:rounded-[22px] sm:border sm:border-white/10 sm:shadow-2xl"
          role="dialog"
          aria-label={opened.title}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenedId(null)}>
              Back
            </Button>
            <h2 className="min-w-0 flex-1 truncate text-base font-medium">{opened.title}</h2>
            {!readOnly && (
              <span className="shrink-0 text-xs text-white/40">Saved as you go</span>
            )}
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 pb-10 sm:px-6">
            <div className="mx-auto flex max-w-lg items-end gap-4">
              <button
                type="button"
                className="relative w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-36"
                onClick={() => openShot(opened.coverImage)}
                aria-label={`Expand ${opened.title} box art`}
              >
                <div className="relative aspect-[3/4]">
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
                  <CoverMarks game={opened} />
                </div>
              </button>
              {opened.copyKind !== "digital" && (
                <DiscPicker
                  game={opened}
                  size={108}
                  readOnly={readOnly}
                  onOpen={
                    opened.discPhoto || opened.coverImage
                      ? () => openShot(opened.discPhoto || opened.coverImage)
                      : undefined
                  }
                  onPick={
                    readOnly
                      ? undefined
                      : (url) => updateGame(opened.id, { discPhoto: url })
                  }
                />
              )}
            </div>
            <div className="mx-auto mt-6 max-w-lg min-w-0">
              <GamePanel
                game={opened}
                readOnly={readOnly}
                hideChrome
                publicView={publicView}
                currency={sellerCard.currency}
                onClose={() => setOpenedId(null)}
                emptyHint=""
              />
            </div>
          </div>
        </div>,
        document.body,
      )}

      {shotIndex != null && openedShots.length > 0 && (
        <PhotoLightbox
          key={shotIndex}
          photos={openedShots.map((shot) => shot.src)}
          captions={openedShots.map((shot) => shot.caption)}
          index={shotIndex}
          title={opened?.title ?? "Photo"}
          onClose={() => setShotIndex(null)}
        />
      )}
    </div>
  );
}
