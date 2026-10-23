"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = pathname === "/app/rules" || pathname?.startsWith("/app/rules");

  if (isFullscreen) {
    return <div className="min-h-screen bg-[#07050e] font-[var(--fb)] text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] font-[var(--fb)] text-[var(--glow)]">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
