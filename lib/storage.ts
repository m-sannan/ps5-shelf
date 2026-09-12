import { SEED_LIBRARY } from "./seed";
import { uid } from "./format";
import type { Account, AppStore, Library } from "./types";

const KEY = "crate-library-v2";

let cached: AppStore | null = null;
const listeners = new Set<() => void>();

function demoAccount(): Account {
  return {
    id: "demo-rohan",
    name: "Rohan Mehta",
    pin: null,
    avatarColor: "#3b82f6",
    library: structuredClone(SEED_LIBRARY),
  };
}

export function emptyLibrary(name: string): Library {
  return {
    profile: {
      name,
      contact: "",
      city: "",
      note: "Physical PS5 copies.",
      currency: "INR",
    },
    games: [],
  };
}

function seedStore(): AppStore {
  return {
    accounts: [demoAccount()],
    currentAccountId: null,
  };
}

function readFromDisk(): AppStore {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as AppStore;
    if (!Array.isArray(parsed.accounts)) return seedStore();
    return parsed;
  } catch {
    return seedStore();
  }
}

export function getStoreSnapshot(): AppStore {
  if (typeof window === "undefined") return seedStore();
  if (!cached) cached = readFromDisk();
  return cached;
}

const SERVER_STORE: AppStore = {
  accounts: [
    {
      id: "demo-rohan",
      name: "Rohan Mehta",
      pin: null,
      avatarColor: "#3b82f6",
      library: SEED_LIBRARY,
    },
  ],
  currentAccountId: null,
};

export function getServerStoreSnapshot(): AppStore {
  return SERVER_STORE;
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function writeStore(store: AppStore) {
  cached = store;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  }
  listeners.forEach((listener) => listener());
}

export function currentAccount(store: AppStore): Account | null {
  return store.accounts.find((account) => account.id === store.currentAccountId) ?? null;
}

export function writeLibrary(library: Library) {
  const store = getStoreSnapshot();
  if (!store.currentAccountId) return;
  writeStore({
    ...store,
    accounts: store.accounts.map((account) =>
      account.id === store.currentAccountId ? { ...account, library } : account,
    ),
  });
}

export function signIn(accountId: string) {
  const store = getStoreSnapshot();
  writeStore({ ...store, currentAccountId: accountId });
}

export function signOut() {
  const store = getStoreSnapshot();
  writeStore({ ...store, currentAccountId: null });
}

export function createAccount(input: {
  name: string;
  pin: string | null;
  useSample: boolean;
}) {
  const store = getStoreSnapshot();
  const name = input.name.trim();
  const account: Account = {
    id: uid("user"),
    name,
    pin: input.pin?.trim() ? input.pin.trim() : null,
    avatarColor: ["#3b82f6", "#22d3ee", "#a855f7", "#f43f5e"][
      store.accounts.length % 4
    ],
    library: input.useSample
      ? {
          ...structuredClone(SEED_LIBRARY),
          profile: {
            ...structuredClone(SEED_LIBRARY.profile),
            name,
          },
        }
      : emptyLibrary(name),
  };
  writeStore({
    accounts: [...store.accounts, account],
    currentAccountId: account.id,
  });
  return account;
}

export function resetLibrary(): Library {
  const next = structuredClone(SEED_LIBRARY);
  const store = getStoreSnapshot();
  const account = currentAccount(store);
  if (account) {
    next.profile = { ...next.profile, name: account.name, currency: account.library.profile.currency };
  }
  writeLibrary(next);
  return next;
}
