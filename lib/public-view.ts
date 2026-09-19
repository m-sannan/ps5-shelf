import type { Game, Library, Profile } from "./types";

export function toPublicGame(game: Game): Game {
  const digital = game.copyKind === "digital";
  let status = game.status;
  if (status === "lent_out" || status === "sold") status = "on_shelf";
  if (digital && status === "for_sale") status = "on_shelf";
  return {
    ...game,
    status,
    purchasePrice: 0,
    purchaseDate: "",
    soldPrice: null,
    askingPrice: digital ? null : game.askingPrice,
    loans: [],
    notes: "",
    borrowedFrom: "",
  };
}

export function toPublicProfile(profile: Profile): Profile {
  return {
    name: profile.name,
    contact: profile.contact,
    city: profile.city,
    note: profile.note,
    currency: profile.currency,
    sharePaidPrice: false,
  };
}

export function toPublicLibrary(library: Library) {
  return {
    profile: toPublicProfile(library.profile),
    games: library.games.filter((game) => game.status !== "sold").map(toPublicGame),
  };
}
