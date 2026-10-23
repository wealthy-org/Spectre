import Link from "next/link";
import { TradeWaveAnimation } from "@/components/app/TradeWaveAnimation";
import {
  IconProof,
  IconClock,
  IconPercent,
  IconShieldCheck,
} from "@/components/app/Icons";

export function TradeWavePreviewCard({ waveId }: { waveId?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--app-border-strong)] bg-[#140F24]/80 p-3 shadow-[0_16px_40px_-26px_rgba(156,72,240,0.25)] transition-[border-color,box-shadow,background-color] duration-500 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--glow)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--ultra)]/20 text-[var(--lilac)]">
            <IconProof className="h-3.5 w-3.5" />
          </span>
          <span>How batch waves execute</span>
        </div>
        <Link
          href="/docs"
          className="text-xs font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--lilac)]"
        >
          Batch auction math ↗
        </Link>
      </div>

      {/* Canvas Scene */}
      <TradeWaveAnimation waveId={waveId} />

      {/* Details Grid */}
      <div className="grid grid-cols-1 items-start gap-3 px-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-4 sm:gap-y-2">
        <div className="min-w-0 space-y-1.5">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--glow)] sm:text-base">
            <IconProof className="h-4 w-4 text-[var(--lilac)] shrink-0" />
            <span className="min-w-0">Internal crossing</span>
          </p>
          <p className="text-xs text-[var(--text-dimmer)]">
            Buys and sells net against each other with zero market impact
          </p>
          <div className="block pt-0.5 text-xs text-[var(--text-dim)]">
            <span className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0 text-[var(--text-dimmer)]">
                <IconClock className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">15-minute batch window auction</span>
            </span>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 sm:block sm:text-right">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dimmer)]">
            Execution Price
          </span>
          <span className="block text-right text-base font-semibold leading-tight tracking-tight text-[var(--glow)] sm:text-lg">
            Uniform clearing price
          </span>
          <span className="col-span-2 block text-right text-[11px] leading-snug text-[var(--text-dimmer)] sm:ml-auto sm:max-w-[13rem]">
            0.05% netting fee · 0 slippage
          </span>
        </div>
      </div>

      {/* Footer Guarantees */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 px-1.5 pt-2.5 pb-0.5 text-xs">
        <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
          <IconPercent className="h-3.5 w-3.5 text-[var(--text-dimmer)] shrink-0" />
          <span className="min-w-0">Netting fee 0.05%</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium text-[var(--glow)]">
          <IconShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="min-w-0">Zero public footprint until final wave settlement</span>
        </span>
      </div>
    </div>
  );
}
