"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--app-border)] bg-[var(--surface)] p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--glow)] sm:text-3xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-2 max-w-xl text-sm text-[var(--text-dim)]">{lead}</p>
      )}
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
        {label}
      </span>
      <span className="text-2xl font-bold text-[var(--glow)]">{value}</span>
      {sub && <span className="text-xs text-[var(--text-dimmer)]">{sub}</span>}
    </Card>
  );
}

function format(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Countdown({ periodSeconds }: { periodSeconds: number }) {
  const [remaining, setRemaining] = useState(periodSeconds);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now() / 1000;
      setRemaining(periodSeconds - (now % periodSeconds));
    }, 1000);
    return () => clearInterval(id);
  }, [periodSeconds]);
  return <span className="font-mono tabular-nums">{format(remaining)}</span>;
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "muted";
}) {
  const tones = {
    default: "border border-[var(--app-border-strong)] text-[var(--text-dim)]",
    accent: "bg-[var(--ultra)] text-white",
    muted: "bg-[var(--surface-2)] text-[var(--text-dim)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-xl bg-[var(--ultra)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
