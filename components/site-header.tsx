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

export function SiteHeader({ showAdd = false }: { showAdd?: boolean }) {
  const pathname = usePathname();
  const { account, signOut } = useLibrary();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-xl font-medium tracking-tight">
            Crate
          </Link>
          <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300/80">
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
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
          {showAdd && <AddGameSheet />}
          {account && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Switch user
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
