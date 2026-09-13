"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLibrary } from "@/components/library-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { money, shortDate } from "@/lib/format";
import { libraryStats } from "@/lib/stats";
import { CURRENCIES, type CurrencyCode } from "@/lib/types";

type Tx = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  kind: "out" | "in";
};

export function Ledger() {
  const { library, ready, updateProfile, restoreDemo } = useLibrary();
  const currency = library.profile.currency;
  const stats = libraryStats(library);

  const txs = useMemo(() => {
    const rows: Tx[] = [];
    for (const game of library.games) {
      if (game.purchasePrice > 0) {
        rows.push({
          id: `buy-${game.id}`,
          title: game.title,
          subtitle: `Bought · ${shortDate(game.purchaseDate)}`,
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
    return <p className="text-sm text-zinc-500">Adding up the receipts…</p>;
  }

  const recovered = stats.recovered;
  const remaining = Math.max(0, stats.net);
  const total = Math.max(stats.spent, 1);
  const recPct = (recovered / total) * 100;
  const remPct = (remaining / total) * 100;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-md space-y-5 pb-10">
      <div>
        <p className="text-sm text-zinc-500">{hello}</p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {library.profile.name || "Your shelf"}
        </h1>
      </div>

      <div className="rounded-3xl bg-zinc-900 px-5 py-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <p className="text-xs tracking-wide text-white/60">Collection wallet</p>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/70">
            {currency}
          </p>
        </div>
        <p className="mt-4 text-xs text-white/50">Still on the shelf</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {money(stats.net, currency)}
        </p>
        <p className="mt-4 text-sm text-white/55">
          Spent {money(stats.spent, currency)} · {stats.copies} copies
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/"
          className="rounded-2xl bg-white py-3 text-center text-sm font-medium text-zinc-800 shadow-sm"
        >
          Library
        </Link>
        <Link
          href="/share"
          className="rounded-2xl bg-white py-3 text-center text-sm font-medium text-zinc-800 shadow-sm"
        >
          Share
        </Link>
        <button
          type="button"
          onClick={restoreDemo}
          className="rounded-2xl bg-white py-3 text-sm font-medium text-zinc-800 shadow-sm"
        >
          Reset demo
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Breakdown</p>
        <div className="mt-4 flex items-center gap-5">
          <div
            className="relative size-36 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(#86efac 0 ${recPct}%, #f9a8d4 ${recPct}% ${recPct + remPct}%, #fde68a ${recPct + remPct}% 100%)`,
            }}
          >
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center">
              <p className="text-xs text-zinc-400">Balance</p>
              <p className="text-sm font-semibold text-zinc-900">
                {money(stats.net, currency)}
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <Legend color="#86efac" label="Recovered" value={money(recovered, currency)} />
            <Legend color="#f9a8d4" label="Still held" value={money(remaining, currency)} />
            <Legend
              color="#fde68a"
              label="Sold copies"
              value={`${stats.sold} · ${money(stats.soldIncome, currency)}`}
            />
          </ul>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-zinc-900">Transactions</p>
          <span className="text-xs text-zinc-400">{txs.length}</span>
        </div>
        <ul className="mt-3 divide-y divide-zinc-100">
          {txs.length === 0 && (
            <li className="py-6 text-sm text-zinc-500">No money logged yet.</li>
          )}
          {txs.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{tx.title}</p>
                <p className="text-xs text-zinc-400">{tx.subtitle}</p>
              </div>
              <p
                className={`text-sm font-semibold ${
                  tx.kind === "in" ? "text-emerald-600" : "text-zinc-900"
                }`}
              >
                {tx.kind === "in" ? "+" : ""}
                {money(tx.amount, currency)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="font-medium text-zinc-900">Seller card</p>
        <div className="mt-3 grid gap-3">
          <Field label="Name">
            <Input
              className="bg-zinc-50 text-zinc-900"
              value={library.profile.name}
              onChange={(event) =>
                updateProfile({ ...library.profile, name: event.target.value })
              }
            />
          </Field>
          <Field label="City">
            <Input
              className="bg-zinc-50 text-zinc-900"
              value={library.profile.city}
              onChange={(event) =>
                updateProfile({ ...library.profile, city: event.target.value })
              }
            />
          </Field>
          <Field label="Currency">
            <select
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-900"
              value={library.profile.currency}
              onChange={(event) =>
                updateProfile({
                  ...library.profile,
                  currency: event.target.value as CurrencyCode,
                })
              }
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contact">
            <Input
              className="bg-zinc-50 text-zinc-900"
              value={library.profile.contact}
              onChange={(event) =>
                updateProfile({ ...library.profile, contact: event.target.value })
              }
            />
          </Field>
          <Field label="Share note">
            <Textarea
              className="bg-zinc-50 text-zinc-900"
              value={library.profile.note}
              onChange={(event) =>
                updateProfile({ ...library.profile, note: event.target.value })
              }
            />
          </Field>
        </div>
      </div>
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
        <span className="block text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-900">{value}</span>
      </span>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-zinc-500">{label}</Label>
      {children}
    </div>
  );
}
