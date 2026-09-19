import { money } from "./format";
import { isForSale } from "./photos";
import { CONDITION_LABELS, type Game, type Profile } from "./types";

export function listingText(
  game: Game,
  profile: Pick<Profile, "city" | "currency">,
) {
  const lines = [
    `Item : ${game.title}`,
    "Platform : PS5",
    `Condition : ${CONDITION_LABELS[game.condition]}`,
    game.askingPrice != null ? `Price : ${money(game.askingPrice, profile.currency)}` : null,
    profile.city.trim() ? `Location : ${profile.city.trim()}` : null,
  ].filter(Boolean);
  const note = game.listingNote?.trim();
  return note ? `${lines.join("\n")}\n\n${note}` : lines.join("\n");
}

export function isPublicGame(
  game: Game,
  profile: Pick<Profile, "shareCollection">,
) {
  if (game.status === "sold") return false;
  if (game.hidden) return false;
  if (profile.shareCollection === false && !isForSale(game)) return false;
  return true;
}
