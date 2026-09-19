"use client";

import { useMemo } from "react";
import { useLibrary } from "@/components/library-provider";
import { money, shortDate } from "@/lib/format";
import { libraryStats } from "@/lib/stats";

type Tx = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  kind: "out" | "in";
};

export function Ledger() {
  const { library, ready, restoreDemo } = useLibrary();
  const currency = library.profile.currency;
  const stats = libraryStats(library);

  const txs = useMemo(() => {
    const rows: Tx[] = [];
    for (const game of library.games) {
      if (game.purchasePrice > 0) {
        rows.push({
          id: `buy-${game.id}`,
          title: game.title,
          subtitle: game.purchaseDate ? `Bought · ${shortDate(game.purchaseDate)}` : "Bought",
          amount: -game.purchasePrice,
          kind: "out",
        });
      }
      for (const loan of game.loans) {
        if (loan.amount <= 0) continue;
        rows.push({
          id: loan.id,
          title: loan.person,
          subtitle: `${game.title} · ${shortDate(loan.date)}`,
          amount: loan.amount,
          kind: "in",
        });
      }
      if (game.soldPrice) {
        rows.push({
          id: `sold-${game.id}`,
          title: `Sold ${game.title}`,
          subtitle: "Sale",
          amount: game.soldPrice,
          kind: "in",
        });
      }
    }
    return rows.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [library.games]);

  if (!ready) {
    return <p className="text-sm text-white/50">Adding up the receipts…</p>;
  }

  const recovered = stats.recovered;
  const remaining = Math.max(0, stats.net);
  const total = Math.max(stats.spent, 1);
  const recPct = (recovered / total) * 100;
  const remPct = (remaining / total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
            Money
          </p>
          <h1 className="mt-1 text-2xl font-medium">
            {library.profile.name || "Your shelf"}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Receipts stay here. The seller card is on Share, with a Friends / Me preview.
          </p>
        </div>
        <button
          type="button"
          onClick={restoreDemo}
          className="text-sm text-white/45 hover:text-white"
        >
          Reset demo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Still on the shelf" value={money(stats.net, currency)} />
        <Stat label="Spent" value={money(stats.spent, currency)} hint={`${stats.copies} copies`} />
        <Stat
          label="Sold"
          value={money(stats.soldIncome, currency)}
          hint={`${stats.sold} copies`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
          <p className="text-sm text-white/50">Breakdown</p>
          <div
            className="relative mx-auto mt-4 size-36 rounded-full"
            style={{
              background: `conic-gradient(#86efac 0 ${recPct}%, #f9a8d4 ${recPct}% ${recPct + remPct}%, #fde68a ${recPct + remPct}% 100%)`,
            }}
          >
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#161616] text-center">
              <p className="text-[10px] uppercase tracking-wide text-white/40">
                Held
              </p>
              <p className="text-sm font-semibold">{money(stats.net, currency)}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <Legend color="#86efac" label="Recovered" value={money(recovered, currency)} />
            <Legend color="#f9a8d4" label="Still held" value={money(remaining, currency)} />
            <Legend
              color="#fde68a"
              label="Sold"
              value={money(stats.soldIncome, currency)}
            />
          </ul>
        </div>

        <div className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
          <div className="flex items-center justify-between">
            <p className="font-medium">Transactions</p>
            <span className="text-xs text-white/40">{txs.length}</span>
          </div>
          <ul className="mt-3 divide-y divide-white/8">
            {txs.length === 0 && (
              <li className="py-6 text-sm text-white/50">No money logged yet.</li>
            )}
            {txs.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{tx.title}</p>
                  <p className="text-xs text-white/40">{tx.subtitle}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    tx.kind === "in" ? "text-emerald-400" : "text-white/85"
                  }`}
                >
                  {tx.kind === "in" ? "+" : ""}
                  {money(tx.amount, currency)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/4 p-4 ring-1 ring-white/8">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/35">{hint}</p> : null}
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 size-2.5 rounded-full" style={{ background: color }} />
      <span>
        <span className="block text-white/45">{label}</span>
        <span className="font-medium">{value}</span>
      </span>
    </li>
  );
}
