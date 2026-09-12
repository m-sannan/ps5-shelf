"use client";

import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { money, shortDate } from "@/lib/format";
import { libraryStats, loanTotal } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/types";

export function Ledger() {
  const { library, ready, updateProfile, restoreDemo } = useLibrary();
  const stats = libraryStats(library);

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">Adding up the receipts…</p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent on copies" value={money(stats.spent)} hint={`${stats.copies} discs ever owned`} />
        <StatCard label="Earned from loans" value={money(stats.loaned)} hint="Cash from people who borrowed" />
        <StatCard label="Sold" value={money(stats.soldIncome)} hint={`${stats.sold} copies moved on`} />
        <StatCard
          label="Still in the collection"
          value={money(stats.net)}
          hint={
            stats.net >= 0
              ? "What the shelf still cost you"
              : "Loans and sales covered the outlay"
          }
        />
      </div>

      <Card className="border-white/10 bg-black/25">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Seller card</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="owner">Your name</Label>
            <Input
              id="owner"
              value={library.profile.name}
              onChange={(event) =>
                updateProfile({ ...library.profile, name: event.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={library.profile.city}
              onChange={(event) =>
                updateProfile({ ...library.profile, city: event.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="contact">How people reach you</Label>
            <Input
              id="contact"
              value={library.profile.contact}
              onChange={(event) =>
                updateProfile({ ...library.profile, contact: event.target.value })
              }
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="pitch">Share page note</Label>
            <Textarea
              id="pitch"
              value={library.profile.note}
              onChange={(event) =>
                updateProfile({ ...library.profile, note: event.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-black/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Loans</th>
              <th className="px-4 py-3 font-medium">Sold</th>
              <th className="px-4 py-3 font-medium">Bought</th>
            </tr>
          </thead>
          <tbody>
            {library.games.map((game) => (
              <tr key={game.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{game.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {STATUS_LABELS[game.status]}
                </td>
                <td className="px-4 py-3">{money(game.purchasePrice)}</td>
                <td className="px-4 py-3">{money(loanTotal(game))}</td>
                <td className="px-4 py-3">
                  {game.soldPrice != null ? money(game.soldPrice) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shortDate(game.purchaseDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Demo copies live in this browser. Restoring the sample shelf does not
          touch anyone else.
        </p>
        <Button variant="outline" onClick={restoreDemo}>
          Restore sample shelf
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-white/10 bg-black/25">
      <CardHeader className="pb-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <CardTitle className="font-heading text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}
