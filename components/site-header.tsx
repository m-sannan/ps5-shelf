"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddGameSheet } from "@/components/add-game-sheet";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Library" },
  { href: "/ledger", label: "Money" },
  { href: "/share", label: "Share" },
];

export function SiteHeader({
  showAdd = false,
  tone = "dark",
}: {
  showAdd?: boolean;
  tone?: "dark" | "light" | "overlay";
}) {
  const pathname = usePathname();
  const { account, signOut } = useLibrary();
  const light = tone === "light";

  return (
    <header
      className={cn(
        "z-40",
        tone === "overlay"
          ? "absolute inset-x-0 top-0 border-b border-white/10 bg-black/20 backdrop-blur-md"
          : "sticky top-0",
        tone === "dark" && "border-b border-white/10 bg-black/30 backdrop-blur-xl",
        light && "border-b border-zinc-200/80 bg-white/80 text-zinc-900 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-xl font-medium tracking-tight">
            Crate
          </Link>
          <p
            className={cn(
              "text-[11px] uppercase tracking-[0.24em]",
              light ? "text-zinc-400" : "text-sky-300/80",
            )}
          >
            PS5 game library
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                pathname === link.href
                  ? light
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-black"
                  : light
                    ? "text-zinc-500 hover:text-zinc-900"
                    : "text-white/65 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
          {showAdd && <AddGameSheet />}
          {account && (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className={light ? "text-zinc-600" : undefined}
            >
              Switch user
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
