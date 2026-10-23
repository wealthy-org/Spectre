"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import {
  IconChevronDown,
  IconExternal,
  IconProof,
  IconShield,
  IconBook,
} from "@/components/app/Icons";

const PRIMARY_LINKS = [
  { href: "/app", label: "Portfolio" },
  { href: "/app/shield", label: "Shield" },
  { href: "/app/trade", label: "Trade" },
  { href: "/app/send", label: "Send" },
  { href: "/app/withdraw", label: "Withdraw" },
  { href: "/app/waves", label: "Waves" },
  { href: "/app/activity", label: "Activity" },
];

export function AppNav() {
  const pathname = usePathname();
  const [openProtocol, setOpenProtocol] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isProtocolActive =
    pathname === "/privacy" || pathname === "/proof" || pathname.startsWith("/docs");

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenProtocol(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--app-border)] bg-[var(--app-nav)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt="Spectre"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="hidden text-sm font-bold tracking-[0.15em] text-[var(--glow)] uppercase sm:inline">
            Spectre
          </span>
        </Link>

        {/* Center Nav (Overflow visible so dropdown pops out cleanly) */}
        <nav className="flex items-center gap-1 overflow-visible py-1">
          {PRIMARY_LINKS.map((l) => {
            const active =
              l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--ultra)] text-white"
                    : "text-[rgba(235,221,255,.72)] hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          {/* Protocol Dropdown */}
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenProtocol((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none ${
                isProtocolActive || openProtocol
                  ? "bg-[var(--ultra)] text-white"
                  : "text-[rgba(235,221,255,.72)] hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Protocol</span>
              <IconChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  openProtocol ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu (Z-index 100, full visibility, aligned right) */}
            {openProtocol && (
              <div className="absolute right-0 sm:right-0 mt-2 z-[100] w-64 rounded-2xl border border-[var(--app-border-strong)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-dimmer)] uppercase tracking-wider">
                  Audit, Docs & Disclosures
                </div>

                <Link
                  href="/docs"
                  onClick={() => setOpenProtocol(false)}
                  className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                    pathname.startsWith("/docs") ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                    <IconBook className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--glow)]">
                      Documentation
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)]">
                      Guides, contracts & API specs
                    </p>
                  </div>
                </Link>

                <Link
                  href="/privacy"
                  onClick={() => setOpenProtocol(false)}
                  className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                    pathname === "/privacy" ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--ultra)]/15 text-[var(--lilac)]">
                    <IconShield className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--glow)]">
                      Privacy & Threat Model
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)]">
                      Phase A vs Phase 2 disclosures
                    </p>
                  </div>
                </Link>

                <Link
                  href="/proof"
                  onClick={() => setOpenProtocol(false)}
                  className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                    pathname === "/proof" ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <IconProof className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--glow)]">
                      Settlement Proofs
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)]">
                      Onchain wave verification
                    </p>
                  </div>
                </Link>

                <div className="my-1 border-t border-white/5" />

                <Link
                  href="https://explorer.testnet.chain.robinhood.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenProtocol(false)}
                  className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-[var(--text-dim)] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span>Robinhood Explorer</span>
                  <IconExternal className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-[rgba(235,221,255,.75)] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ultra)]" />
            Robinhood
          </span>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
