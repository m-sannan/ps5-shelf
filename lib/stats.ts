import type { Game, Library } from "./types";
import { isForSale } from "./photos";

export function loanTotal(game: Game) {
  return game.loans.reduce((sum, loan) => sum + loan.amount, 0);
}

export function libraryStats(library: Library) {
  const owned = library.games.filter((game) => game.status !== "sold");
  const sold = library.games.filter((game) => game.status === "sold");
  const forSale = library.games.filter(isForSale);
  const spent = library.games.reduce((sum, game) => sum + game.purchasePrice, 0);
  const loaned = library.games.reduce((sum, game) => sum + loanTotal(game), 0);
  const soldIncome = sold.reduce((sum, game) => sum + (game.soldPrice ?? 0), 0);
  const asking = forSale.reduce((sum, game) => sum + (game.askingPrice ?? 0), 0);

  return {
    copies: library.games.length,
    owned: owned.length,
    forSale: forSale.length,
    sold: sold.length,
    spent,
    loaned,
    soldIncome,
    asking,
    recovered: loaned + soldIncome,
    net: spent - loaned - soldIncome,
  };
}
