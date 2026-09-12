"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddGameSheet } from "@/components/add-game-sheet";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "The shelf" },
  { href: "/ledger", label: "Money" },
  { href: "/share", label: "Share" },
];

export function SiteHeader({ showAdd = false }: { showAdd?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#140e0a]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="font-heading text-2xl tracking-tight">
            Crate
          </Link>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">
            Physical PS5 library
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
                  ? "bg-amber-300/20 text-amber-100"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          {showAdd && <AddGameSheet />}
        </nav>
      </div>
    </header>
  );
}
