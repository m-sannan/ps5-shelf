import { SEED_LIBRARY } from "./seed";
import { uid } from "./format";
import type { CloudSession } from "./cloud/types";
import { toPublicLibrary } from "./public-view";
import type { Account, AppStore, Library } from "./types";

const LEGACY_KEY = "crate-library-v4";
const KEY = "crate-shelf-v5";

export type ShelfState = {
  name: string;
  pin: string | null;
  avatarColor: string;
  unlocked: boolean;
  library: Library;
  cloud: CloudSession | null;
};

let cached: ShelfState | null = null;
const listeners = new Set<() => void>();

function demoLibrary(): Library {
  return structuredClone(SEED_LIBRARY);
}

export function emptyLibrary(name: string): Library {
  return {
    profile: {
      name,
      contact: "",
      city: "",
      note: "Physical PS5 copies. Local pickup.",
      currency: "INR",
      sharePublic: true,
      shareCollection: true,
    },
    games: [],
  };
}

function lockedState(): ShelfState {
  return {
    name: "",
    pin: null,
    avatarColor: "#3b82f6",
    unlocked: false,
    library: emptyLibrary(""),
    cloud: null,
  };
}

const SERVER_STATE: ShelfState = lockedState();

function avatarFor(name: string) {
  const colors = ["#3b82f6", "#22d3ee", "#a855f7", "#f43f5e"];
  const index = Math.abs([...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0));
  return colors[index % colors.length];
}

export type LegacyAccount = Account;

export function readLegacyAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppStore;
    if (!Array.isArray(parsed.accounts)) return [];
    return parsed.accounts;
  } catch {
    return [];
  }
}

function readFromDisk(): ShelfState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return lockedState();
    const parsed = JSON.parse(raw) as ShelfState;
    if (!parsed || typeof parsed !== "object") return lockedState();
    return {
      name: parsed.name ?? parsed.library?.profile?.name ?? "",
      pin: parsed.pin ?? null,
      avatarColor: parsed.avatarColor ?? "#3b82f6",
      unlocked: Boolean(parsed.unlocked && (parsed.cloud || parsed.library?.games)),
      library: parsed.library ?? emptyLibrary(parsed.name ?? ""),
      cloud: parsed.cloud ?? null,
    };
  } catch {
    return lockedState();
  }
}

export function getStoreSnapshot(): ShelfState {
  if (typeof window === "undefined") return SERVER_STATE;
  if (!cached) cached = readFromDisk();
  return cached;
}

export function getServerStoreSnapshot(): ShelfState {
  return SERVER_STATE;
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function writeState(state: ShelfState) {
  cached = state;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((listener) => listener());
}

export function writeLibrary(library: Library) {
  const state = getStoreSnapshot();
  if (!state.unlocked) return;
  writeState({ ...state, library, name: library.profile.name || state.name });
}

export function currentLibrary(state: ShelfState): Library {
  return state.library;
}

export function lockShelf() {
  const state = getStoreSnapshot();
  writeState({ ...state, unlocked: false });
}

export function unlockShelf() {
  const state = getStoreSnapshot();
  if (!state.cloud && !state.library.profile.name && state.library.games.length === 0) {
    return;
  }
  writeState({ ...state, unlocked: true });
}

export function hasSavedShelf(state: ShelfState = getStoreSnapshot()) {
  return Boolean(state.cloud || state.library.games.length > 0 || state.name);
}

export function openShelf(input: {
  name: string;
  library: Library;
  cloud: CloudSession | null;
  pin?: string | null;
}) {
  const name = input.name.trim() || input.library.profile.name || "Shelf";
  writeState({
    name,
    pin: input.pin ?? getStoreSnapshot().pin,
    avatarColor: avatarFor(name),
    unlocked: true,
    library: {
      ...input.library,
      profile: { ...input.library.profile, name: input.library.profile.name || name },
    },
    cloud: input.cloud,
  });
}

export function setCloudSession(cloud: CloudSession | null) {
  const state = getStoreSnapshot();
  writeState({ ...state, cloud });
}

export function setShelfPin(pin: string | null) {
  const state = getStoreSnapshot();
  writeState({ ...state, pin: pin?.trim() ? pin.trim() : null });
}

export function signIn(_accountId?: string) {
  unlockShelf();
}

export function signOut() {
  lockShelf();
}

export function createAccount(input: {
  name: string;
  pin: string | null;
  useSample: boolean;
}) {
  const name = input.name.trim();
  openShelf({
    name,
    pin: input.pin,
    cloud: null,
    library: input.useSample
      ? {
          ...demoLibrary(),
          profile: { ...demoLibrary().profile, name },
        }
      : emptyLibrary(name),
  });
}

export function resetLibrary(): Library {
  const state = getStoreSnapshot();
  const next = demoLibrary();
  next.profile = {
    ...next.profile,
    name: state.name || next.profile.name,
    currency: state.library.profile.currency,
  };
  writeLibrary(next);
  return next;
}

export function asAccount(state: ShelfState): Account | null {
  if (!state.unlocked) return null;
  return {
    id: state.cloud?.shelfId ?? "local",
    name: state.name || state.library.profile.name || "Shelf",
    pin: state.pin,
    avatarColor: state.avatarColor,
    library: state.library,
  };
}

export function uidGame() {
  return uid("game");
}

/** Owner-device fallback for a public link before the cloud copy is stored. */
export function localPublicShelf(publicId: string) {
  if (typeof window === "undefined") return null;
  try {
    const state = getStoreSnapshot();
    if (state.cloud?.publicId !== publicId || !state.library) return null;
    return toPublicLibrary(state.library);
  } catch {
    return null;
  }
}
