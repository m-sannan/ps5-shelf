"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  createCloudShelf,
  generateDeviceSecret,
  joinDevicePair,
  pullCloudShelf,
  pushCloudShelf,
  startDevicePair,
  statusOf,
} from "@/lib/cloud/client";
import type { CloudSession } from "@/lib/cloud/types";
import { uid } from "@/lib/format";
import {
  asAccount,
  createAccount,
  getServerStoreSnapshot,
  getStoreSnapshot,
  hasSavedShelf,
  lockShelf,
  openShelf,
  readLegacyAccounts,
  resetLibrary,
  setCloudSession,
  setShelfPin,
  subscribeStore,
  unlockShelf,
  writeLibrary,
  writeState,
} from "@/lib/storage";
import type { Account, Game, Library, Loan, Profile } from "@/lib/types";

const EMPTY: Library = {
  profile: {
    name: "",
    contact: "",
    city: "",
    note: "",
    currency: "INR",
  },
  games: [],
};

type LibraryContextValue = {
  library: Library;
  account: Account | null;
  accounts: Account[];
  ready: boolean;
  signedIn: boolean;
  cloud: CloudSession | null;
  syncing: boolean;
  syncError: string;
  updateProfile: (profile: Profile) => void;
  addGame: (
    game: Omit<Game, "id" | "loans" | "platform"> & { loans?: Loan[] },
  ) => void;
  addFromPublic: (game: Game) => "added" | "exists" | "no-shelf";
  updateGame: (id: string, patch: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  addLoan: (gameId: string, loan: Omit<Loan, "id">) => void;
  updateLoan: (gameId: string, loanId: string, patch: Partial<Loan>) => void;
  removeLoan: (gameId: string, loanId: string) => void;
  restoreDemo: () => void;
  signIn: (accountId: string) => void;
  signOut: () => void;
  createAccount: (input: {
    name: string;
    pin: string | null;
    useSample: boolean;
  }) => void;
  createShelf: (input: {
    name: string;
    pin?: string | null;
    library?: Library;
  }) => Promise<void>;
  joinShelf: (code: string) => Promise<void>;
  importLegacy: (account: Account) => Promise<void>;
  restoreLibrary: (library: Library, mode: "replace" | "copy") => Promise<void>;
  requestPairCode: () => Promise<{ code: string; expiresIn: number }>;
  setPin: (pin: string | null) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const store = useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    getServerStoreSnapshot,
  );
  const account = asAccount(store);
  const library = account?.library ?? EMPTY;
  const syncingRef = useRef(false);
  const pushTimer = useRef<number | null>(null);
  const syncingState = useSyncExternalStore(
    (listener) => {
      const on = () => listener();
      window.addEventListener("crate-sync", on);
      return () => window.removeEventListener("crate-sync", on);
    },
    () => syncingRef.current,
    () => false,
  );
  const errorRef = useRef("");
  const errorState = useSyncExternalStore(
    (listener) => {
      const on = () => listener();
      window.addEventListener("crate-sync-error", on);
      return () => window.removeEventListener("crate-sync-error", on);
    },
    () => errorRef.current,
    () => "",
  );

  const setSyncing = useCallback((value: boolean) => {
    syncingRef.current = value;
    window.dispatchEvent(new Event("crate-sync"));
  }, []);

  const setError = useCallback((value: string) => {
    errorRef.current = value;
    window.dispatchEvent(new Event("crate-sync-error"));
  }, []);

  const persist = useCallback((next: Library) => {
    writeLibrary(next);
  }, []);

  const pushNow = useCallback(async (nextLibrary: Library, session: CloudSession) => {
    const payload = await pushCloudShelf({
      deviceSecret: session.deviceSecret,
      library: nextLibrary,
    });
    setCloudSession({
      ...session,
      revision: payload.revision,
      publicId: payload.publicId,
      shelfId: payload.shelfId,
    });
  }, []);

  const schedulePush = useCallback(
    (next: Library) => {
      persist(next);
      const session = getStoreSnapshot().cloud;
      if (!session) return;
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => {
        pushTimer.current = null;
        setSyncing(true);
        pushNow(next, session)
          .then(() => setError(""))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Could not sync.";
            setError(message);
            if (message.includes("handle is already taken")) {
              const current = getStoreSnapshot();
              if (current.library.profile.handle) {
                writeLibrary({
                  ...current.library,
                  profile: { ...current.library.profile, handle: "" },
                });
              }
            }
          })
          .finally(() => setSyncing(false));
      }, 700);
    },
    [persist, pushNow, setError, setSyncing],
  );

  useEffect(() => {
    return () => {
      if (!pushTimer.current) return;
      window.clearTimeout(pushTimer.current);
      pushTimer.current = null;
      const state = getStoreSnapshot();
      if (state.cloud) void pushNow(state.library, state.cloud);
    };
  }, [pushNow]);

  const updateProfile = useCallback(
    (profile: Profile) => schedulePush({ ...library, profile }),
    [library, schedulePush],
  );

  const addGame = useCallback(
    (game: Omit<Game, "id" | "loans" | "platform"> & { loans?: Loan[] }) => {
      schedulePush({
        ...library,
        games: [
          {
            ...game,
            id: uid("game"),
            platform: "PS5",
            loans: game.loans ?? [],
            copyKind: game.copyKind ?? "disc",
            rating: game.rating ?? null,
            borrowedFrom: game.borrowedFrom?.trim() ?? "",
            listingNote: game.listingNote ?? "",
            review: game.review ?? "",
            loggedAt: game.loggedAt ?? "",
            hidden: game.hidden === true,
            photos: game.photos ?? [],
            coverImage: game.coverImage ?? null,
            casePhoto: game.casePhoto ?? null,
            discPhoto: game.discPhoto ?? null,
          },
          ...library.games,
        ],
      });
    },
    [library, schedulePush],
  );

  const addFromPublic = useCallback(
    (source: Game): "added" | "exists" | "no-shelf" => {
      let state = getStoreSnapshot();
      if (!state.unlocked && hasSavedShelf(state)) {
        unlockShelf();
        state = getStoreSnapshot();
      }
      if (!state.unlocked) return "no-shelf";
      const title = source.title.trim().toLowerCase();
      if (state.library.games.some((game) => game.title.trim().toLowerCase() === title)) {
        return "exists";
      }
      const digital = source.copyKind === "digital";
      schedulePush({
        ...state.library,
        games: [
          {
            id: uid("game"),
            title: source.title,
            platform: "PS5",
            purchasePrice: 0,
            purchaseDate: "",
            askingPrice: null,
            soldPrice: null,
            status: "on_shelf",
            condition: "good",
            notes: "",
            listingNote: "",
            review: "",
            loggedAt: "",
            hidden: false,
            coverColor: source.coverColor || "#3b82f6",
            coverImage: source.coverImage ?? null,
            discPhoto: null,
            casePhoto: null,
            photos: [],
            copyKind: digital ? "digital" : "disc",
            rating: null,
            borrowedFrom: "",
            loans: [],
          },
          ...state.library.games,
        ],
      });
      return "added";
    },
    [schedulePush],
  );

  const updateGame = useCallback(
    (id: string, patch: Partial<Game>) => {
      schedulePush({
        ...library,
        games: library.games.map((game) =>
          game.id === id ? { ...game, ...patch } : game,
        ),
      });
    },
    [library, schedulePush],
  );

  const deleteGame = useCallback(
    (id: string) => {
      schedulePush({
        ...library,
        profile: {
          ...library.profile,
          favoriteIds: (library.profile.favoriteIds ?? []).filter((fav) => fav !== id),
        },
        games: library.games.filter((game) => game.id !== id),
      });
    },
    [library, schedulePush],
  );

  const addLoan = useCallback(
    (gameId: string, loan: Omit<Loan, "id">) => {
      schedulePush({
        ...library,
        games: library.games.map((game) =>
          gameId === game.id
            ? { ...game, loans: [{ ...loan, id: uid("loan") }, ...game.loans] }
            : game,
        ),
      });
    },
    [library, schedulePush],
  );

  const updateLoan = useCallback(
    (gameId: string, loanId: string, patch: Partial<Loan>) => {
      schedulePush({
        ...library,
        games: library.games.map((game) =>
          game.id === gameId
            ? {
                ...game,
                loans: game.loans.map((loan) =>
                  loan.id === loanId ? { ...loan, ...patch } : loan,
                ),
              }
            : game,
        ),
      });
    },
    [library, schedulePush],
  );

  const removeLoan = useCallback(
    (gameId: string, loanId: string) => {
      schedulePush({
        ...library,
        games: library.games.map((game) =>
          game.id === gameId
            ? { ...game, loans: game.loans.filter((loan) => loan.id !== loanId) }
            : game,
        ),
      });
    },
    [library, schedulePush],
  );

  const refreshFromCloud = useCallback(async () => {
    const session = getStoreSnapshot().cloud;
    if (!session) return;
    setSyncing(true);
    try {
      let payload;
      try {
        payload = await pullCloudShelf(session.deviceSecret);
      } catch (error) {
        const status = statusOf(error);
        if (status !== 401 && status !== 404) throw error;
        const current = getStoreSnapshot();
        try {
          const created = await createCloudShelf({
            deviceSecret: session.deviceSecret,
            library: current.library,
            publicId: session.publicId,
          });
          payload = {
            shelfId: created.session.shelfId,
            publicId: created.session.publicId,
            revision: created.session.revision,
            library: created.library,
          };
        } catch (createError) {
          if (statusOf(createError) === 409) {
            payload = await pullCloudShelf(session.deviceSecret);
          } else {
            throw createError;
          }
        }
      }
      const current = getStoreSnapshot();
      writeState({
        ...current,
        unlocked: true,
        library: payload.library,
        name: payload.library.profile.name || current.name,
        cloud: {
          ...session,
          shelfId: payload.shelfId,
          publicId: payload.publicId,
          revision: payload.revision,
        },
      });
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not refresh the shelf.");
    } finally {
      setSyncing(false);
    }
  }, [setError, setSyncing]);

  useEffect(() => {
    if (!store.unlocked || !store.cloud) return;
    void refreshFromCloud();
    function onWake() {
      if (document.visibilityState === "visible") void refreshFromCloud();
    }
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    document.addEventListener("visibilitychange", onWake);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshFromCloud();
    }, 30_000);
    return () => {
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      document.removeEventListener("visibilitychange", onWake);
      window.clearInterval(timer);
    };
  }, [refreshFromCloud, store.cloud?.deviceSecret, store.unlocked]);

  const createShelf = useCallback(
    async (input: { name: string; pin?: string | null; library?: Library }) => {
      const name = input.name.trim() || "My shelf";
      const librarySeed = input.library
        ? {
            ...input.library,
            profile: { ...input.library.profile, name: input.library.profile.name || name },
          }
        : {
            profile: {
              name,
              contact: "",
              city: "",
              note: "Physical PS5 copies. Local pickup.",
              currency: "INR" as const,
              sharePublic: true,
              shareCollection: true,
              handle: "",
              favoriteIds: [],
            },
            games: [],
          };
      const deviceSecret = generateDeviceSecret();
      try {
        const { session, library: remote } = await createCloudShelf({
          deviceSecret,
          library: librarySeed,
        });
        openShelf({ name, library: remote, cloud: session, pin: input.pin ?? null });
        setError("");
      } catch (error) {
        openShelf({
          name,
          library: librarySeed,
          cloud: null,
          pin: input.pin ?? null,
        });
        setError(
          error instanceof Error
            ? `${error.message} This device still has a local copy — download a JSON backup.`
            : "Cloud is unavailable. This device still has a local copy.",
        );
      }
    },
    [setError],
  );

  const joinShelf = useCallback(
    async (code: string) => {
      const deviceSecret = generateDeviceSecret();
      const { session, library: remote } = await joinDevicePair({
        code: code.replace(/\s/g, ""),
        deviceSecret,
      });
      openShelf({
        name: remote.profile.name || "Shelf",
        library: remote,
        cloud: session,
      });
      setError("");
    },
    [setError],
  );

  const importLegacy = useCallback(
    async (legacy: Account) => {
      await createShelf({
        name: legacy.name,
        pin: legacy.pin,
        library: legacy.library,
      });
    },
    [createShelf],
  );

  const restoreLibrary = useCallback(
    async (next: Library, mode: "replace" | "copy") => {
      if (mode === "copy" || !store.cloud) {
        await createShelf({
          name: next.profile.name || "Restored shelf",
          library: next,
        });
        return;
      }
      schedulePush(next);
    },
    [createShelf, schedulePush, store.cloud],
  );

  const requestPairCode = useCallback(async () => {
    const session = getStoreSnapshot().cloud;
    if (!session) throw new Error("Cloud pairing needs an online shelf.");
    return await startDevicePair(session.deviceSecret);
  }, []);

  const value = useMemo(
    () => ({
      library,
      account,
      accounts: account ? [account] : [],
      ready: true,
      signedIn: Boolean(account),
      cloud: store.cloud,
      syncing: syncingState,
      syncError: errorState,
      updateProfile,
      addGame,
      addFromPublic,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
      restoreDemo: () => {
        const next = resetLibrary();
        const session = getStoreSnapshot().cloud;
        if (session) {
          void pushNow(next, session).catch((error: unknown) => {
            setError(error instanceof Error ? error.message : "Could not sync.");
          });
        }
      },
      signIn: () => unlockShelf(),
      signOut: lockShelf,
      createAccount,
      createShelf,
      joinShelf,
      importLegacy,
      restoreLibrary,
      requestPairCode,
      setPin: setShelfPin,
    }),
    [
      library,
      account,
      store.cloud,
      syncingState,
      errorState,
      updateProfile,
      addGame,
      addFromPublic,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
      pushNow,
      createShelf,
      joinShelf,
      importLegacy,
      restoreLibrary,
      requestPairCode,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

export function useLegacyAccounts() {
  if (typeof window === "undefined") return [];
  return readLegacyAccounts();
}

export { hasSavedShelf };
