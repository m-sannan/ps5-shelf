import type { CopyKind, Game, PlayStatus } from "./types";

export const MAX_CONDITION_PHOTOS = 5;

export type PlayLane = "shelf" | "playing" | "done";

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

export function listingShots(
  game: Pick<Game, "photos" | "casePhoto" | "discPhoto" | "coverImage">,
): { src: string; caption: string }[] {
  const shots: { src: string; caption: string }[] = [];
  conditionPhotos(game).forEach((src, index) => {
    shots.push({ src, caption: `This copy · ${index + 1}` });
  });
  if (game.discPhoto && !shots.some((shot) => shot.src === game.discPhoto)) {
    shots.push({ src: game.discPhoto, caption: "Disc" });
  }
  if (game.coverImage && !shots.some((shot) => shot.src === game.coverImage)) {
    shots.push({ src: game.coverImage, caption: "Box art" });
  }
  return shots;
}

export function isForSale(game: Pick<Game, "status" | "askingPrice" | "copyKind">) {
  if (game.copyKind === "digital") return false;
  if (game.status === "sold") return false;
  if (game.status === "for_sale") return true;
  return game.askingPrice != null && game.askingPrice > 0;
}

export function digitalCopyPatch(status: PlayStatus): Partial<Game> {
  return {
    copyKind: "digital",
    askingPrice: null,
    soldPrice: null,
    status: status === "sold" || status === "for_sale" ? "on_shelf" : status,
  };
}

export function copyKindPatch(copyKind: CopyKind, status: PlayStatus): Partial<Game> {
  if (copyKind === "digital") return digitalCopyPatch(status);
  return { copyKind };
}

export function isPlaying(game: Pick<Game, "status">) {
  return game.status === "in_progress" || game.status === "completed_still_playing";
}

export function isCompleted(game: Pick<Game, "status">) {
  return game.status === "completed" || game.status === "completed_still_playing";
}

export function playLane(status: PlayStatus): PlayLane {
  if (status === "in_progress" || status === "completed_still_playing") return "playing";
  if (status === "completed") return "done";
  return "shelf";
}

export function statusForLane(lane: PlayLane, current: PlayStatus): PlayStatus {
  if (lane === "playing") return "in_progress";
  if (lane === "done") return "completed";
  if (current === "sold" || current === "for_sale" || current === "lent_out") return "on_shelf";
  return "on_shelf";
}

export function playLabel(status: PlayStatus) {
  if (status === "sold") return "Sold";
  if (status === "in_progress" || status === "completed_still_playing") return "Playing";
  if (status === "completed") return "Done";
  return "On the shelf";
}

export function shelfStatus(status: Game["status"]): "on_shelf" | "for_sale" | "sold" {
  if (status === "for_sale" || status === "sold") return status;
  return "on_shelf";
}

export function snapRating(value: number) {
  return Math.min(5, Math.max(0, Math.round(value * 2) / 2));
}
