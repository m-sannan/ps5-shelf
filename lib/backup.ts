import type { Condition, CopyKind, CurrencyCode, Game, Library, Loan, PlayStatus, Profile } from "./types";
import { CONDITIONS, COPY_KINDS, CURRENCIES, PLAY_STATUSES } from "./types";
import { conditionFields, conditionPhotos, snapRating } from "./photos";

export const BACKUP_FORMAT = "crate-shelf-backup";
export const BACKUP_VERSION = 1;

export type ShelfBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  profile: Profile;
  games: Game[];
};

const CURRENCY_CODES = new Set(CURRENCIES.map((item) => item.code));
const STATUS_SET = new Set<string>(PLAY_STATUSES);
const CONDITION_SET = new Set<string>(CONDITIONS);

export function backupFilename(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  return `crate-shelf-backup-${stamp}.json`;
}

export function buildBackup(library: Library, exportedAt = new Date().toISOString()): ShelfBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    profile: structuredClone(library.profile),
    games: structuredClone(library.games),
  };
}

export function stringifyBackup(backup: ShelfBackup) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown) {
  return value === true;
}

function parseLoan(raw: unknown, index: number): Loan {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Loan ${index + 1} is invalid.`);
  }
  const row = raw as Record<string, unknown>;
  return {
    id: asString(row.id, `loan-${index + 1}`),
    person: asString(row.person),
    date: asString(row.date),
    amount: asNumber(row.amount),
    note: asString(row.note),
    returned: asBool(row.returned),
  };
}

function parseGame(raw: unknown, index: number): Game {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Game ${index + 1} is invalid.`);
  }
  const row = raw as Record<string, unknown>;
  const status = asString(row.status, "on_shelf");
  const condition = asString(row.condition, "good");
  if (!STATUS_SET.has(status)) {
    throw new Error(`Game ${index + 1} has an unknown status.`);
  }
  if (!CONDITION_SET.has(condition)) {
    throw new Error(`Game ${index + 1} has an unknown condition.`);
  }
  const loans = Array.isArray(row.loans) ? row.loans.map(parseLoan) : [];
  const coverImage = typeof row.coverImage === "string" ? row.coverImage : null;
  const discPhoto = typeof row.discPhoto === "string" ? row.discPhoto : null;
  const casePhoto = typeof row.casePhoto === "string" ? row.casePhoto : null;
  const listedRaw = Array.isArray(row.photos)
    ? row.photos.filter((item): item is string => typeof item === "string")
    : [];
  const extras = listedRaw.filter((src) => src !== coverImage && src !== discPhoto);
  const photos = conditionFields(
    extras.length ? extras : casePhoto && casePhoto !== discPhoto ? [casePhoto] : [],
  );
  const copyKind: CopyKind =
    row.copyKind === "digital" || row.format === "digital" ? "digital" : "disc";
  if (COPY_KINDS.indexOf(copyKind) < 0) {
    /* keep disc */
  }
  return {
    id: asString(row.id, `game-${index + 1}`),
    title: asString(row.title, "Untitled"),
    platform: "PS5",
    purchasePrice: asNumber(row.purchasePrice),
    purchaseDate: asString(row.purchaseDate),
    askingPrice: row.askingPrice === null ? null : asNumber(row.askingPrice, 0),
    soldPrice: row.soldPrice === null || row.soldPrice === undefined ? null : asNumber(row.soldPrice),
    status: status as PlayStatus,
    condition: condition as Condition,
    notes: asString(row.notes),
    coverColor: asString(row.coverColor, "#2563eb"),
    coverImage,
    discPhoto,
    casePhoto,
    copyKind,
    rating:
      typeof row.rating === "number" && Number.isFinite(row.rating)
        ? snapRating(row.rating) || null
        : null,
    borrowedFrom: asString(row.borrowedFrom).trim(),
    listingNote: asString(row.listingNote),
    review: asString(row.review),
    loggedAt: asString(row.loggedAt),
    hidden: row.hidden === true,
    ...photos,
    loans,
  };
}

function parseProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Backup is missing a profile.");
  }
  const row = raw as Record<string, unknown>;
  const currency = asString(row.currency, "INR") as CurrencyCode;
  if (!CURRENCY_CODES.has(currency)) {
    throw new Error("Backup uses an unknown currency.");
  }
  return {
    name: asString(row.name, "Shelf"),
    contact: asString(row.contact),
    city: asString(row.city),
    note: asString(row.note),
    currency,
    sharePaidPrice: row.sharePaidPrice === true,
    sharePublic: row.sharePublic !== false,
    shareCollection: row.shareCollection !== false,
    handle: asString(row.handle).trim().toLowerCase(),
    favoriteIds: Array.isArray(row.favoriteIds)
      ? row.favoriteIds.filter((id): id is string => typeof id === "string").slice(0, 4)
      : [],
  };
}

export function parseBackup(raw: string): ShelfBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("That backup file is empty.");
  }
  const row = parsed as Record<string, unknown>;
  if (row.format !== BACKUP_FORMAT) {
    throw new Error("That file is not a Crate shelf backup.");
  }
  if (row.version !== BACKUP_VERSION) {
    throw new Error("This backup was made with a newer Crate than this app.");
  }
  if (!Array.isArray(row.games)) {
    throw new Error("Backup is missing the games list.");
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: asString(row.exportedAt, new Date().toISOString()),
    profile: parseProfile(row.profile),
    games: row.games.map(parseGame),
  };
}

export function libraryFromBackup(backup: ShelfBackup): Library {
  return {
    profile: structuredClone(backup.profile),
    games: structuredClone(backup.games),
  };
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image data"));
    reader.readAsDataURL(blob);
  });
}

async function compressDataUrl(dataUrl: string, maxEdge = 900, quality = 0.82) {
  if (typeof window === "undefined" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }
  if (dataUrl.length < 180_000) return dataUrl;
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("bad image"));
    });
    image.src = dataUrl;
    await loaded;
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

async function embedImage(url: string | null) {
  if (!url) return null;
  if (url.startsWith("data:")) return await compressDataUrl(url);
  if (typeof window === "undefined") return url;
  try {
    const src =
      url.startsWith("/") || url.startsWith("blob:")
        ? url
        : `/api/art?url=${encodeURIComponent(url)}`;
    const response = await fetch(src);
    if (!response.ok) return url;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return url;
    const dataUrl = await blobToDataUrl(blob);
    return await compressDataUrl(dataUrl);
  } catch {
    return url;
  }
}

export async function buildCompleteBackup(library: Library): Promise<ShelfBackup> {
  const games: Game[] = [];
  for (const game of library.games) {
    games.push({
      ...structuredClone(game),
      coverImage: await embedImage(game.coverImage),
      discPhoto: await embedImage(game.discPhoto),
      casePhoto: null,
      ...conditionFields(
        (await Promise.all(conditionPhotos(game).map((src) => embedImage(src)))).filter(
          (src): src is string => Boolean(src),
        ),
      ),
    });
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: structuredClone(library.profile),
    games,
  };
}
