import type { Game } from "./types";

export const MAX_CONDITION_PHOTOS = 5;

/** Extra shots of the physical copy. Never overwrites box art or the disc face. */
export function conditionPhotos(game: Pick<Game, "photos" | "casePhoto">): string[] {
  if (game.photos && game.photos.length > 0) {
    return game.photos.filter(Boolean).slice(0, MAX_CONDITION_PHOTOS);
  }
  return game.casePhoto ? [game.casePhoto] : [];
}

export function conditionFields(photos: string[]): Pick<Game, "photos"> {
  return { photos: photos.filter(Boolean).slice(0, MAX_CONDITION_PHOTOS) };
}

export function coverOf(game: Pick<Game, "coverImage">) {
  return game.coverImage ?? null;
}

export function discArt(game: Pick<Game, "coverImage" | "discPhoto">) {
  return game.discPhoto || game.coverImage;
}

export function isForSale(game: Pick<Game, "status" | "askingPrice">) {
  if (game.status === "sold") return false;
  if (game.status === "for_sale") return true;
  return game.askingPrice != null && game.askingPrice > 0;
}

export function shelfStatus(status: Game["status"]): "on_shelf" | "for_sale" | "sold" {
  if (status === "for_sale" || status === "sold") return status;
  return "on_shelf";
}

export function snapRating(value: number) {
  return Math.min(5, Math.max(0, Math.round(value * 2) / 2));
}
