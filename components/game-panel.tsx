"use client";

import { useState } from "react";
import { ArtworkPicker } from "@/components/artwork-picker";
import { DiscFace } from "@/components/game-case";
import { useLibrary } from "@/components/library-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { money, shortDate } from "@/lib/format";
import { loanTotal } from "@/lib/stats";
import {
  CONDITION_LABELS,
  CONDITIONS,
  PLAY_STATUSES,
  STATUS_LABELS,
  type Condition,
  type Game,
  type PlayStatus,
} from "@/lib/types";

function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function GamePanel({
  game,
  onClose,
  emptyHint,
  readOnly = false,
}: {
  game: Game | null;
  onClose: () => void;
  emptyHint: string;
  readOnly?: boolean;
}) {
  const { library, updateGame, deleteGame, addLoan, updateLoan, removeLoan } =
    useLibrary();
  const currency = library.profile.currency;
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [loanDate, setLoanDate] = useState("");
  const [loanNote, setLoanNote] = useState("");

  if (!game) {
    return (
      <aside className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-muted-foreground lg:sticky lg:top-8">
        {emptyHint}
      </aside>
    );
  }

  const selected = game;
  const recovered = loanTotal(selected) + (selected.soldPrice ?? 0);
  const net = selected.purchasePrice - recovered;

  async function onPhoto(
    field: "coverImage" | "discPhoto",
    file: File | undefined,
  ) {
    if (!file) return;
    const data = await fileToDataUrl(file);
    updateGame(selected.id, { [field]: data });
  }

  function submitLoan(event: React.FormEvent) {
    event.preventDefault();
    if (!person.trim()) return;
    addLoan(selected.id, {
      person: person.trim(),
      amount: Number(amount) || 0,
      date: loanDate || new Date().toISOString().slice(0, 10),
      note: loanNote.trim(),
      returned: false,
    });
    if (selected.status !== "sold") {
      updateGame(selected.id, { status: "lent_out" });
    }
    setPerson("");
    setAmount("");
    setLoanDate("");
    setLoanNote("");
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl lg:sticky lg:top-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300">
            PS5 copy
          </p>
          <h2 className="mt-1 text-2xl font-medium leading-tight">{game.title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <DiscFace game={game} size={88} />
        <div className="space-y-2 text-sm">
          <Badge className="bg-sky-400/15 text-sky-100">
            {STATUS_LABELS[game.status]}
          </Badge>
          <p className="text-muted-foreground">
            {CONDITION_LABELS[game.condition]} · bought {shortDate(game.purchaseDate)}
          </p>
          <p>
            Paid {money(game.purchasePrice, currency)}
            {game.askingPrice != null && game.status === "for_sale"
              ? ` · asking ${money(game.askingPrice, currency)}`
              : null}
            {game.soldPrice != null ? ` · sold ${money(game.soldPrice, currency)}` : null}
          </p>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FieldSelect
            id="status"
            label="Play / sale status"
            value={game.status}
            onChange={(value) => updateGame(game.id, { status: value as PlayStatus })}
            options={PLAY_STATUSES.map((status) => ({
              value: status,
              label: STATUS_LABELS[status],
            }))}
          />
          <FieldSelect
            id="condition"
            label="Condition"
            value={game.condition}
            onChange={(value) => updateGame(game.id, { condition: value as Condition })}
            options={CONDITIONS.map((condition) => ({
              value: condition,
              label: CONDITION_LABELS[condition],
            }))}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Paid" value={money(game.purchasePrice, currency)} />
        <Stat label="From loans" value={money(loanTotal(game), currency)} />
        <Stat label="Still in it" value={money(net, currency)} />
      </div>

      {game.notes && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{game.notes}</p>
      )}

      {!readOnly && (
        <div className="mt-4">
          <Label htmlFor={`notes-${game.id}`}>Notes</Label>
          <Textarea
            id={`notes-${game.id}`}
            className="mt-1.5 min-h-20"
            value={game.notes}
            onChange={(event) => updateGame(game.id, { notes: event.target.value })}
          />
        </div>
      )}

      <section className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-sky-300">
          Loans & trades
        </h3>
        {game.loans.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nobody has borrowed this copy yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {game.loans.map((loan) => (
              <li
                key={loan.id}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{loan.person}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(loan.date)} · {money(loan.amount, currency)} ·{" "}
                      {loan.returned ? "returned" : "still out"}
                    </p>
                    {loan.note && (
                      <p className="mt-1 text-xs text-muted-foreground">{loan.note}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          updateLoan(game.id, loan.id, { returned: !loan.returned })
                        }
                      >
                        {loan.returned ? "Out" : "Back"}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => removeLoan(game.id, loan.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!readOnly && (
          <form onSubmit={submitLoan} className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Who borrowed it"
                value={person}
                onChange={(event) => setPerson(event.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="What they paid"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <Input
              type="date"
              value={loanDate}
              onChange={(event) => setLoanDate(event.target.value)}
            />
            <Input
              placeholder="Note — weekend loan, trade, etc."
              value={loanNote}
              onChange={(event) => setLoanNote(event.target.value)}
            />
            <Button type="submit" size="sm">
              Log a loan
            </Button>
          </form>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-sky-300">
          Asking / sold
        </h3>
        {readOnly ? (
          <p className="mt-2 text-sm">
            {game.status === "for_sale" && game.askingPrice != null
              ? `Asking ${money(game.askingPrice, currency)}`
              : game.status === "sold" && game.soldPrice != null
                ? `Sold for ${money(game.soldPrice, currency)}`
                : "Not listed."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`ask-${game.id}`}>Asking price</Label>
              <Input
                id={`ask-${game.id}`}
                className="mt-1.5"
                type="number"
                min="0"
                step="0.01"
                value={game.askingPrice ?? ""}
                onChange={(event) => {
                  const next = event.target.value;
                  updateGame(game.id, {
                    askingPrice: next === "" ? null : Number(next),
                    status: next === "" ? game.status : "for_sale",
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor={`sold-${game.id}`}>Sold for</Label>
              <Input
                id={`sold-${game.id}`}
                className="mt-1.5"
                type="number"
                min="0"
                step="0.01"
                value={game.soldPrice ?? ""}
                onChange={(event) => {
                  const next = event.target.value;
                  updateGame(game.id, {
                    soldPrice: next === "" ? null : Number(next),
                    status: next === "" ? game.status : "sold",
                  });
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-sky-300">
          Artwork
        </h3>
        {!readOnly && (
          <div className="mt-3">
            <ArtworkPicker
              title={game.title}
              current={game.coverImage}
              onPick={(url) => updateGame(game.id, { coverImage: url })}
            />
          </div>
        )}
        <div className="mt-3 grid gap-3">
          <PhotoSlot
            label="Box art"
            src={game.coverImage}
            readOnly={readOnly}
            onFile={(file) => onPhoto("coverImage", file)}
            onUrl={(url) => updateGame(game.id, { coverImage: url })}
            onClear={() => updateGame(game.id, { coverImage: null })}
          />
          <PhotoSlot
            label="Disc photo"
            src={game.discPhoto}
            readOnly={readOnly}
            onFile={(file) => onPhoto("discPhoto", file)}
            onUrl={(url) => updateGame(game.id, { discPhoto: url })}
            onClear={() => updateGame(game.id, { discPhoto: null })}
          />
        </div>
      </section>

      {!readOnly && (
        <Button
          className="mt-6 w-full"
          variant="destructive"
          onClick={() => {
            deleteGame(game.id);
            onClose();
          }}
        >
          Remove from shelf
        </Button>
      )}
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function PhotoSlot({
  label,
  src,
  readOnly,
  onFile,
  onUrl,
  onClear,
}: {
  label: string;
  src: string | null;
  readOnly: boolean;
  onFile: (file: File | undefined) => void;
  onUrl: (url: string) => void;
  onClear: () => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artSrc(src)}
          alt={label}
          className="mt-2 h-40 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-dashed border-white/15 text-xs text-muted-foreground">
          Upload a photo or paste a link
        </div>
      )}
      {!readOnly && (
        <div className="mt-2 grid gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <div className="flex gap-2">
            <Input
              placeholder="https:// image link"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (url.trim()) onUrl(url.trim());
              }}
            >
              Use
            </Button>
          </div>
          {src && (
            <Button type="button" size="xs" variant="ghost" onClick={onClear}>
              Clear art
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
