"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";

const LINKS = [
  { href: "/app", label: "Portfolio" },
  { href: "/app/shield", label: "Shield" },
  { href: "/app/trade", label: "Trade" },
  { href: "/app/send", label: "Send" },
  { href: "/app/withdraw", label: "Withdraw" },
  { href: "/app/waves", label: "Waves" },
  { href: "/app/activity", label: "Activity" },
  { href: "/proof", label: "Proof" },
  { href: "/privacy", label: "Privacy" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--app-border)] bg-[var(--app-nav)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/brand/logo.png" alt="Spectre" width={28} height={28} className="h-7 w-7" />
          <span className="hidden text-sm font-bold tracking-[0.15em] text-[var(--glow)] uppercase sm:inline">
            Spectre
          </span>
        </Link>

        <nav className="scrollbar-none flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--ultra)] text-white"
                    : "text-[rgba(235,221,255,.72)] hover:text-[var(--glow)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[rgba(235,221,255,.8)] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ultra)]" />
            Robinhood Chain
          </span>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
