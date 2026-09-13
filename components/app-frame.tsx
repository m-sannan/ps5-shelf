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

export function AppFrame({
  children,
  showAdd = false,
}: {
  children: React.ReactNode;
  showAdd?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#161616] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:min-h-[calc(100dvh-2.5rem)]">
        <SiteHeader showAdd={showAdd} />
        <div className="flex-1 overflow-auto px-4 pb-6 pt-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function SiteHeader({ showAdd }: { showAdd?: boolean }) {
  const pathname = usePathname();
  const { account, signOut } = useLibrary();

  return (
    <header className="shrink-0 border-b border-white/8 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="text-[15px] font-medium tracking-tight">
          Crate
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1.5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                pathname === link.href
                  ? "bg-[#2a2a2c] text-white"
                  : "text-white/50 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {showAdd && <AddGameSheet />}
          {account && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Switch user
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
