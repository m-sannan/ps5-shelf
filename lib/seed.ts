import type { Game, Library, Loan } from "./types";

function loan(
  id: string,
  person: string,
  date: string,
  amount: number,
  note: string,
  returned: boolean,
): Loan {
  return { id, person, date, amount, note, returned };
}

function game(
  partial: Omit<Game, "platform" | "askingPrice" | "discPhoto" | "casePhoto"> & {
    askingPrice?: number | null;
  },
): Game {
  return {
    platform: "PS5",
    askingPrice: partial.askingPrice ?? null,
    discPhoto: null,
    casePhoto: null,
    copyKind: "disc" as const,
    rating: null,
    ...partial,
  };
}

export const SEED_LIBRARY: Library = {
  profile: {
    name: "Sannan",
    contact: "",
    city: "",
    note: "Physical copies. Local pickup. Prices in ₹.",
    currency: "INR",
    sharePaidPrice: false,
    sharePublic: true,
    shareCollection: true,
    handle: "",
    favoriteIds: ["tlou1", "ghost-of-tsushima", "miles-morales", "rdr2"],
  },
  games: [
    game({
      id: "miles-morales",
      title: "Marvel's Spider-Man: Miles Morales",
      purchasePrice: 0,
      purchaseDate: "2026-03-18",
      soldPrice: null,
      status: "in_progress",
      condition: "good",
      notes: "Lent to Musa.",
      coverColor: "#d90429",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/a/a3/Spider-Man_Miles_Morales.jpeg",
      rating: 4,
      loans: [
        loan("loan-mm-1", "Musa", "2026-03-18", 0, "Still with Musa", false),
      ],
    }),
    game({
      id: "ghost-of-tsushima",
      title: "Ghost of Tsushima",
      purchasePrice: 0,
      purchaseDate: "2026-03-18",
      soldPrice: null,
      status: "completed",
      condition: "good",
      notes: "Lent to Musa.",
      coverColor: "#1c1917",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/b/b6/Ghost_of_Tsushima.jpg",
      loans: [
        loan("loan-got-1", "Musa", "2026-03-18", 0, "Still with Musa", false),
      ],
    }),
    game({
      id: "tlou2",
      title: "The Last of Us Part II",
      purchasePrice: 0,
      purchaseDate: "2026-07-04",
      soldPrice: null,
      status: "lent_out",
      condition: "good",
      notes: "Lent to Nasheen.",
      coverColor: "#14532d",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/4/4f/TLOU_P2_Box_Art_2.png",
      loans: [
        loan("loan-tlou2-1", "Nasheen", "2026-07-04", 0, "Still with Nasheen", false),
      ],
    }),
    game({
      id: "gta-v",
      title: "Grand Theft Auto V",
      purchasePrice: 1550,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "Bought from Discord.",
      coverColor: "#84cc16",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png",
      loans: [],
    }),
    game({
      id: "tlou1",
      title: "The Last of Us Part I",
      purchasePrice: 650,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "completed",
      condition: "good",
      notes: "Bought from Discord.",
      coverColor: "#a3a3a3",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/8/86/The_Last_of_Us_Part_I_cover.jpg",
      rating: 5,
      review:
        "The last hour wrecked me. Still think about the porch scene every time I see the case on the shelf.",
      loggedAt: "2025-07-04",
      loans: [],
    }),
    game({
      id: "far-cry-5",
      title: "Far Cry 5",
      purchasePrice: 800,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "Bought from Game Zone.",
      coverColor: "#7c3aed",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/0/03/Far_Cry_5_boxshot.jpg",
      loans: [],
    }),
    game({
      id: "watch-dogs-2",
      title: "Watch Dogs 2",
      purchasePrice: 550,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "Bought from Game Zone.",
      coverColor: "#f97316",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/b/b0/Watch_Dogs_2.jpg",
      loans: [],
    }),
    game({
      id: "far-cry-4",
      title: "Far Cry 4",
      purchasePrice: 667,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "PSN Store bundle with Primal and Red Dead Redemption 2 — ₹2,000 total.",
      coverColor: "#eab308",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/6/63/Far_Cry_4_box_art.jpg",
      loans: [],
    }),
    game({
      id: "far-cry-primal",
      title: "Far Cry Primal",
      purchasePrice: 667,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "PSN Store bundle with Far Cry 4 and Red Dead Redemption 2 — ₹2,000 total.",
      coverColor: "#b45309",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/1/18/Far_Cry_Primal_cover_art.jpg",
      loans: [],
    }),
    game({
      id: "rdr2",
      title: "Red Dead Redemption 2",
      purchasePrice: 666,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "PSN Store bundle with Far Cry 4 and Primal — ₹2,000 total.",
      coverColor: "#7f1d1d",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg",
      loans: [],
    }),
    game({
      id: "007-first-light",
      title: "007 First Light",
      purchasePrice: 5650,
      purchaseDate: "2026-01-01",
      soldPrice: 4600,
      status: "sold",
      condition: "near_mint",
      notes: "Bought from Discord. Sold for ₹4,600.",
      coverColor: "#0f172a",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/2/2b/007_First_Light_%282026%29_cover.jpg",
      loans: [],
    }),
    game({
      id: "cyberpunk",
      title: "Cyberpunk 2077",
      purchasePrice: 0,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "in_progress",
      condition: "good",
      notes: "From Raj.",
      coverColor: "#facc15",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg",
      loans: [],
    }),
    game({
      id: "borderlands-3",
      title: "Borderlands 3",
      purchasePrice: 0,
      purchaseDate: "2025-01-01",
      soldPrice: null,
      status: "on_shelf",
      condition: "good",
      notes: "From Raj.",
      coverColor: "#f97316",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/2/21/Borderlands_3_cover_art.jpg",
      loans: [],
    }),
    game({
      id: "hitman-3",
      title: "Hitman 3",
      purchasePrice: 2250,
      purchaseDate: "2025-01-01",
      askingPrice: 1600,
      soldPrice: null,
      status: "for_sale",
      condition: "good",
      notes: "Bought from Discord. Listed for pickup.",
      listingNote: "PS5 disc. Complete in box. Pickup in my city.",
      coverColor: "#dc2626",
      coverImage:
        "https://upload.wikimedia.org/wikipedia/en/4/4b/Hitman_3_Packart.jpg",
      loans: [],
    }),
  ],
};
