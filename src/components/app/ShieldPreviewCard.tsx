import Link from "next/link";
import { ShieldCanvasAnimation } from "@/components/app/ShieldCanvasAnimation";
import {
  IconArrowDownToLine,
  IconClock,
  IconPercent,
  IconShieldCheck,
  IconEnter,
} from "@/components/app/Icons";

export function ShieldPreviewCard() {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--app-border-strong)] bg-[#140F24]/80 p-3 shadow-[0_16px_40px_-26px_rgba(156,72,240,0.25)] transition-[border-color,box-shadow,background-color] duration-500 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--glow)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--ultra)]/20 text-[var(--lilac)]">
            <IconEnter className="h-3.5 w-3.5" />
          </span>
          <span>How it enters</span>
        </div>
        <Link
          href="/app/rules"
          className="text-xs font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--lilac)]"
        >
          Privacy best practice ↗
        </Link>
      </div>

      {/* Canvas Scene */}
      <ShieldCanvasAnimation />

      {/* Details Grid */}
      <div className="grid grid-cols-1 items-start gap-3 px-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-4 sm:gap-y-2">
        <div className="min-w-0 space-y-1.5">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--glow)] sm:text-base">
            <IconArrowDownToLine className="h-4 w-4 text-[var(--lilac)] shrink-0" />
            <span className="min-w-0">Direct deposit</span>
          </p>
          <p className="text-xs text-[var(--text-dimmer)]">You send it yourself</p>
          <div className="block pt-0.5 text-xs text-[var(--text-dim)]">
            <span className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0 text-[var(--text-dimmer)]">
                <IconClock className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">Instant execution on Robinhood Chain L2</span>
            </span>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 sm:block sm:text-right">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dimmer)]">
            You receive
          </span>
          <span className="block text-right text-base font-semibold leading-tight tracking-tight text-[var(--glow)] sm:text-lg">
            Exactly the amount you pick
          </span>
          <span className="col-span-2 block text-right text-[11px] leading-snug text-[var(--text-dimmer)] sm:ml-auto sm:max-w-[13rem]">
            0.0% deposit fee on testnet
          </span>
        </div>
      </div>

      {/* Footer Guarantees */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 px-1.5 pt-2.5 pb-0.5 text-xs">
        <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
          <IconPercent className="h-3.5 w-3.5 text-[var(--text-dimmer)] shrink-0" />
          <span className="min-w-0">Deposit fee 0%</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium text-[var(--glow)]">
          <IconShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="min-w-0">Nothing leaves your wallet until you sign it</span>
        </span>
      </div>
    </div>
  );
}
