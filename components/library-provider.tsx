"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { uid } from "@/lib/format";
import {
  getLibrarySnapshot,
  getServerLibrarySnapshot,
  resetLibrary,
  subscribeLibrary,
  writeLibrary,
} from "@/lib/storage";
import type { Game, Library, Loan, Profile } from "@/lib/types";

type LibraryContextValue = {
  library: Library;
  ready: boolean;
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
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const library = useSyncExternalStore(
    subscribeLibrary,
    getLibrarySnapshot,
    getServerLibrarySnapshot,
  );

  const updateProfile = useCallback((profile: Profile) => {
    writeLibrary({ ...getLibrarySnapshot(), profile });
  }, []);

  const addGame = useCallback(
    (game: Omit<Game, "id" | "loans" | "platform"> & { loans?: Loan[] }) => {
      const current = getLibrarySnapshot();
      const next: Game = {
        ...game,
        id: uid("game"),
        platform: "PS5",
        loans: game.loans ?? [],
      };
      writeLibrary({ ...current, games: [next, ...current.games] });
    },
    [],
  );

  const updateGame = useCallback((id: string, patch: Partial<Game>) => {
    const current = getLibrarySnapshot();
    writeLibrary({
      ...current,
      games: current.games.map((game) =>
        game.id === id ? { ...game, ...patch } : game,
      ),
    });
  }, []);

  const deleteGame = useCallback((id: string) => {
    const current = getLibrarySnapshot();
    writeLibrary({
      ...current,
      games: current.games.filter((game) => game.id !== id),
    });
  }, []);

  const addLoan = useCallback((gameId: string, loan: Omit<Loan, "id">) => {
    const current = getLibrarySnapshot();
    writeLibrary({
      ...current,
      games: current.games.map((game) =>
        game.id === gameId
          ? { ...game, loans: [{ ...loan, id: uid("loan") }, ...game.loans] }
          : game,
      ),
    });
  }, []);

  const updateLoan = useCallback(
    (gameId: string, loanId: string, patch: Partial<Loan>) => {
      const current = getLibrarySnapshot();
      writeLibrary({
        ...current,
        games: current.games.map((game) =>
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
    [],
  );

  const removeLoan = useCallback((gameId: string, loanId: string) => {
    const current = getLibrarySnapshot();
    writeLibrary({
      ...current,
      games: current.games.map((game) =>
        game.id === gameId
          ? { ...game, loans: game.loans.filter((loan) => loan.id !== loanId) }
          : game,
      ),
    });
  }, []);

  const restoreDemo = useCallback(() => {
    resetLibrary();
  }, []);

  const value = useMemo(
    () => ({
      library,
      ready: true,
      updateProfile,
      addGame,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
      restoreDemo,
    }),
    [
      library,
      updateProfile,
      addGame,
      updateGame,
      deleteGame,
      addLoan,
      updateLoan,
      removeLoan,
      restoreDemo,
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
