import { cratePath } from "./handle";
import { isCompleted, isForSale, isPlaying } from "./photos";
import type { Game, Profile } from "./types";

export function starText(rating?: number | null) {
  if (!rating) return "";
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return `${"★".repeat(full)}${half ? "½" : ""}`;
}

export function crateStats(games: Game[]) {
  return {
    total: games.length,
    discs: games.filter((game) => game.copyKind !== "digital").length,
    digital: games.filter((game) => game.copyKind === "digital").length,
    playing: games.filter(isPlaying).length,
    listed: games.filter(isForSale).length,
  };
}

export function diaryLine(games: Game[]) {
  const playing = games.filter(isPlaying);
  const finished = games
    .filter((game) => game.status === "completed")
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const parts: string[] = [];
  if (playing.length) {
    parts.push(`Playing ${playing.slice(0, 2).map((game) => game.title).join(", ")}`);
  }
  if (finished[0]) {
    const stars = starText(finished[0].rating);
    parts.push(`Finished ${finished[0].title}${stars ? ` ${stars}` : ""}`);
  }
  return parts.join(" · ");
}

export function favoriteFour(games: Game[], favoriteIds?: string[] | null) {
  const byId = new Map(games.map((game) => [game.id, game]));
  const pinned = (favoriteIds ?? [])
    .map((id) => byId.get(id))
    .filter((game): game is Game => Boolean(game))
    .slice(0, 4);
  if (pinned.length) return pinned;
  return games
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.min(4, games.length));
}

function score(game: Game) {
  return (game.rating ?? 0) * 10 + (isPlaying(game) ? 3 : isCompleted(game) ? 2 : 0);
}

export function hasPinnedFour(games: Game[], favoriteIds?: string[] | null) {
  const ids = new Set(games.map((game) => game.id));
  return (favoriteIds ?? []).some((id) => ids.has(id));
}

export function partitionCrate(games: Game[], favoriteIds?: string[] | null) {
  const four = favoriteFour(games, favoriteIds);
  const fourIds = new Set(four.map((game) => game.id));
  return {
    four,
    listed: games.filter(isForSale),
    collection: games.filter((game) => !isForSale(game) && !fourIds.has(game.id)),
    pinned: hasPinnedFour(games, favoriteIds),
  };
}

export function toggleFavoriteId(ids: string[] | undefined, gameId: string, max = 4) {
  const current = ids ?? [];
  if (current.includes(gameId)) {
    return { ids: current.filter((id) => id !== gameId), full: false };
  }
  if (current.length >= max) {
    return { ids: current, full: true };
  }
  return { ids: [...current, gameId], full: false };
}

export function shelfOverlap(mine: Game[], theirs: Game[]) {
  const titles = new Set(
    mine
      .filter((game) => game.status !== "sold")
      .map((game) => game.title.toLowerCase().trim())
      .filter(Boolean),
  );
  return theirs.filter((game) => titles.has(game.title.toLowerCase().trim()));
}

export function crateSharePath(publicId: string, profile: Pick<Profile, "handle">) {
  return cratePath(publicId, profile.handle);
}

export function crateHeadline(profile: Pick<Profile, "name" | "handle">) {
  const name = profile.name.trim() || "Crate";
  return profile.handle ? `${name} (@${profile.handle})` : name;
}
