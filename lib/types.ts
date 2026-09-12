export const PLAY_STATUSES = [
  "on_shelf",
  "in_progress",
  "completed",
  "completed_still_playing",
  "lent_out",
  "for_sale",
  "sold",
] as const;

export type PlayStatus = (typeof PLAY_STATUSES)[number];

export const CONDITIONS = ["mint", "near_mint", "good", "fair"] as const;
export type Condition = (typeof CONDITIONS)[number];

export type Loan = {
  id: string;
  person: string;
  date: string;
  amount: number;
  note: string;
  returned: boolean;
};

export type Game = {
  id: string;
  title: string;
  platform: "PS5";
  purchasePrice: number;
  purchaseDate: string;
  askingPrice: number | null;
  soldPrice: number | null;
  status: PlayStatus;
  condition: Condition;
  notes: string;
  coverColor: string;
  coverImage: string | null;
  discPhoto: string | null;
  loans: Loan[];
};

export type Profile = {
  name: string;
  contact: string;
  city: string;
  note: string;
};

export type Library = {
  profile: Profile;
  games: Game[];
};

export const STATUS_LABELS: Record<PlayStatus, string> = {
  on_shelf: "On the shelf",
  in_progress: "In progress",
  completed: "Completed",
  completed_still_playing: "Completed, still playing",
  lent_out: "Lent out",
  for_sale: "For sale",
  sold: "Sold",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  mint: "Mint",
  near_mint: "Near mint",
  good: "Good",
  fair: "Fair",
};
