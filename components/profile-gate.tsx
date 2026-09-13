"use client";

import { useState } from "react";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { signedIn, accounts, signIn, createAccount } = useLibrary();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [useSample, setUseSample] = useState(true);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState("");

  if (signedIn) return children;

  function trySignIn(accountId: string) {
    const account = accounts.find((item) => item.id === accountId);
    if (!account) return;
    if (account.pin) {
      setUnlockId(accountId);
      setEnteredPin("");
      setError("");
      return;
    }
    signIn(accountId);
  }

  function confirmPin(event: React.FormEvent) {
    event.preventDefault();
    const account = accounts.find((item) => item.id === unlockId);
    if (!account) return;
    if (enteredPin !== account.pin) {
      setError("That PIN does not match.");
      return;
    }
    signIn(account.id);
  }

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give this user a name.");
      return;
    }
    createAccount({
      name: name.trim(),
      pin: pin.trim() || null,
      useSample,
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-1 flex-col items-center justify-center rounded-[22px] border border-white/10 bg-[#161616] px-4 py-12 sm:min-h-[calc(100dvh-2.5rem)]">
      <p className="text-xs uppercase tracking-[0.32em] text-white/40">
        PlayStation library
      </p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
        Who&apos;s using this shelf?
      </h1>
      <p className="mt-3 max-w-lg text-center text-sm text-white/65">
        This is a local user on this device — like picking a profile on the
        console. There is no PlayStation Network login. A PIN is optional.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => trySignIn(account.id)}
            className="flex w-36 flex-col items-center gap-3 rounded-2xl p-4 hover:bg-white/8"
          >
            <span
              className="flex size-20 items-center justify-center rounded-full text-2xl font-medium text-white"
              style={{ background: account.avatarColor }}
            >
              {account.name.slice(0, 1)}
            </span>
            <span className="text-sm">{account.name}</span>
          </button>
        ))}
      </div>

      {unlockId && (
        <form onSubmit={confirmPin} className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <Label htmlFor="unlock-pin">PIN</Label>
          <Input
            id="unlock-pin"
            type="password"
            inputMode="numeric"
            value={enteredPin}
            onChange={(event) => setEnteredPin(event.target.value)}
          />
          <Button type="submit">Continue</Button>
        </form>
      )}

      <form
        onSubmit={onCreate}
        className="mt-12 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <p className="text-sm font-medium">Create a user</p>
        <div className="grid gap-1.5">
          <Label htmlFor="new-user">Name</Label>
          <Input
            id="new-user"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-pin">PIN (optional)</Label>
          <Input
            id="new-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Leave blank for no PIN"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={useSample}
            onChange={(event) => setUseSample(event.target.checked)}
          />
          Start with the sample collection
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Create user
        </Button>
      </form>
      </div>
    </div>
  );
}
