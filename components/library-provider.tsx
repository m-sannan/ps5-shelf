"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { uid } from "@/lib/format";
import {
  createAccount,
  currentAccount,
  getServerStoreSnapshot,
  getStoreSnapshot,
  resetLibrary,
  signIn,
  signOut,
  subscribeStore,
  writeLibrary,
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
  updateProfile: (profile: Profile) => void;
  addGame: (
    game: Omit<Game, "id" | "loans" | "platform"> & { loans?: Loan[] },
  ) => void;
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
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const store = useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    getServerStoreSnapshot,
  );
  const account = currentAccount(store);
  const library = account?.library ?? EMPTY;

  const persist = useCallback((next: Library) => {
    writeLibrary(next);
  }, []);

  const updateProfile = useCallback(
    (profile: Profile) => persist({ ...library, profile }),
    [library, persist],
  );

  const addGame = useCallback(
    (game: Omit<Game, "id" | "loans" | "platform"> & { loans?: Loan[] }) => {
      persist({
        ...library,
        games: [
          {
            ...game,
            id: uid("game"),
            platform: "PS5",
            loans: game.loans ?? [],
          },
          ...library.games,
        ],
      });
    },
    [library, persist],
  );

  const updateGame = useCallback(
    (id: string, patch: Partial<Game>) => {
      persist({
        ...library,
        games: library.games.map((game) =>
          game.id === id ? { ...game, ...patch } : game,
        ),
      });
    },
    [library, persist],
  );

  const deleteGame = useCallback(
    (id: string) => {
      persist({
        ...library,
        games: library.games.filter((game) => game.id !== id),
      });
    },
    [library, persist],
  );

  const addLoan = useCallback(
    (gameId: string, loan: Omit<Loan, "id">) => {
      persist({
        ...library,
        games: library.games.map((game) =>
          game.id === gameId
            ? { ...game, loans: [{ ...loan, id: uid("loan") }, ...game.loans] }
            : game,
        ),
      });
    },
    [library, persist],
  );

  const updateLoan = useCallback(
    (gameId: string, loanId: string, patch: Partial<Loan>) => {
      persist({
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
    [library, persist],
  );

  const removeLoan = useCallback(
    (gameId: string, loanId: string) => {
      persist({
        ...library,
        games: library.games.map((game) =>
          game.id === gameId
            ? { ...game, loans: game.loans.filter((loan) => loan.id !== loanId) }
            : game,
        ),
      });
    },
    [library, persist],
  );

  const value = useMemo(
    () => ({
      library,
      account,
      accounts: store.accounts,
      ready: true,
      signedIn: Boolean(account),
      updateProfile,
      addGame,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
      restoreDemo: resetLibrary,
      signIn,
      signOut,
      createAccount,
    }),
    [
      library,
      account,
      store.accounts,
      updateProfile,
      addGame,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
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
