"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose } from "@/components/app/Icons";

interface PoolParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  lane: "deposit" | "pool" | "withdrawal";
}

export default function PrivacyRulesPage() {
  // 5 Privacy Habits
  const [habits, setHabits] = useState({
    newAddress: false,
    roundAmount: false,
    waitWave: false,
    dontRush: false,
    splitWaves: false,
  });

  const [poolTraffic, setPoolTraffic] = useState<8 | 40 | 200>(40);
  const [isAboutModelOpen, setIsAboutModelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate Linkability Score (0% - 100%)
  const calculateLinkChance = () => {
    let score = 100;
    if (habits.newAddress) score -= 35;
    if (habits.roundAmount) score -= 25;
    if (habits.waitWave) score -= 15;
    if (habits.dontRush) score -= 15;
    if (habits.splitWaves) score -= 10;

    // Traffic adjustment (more traffic = harder to link)
    if (poolTraffic === 200) score = Math.max(0, score - 5);
    if (poolTraffic === 8 && score > 0) score = Math.min(100, score + 10);

    return Math.max(0, Math.min(100, score));
  };

  const linkChance = calculateLinkChance();

  // Toggle habit
  const toggleHabit = (key: keyof typeof habits) => {
    setHabits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Step-by-step guided mode
  const handleNextStep = () => {
    if (activeStep === 0) {
      setHabits({ newAddress: true, roundAmount: false, waitWave: false, dontRush: false, splitWaves: false });
      setActiveStep(1);
    } else if (activeStep === 1) {
      setHabits((h) => ({ ...h, roundAmount: true }));
      setActiveStep(2);
    } else if (activeStep === 2) {
      setHabits((h) => ({ ...h, waitWave: true }));
      setActiveStep(3);
    } else if (activeStep === 3) {
      setHabits((h) => ({ ...h, dontRush: true }));
      setActiveStep(4);
    } else if (activeStep === 4) {
      setHabits((h) => ({ ...h, splitWaves: true }));
      setActiveStep(5);
    } else {
      // Reset
      setHabits({ newAddress: false, roundAmount: false, waitWave: false, dontRush: false, splitWaves: false });
      setActiveStep(0);
    }
  };

  // Interactive Full-View Canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 460);

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || window.innerWidth;
      height = rect.height || 460;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // Generate random background pool participant dots
    const particleCount = poolTraffic === 8 ? 50 : poolTraffic === 40 ? 140 : 300;
    const particles: PoolParticle[] = Array.from({ length: particleCount }).map(() => {
      const laneRoll = Math.random();
      const lane = laneRoll < 0.35 ? "deposit" : laneRoll < 0.65 ? "pool" : "withdrawal";
      return {
        x: Math.random() * width,
        y:
          lane === "deposit"
            ? height * 0.08 + Math.random() * (height * 0.2)
            : lane === "pool"
            ? height * 0.38 + Math.random() * (height * 0.24)
            : height * 0.72 + Math.random() * (height * 0.2),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.2,
        size: 1.2 + Math.random() * 1.6,
        alpha: 0.15 + Math.random() * 0.5,
        lane,
      };
    });

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const yDepositLane = height * 0.18;
      const yPoolLane = height * 0.50;
      const yWithdrawalLane = height * 0.82;

      // 1. Draw Swimlane Background Zones & Full-Width Divider Lines
      // Swimlane line 1 (Deposits separator)
      ctx.beginPath();
      ctx.moveTo(0, height * 0.33);
      ctx.lineTo(width, height * 0.33);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Swimlane line 2 (Withdrawals separator)
      ctx.beginPath();
      ctx.moveTo(0, height * 0.67);
      ctx.lineTo(width, height * 0.67);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Swimlane Labels (Left aligned with padding)
      ctx.fillStyle = "rgba(201, 162, 255, 0.35)";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "left";
      ctx.fillText("DEPOSITS", 28, height * 0.08);

      // Pool label (Right middle like Nullmask or Left)
      ctx.fillStyle = "rgba(156, 72, 240, 0.4)";
      ctx.fillText("POOL — shared privacy set", 28, height * 0.42);

      ctx.fillStyle = "rgba(201, 162, 255, 0.35)";
      ctx.fillText("WITHDRAWALS", 28, height * 0.73);

      // 2. Full-Width Time Ticks along bottom (-9h to now)
      const hours = ["-9 h", "-8 h", "-7 h", "-6 h", "-5 h", "-4 h", "-3 h", "-2 h", "-1 h", "now"];
      const tickStep = (width - 120) / (hours.length - 1);
      ctx.fillStyle = "rgba(235, 221, 255, 0.35)";
      ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";

      hours.forEach((h, i) => {
        const tx = 60 + i * tickStep;
        ctx.fillText(h, tx, height - 10);

        // Vertical faint grid line across entire canvas height
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, height - 24);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.stroke();
      });

      // 3. Draw Background Crowd Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.fillStyle =
          p.lane === "pool"
            ? `rgba(156, 72, 240, ${p.alpha})`
            : `rgba(201, 162, 255, ${p.alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Calculate User's Points Based on Active Habits
      const depX = width * 0.82;
      const depY = yDepositLane;

      const rushOffset = habits.dontRush ? -width * 0.38 : 0;
      const waveSnap = habits.waitWave ? -20 : 12;

      const singleWithX = depX + waveSnap + rushOffset;
      const singleWithY = yWithdrawalLane;

      const splitWithX1 = depX - width * 0.24 + rushOffset;
      const splitWithX2 = depX + width * 0.06 + rushOffset;

      const amountText = habits.roundAmount ? "1,000" : "1,234.56";

      // 5. Draw Scheduled Wave Vertical Stripes (if waitWave is active)
      if (habits.waitWave) {
        const waveX = singleWithX;
        ctx.fillStyle = "rgba(156, 72, 240, 0.08)";
        ctx.fillRect(waveX - 36, 0, 72, height - 24);

        ctx.strokeStyle = "rgba(201, 162, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.strokeRect(waveX - 36, 0, 72, height - 24);
        ctx.setLineDash([]);

        ctx.fillStyle = "#C9A2FF";
        ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.fillText("BATCH WAVE WINDOW", waveX, 24);
      }

      // 6. Connecting Trace Line (Heuristic linkage)
      const drawTraceLine = (fromX: number, fromY: number, toX: number, toY: number) => {
        if (linkChance <= 0) {
          // Unlinkable: Soft diffused purple curve dipping into pool
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.bezierCurveTo(fromX - 40, yPoolLane, toX + 40, yPoolLane, toX, toY);
          ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
          return;
        }

        const isFullyTrackable = linkChance >= 60;
        const strokeColor = isFullyTrackable
          ? `rgba(244, 63, 94, ${0.45 + Math.sin(elapsed * 4) * 0.25})`
          : `rgba(245, 158, 11, ${0.35 + Math.sin(elapsed * 3) * 0.15})`;

        // Glow laser line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isFullyTrackable ? 3.5 : 2;
        ctx.stroke();

        // Core bright line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = isFullyTrackable ? "#FF5C7A" : "#FBBF24";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Midpoint Badges
        const midX = (fromX + toX) * 0.5;
        const midY = (fromY + toY) * 0.5;

        // "SAME WALLET" or "CLEAN WALLET" pill
        ctx.save();
        ctx.translate(midX, midY - 14);
        ctx.fillStyle = habits.newAddress ? "rgba(16, 185, 129, 0.2)" : "rgba(225, 29, 72, 0.25)";
        ctx.strokeStyle = habits.newAddress ? "#10B981" : "#F43F5E";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-44, -10, 88, 20, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = habits.newAddress ? "#6EE7B7" : "#FDA4AF";
        ctx.font = "bold 8.5px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(habits.newAddress ? "CLEAN ADDRESS" : "SAME WALLET", 0, 0);
        ctx.restore();

        // Glowing "TRACKABLE" or "SHIELDED" Neon Badge
        ctx.save();
        ctx.translate(midX + 28, midY + 16);
        const isTrackable = linkChance >= 40;
        ctx.fillStyle = isTrackable ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)";
        ctx.strokeStyle = isTrackable ? "#F43F5E" : "#34D399";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-38, -12, 76, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isTrackable ? "#FF4D6D" : "#34D399";
        ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isTrackable ? "TRACKABLE" : "SHIELDED", 0, 0);
        ctx.restore();
      };

      // Draw trace connections
      if (habits.splitWaves) {
        drawTraceLine(depX, depY, splitWithX1, yWithdrawalLane);
        drawTraceLine(depX, depY, splitWithX2, yWithdrawalLane);
      } else {
        drawTraceLine(depX, depY, singleWithX, singleWithY);
      }

      // 7. Draw Deposit Node (Top)
      const depPulse = (Math.sin(elapsed * 3) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(depX, depY, 7 + depPulse * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(depX, depY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FACC15";
      ctx.fill();

      // Deposit Badge Callout
      ctx.fillStyle = "rgba(15, 12, 26, 0.9)";
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(depX - 60, depY - 28, 120, 20, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FDE047";
      ctx.font = "bold 9.5px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`your deposit ${amountText}`, depX, depY - 18);

      // 8. Draw Withdrawal Node(s) (Bottom)
      const drawWithdrawalNode = (wx: number, wy: number, label: string) => {
        const isClean = habits.newAddress;
        const wPulse = (Math.cos(elapsed * 3) + 1) * 0.5;

        ctx.beginPath();
        ctx.arc(wx, wy, 7 + wPulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = isClean ? "rgba(52, 211, 153, 0.4)" : "rgba(244, 63, 94, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fillStyle = isClean ? "#34D399" : "#F43F5E";
        ctx.fill();

        // Badge
        ctx.fillStyle = "rgba(15, 12, 26, 0.9)";
        ctx.strokeStyle = isClean ? "#34D399" : "#F43F5E";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(wx - 55, wy - 28, 110, 20, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isClean ? "#A7F3D0" : "#FECDD3";
        ctx.font = "bold 9.5px ui-monospace, SFMono-Regular, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, wx, wy - 18);
      };

      if (habits.splitWaves) {
        drawWithdrawalNode(splitWithX1, yWithdrawalLane, "withdrawal 500");
        drawWithdrawalNode(splitWithX2, yWithdrawalLane, "withdrawal 500");
      } else {
        drawWithdrawalNode(singleWithX, singleWithY, `withdrawal ${amountText}`);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [habits, poolTraffic, linkChance]);

  // Color calculation for Circular Gauge
  const gaugeColor =
    linkChance >= 70
      ? "#EF4444"
      : linkChance >= 40
      ? "#F59E0B"
      : linkChance >= 15
      ? "#38BDF8"
      : "#10B981";

  const gaugeStrokeDash = 2 * Math.PI * 38;
  const strokeDashoffset = gaugeStrokeDash * (1 - linkChance / 100);

  return (
    <div className="flex h-screen w-screen flex-col justify-between overflow-hidden bg-[#07050e] text-white select-none">
      {/* TOP HEADER */}
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0a0714]/90 px-6 py-4 backdrop-blur-md z-10 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-[#E6C65C] text-sm">
              SPECTRE
            </span>
            <Link
              href="/app/shield"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <span>Open Spectre</span>
              <span>→</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Privacy best practice
          </h1>
          <div>
            <button
              type="button"
              onClick={() => setIsAboutModelOpen(true)}
              className="mt-1 inline-flex items-center rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white uppercase cursor-pointer"
            >
              ABOUT THE MODEL
            </button>
          </div>
        </div>

        {/* RIGHT: CIRCULAR GAUGE CHANCE IT'S LINKED */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
            CHANCE IT&apos;S LINKED
          </span>
          <div className="relative mt-1 flex h-20 w-20 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke={gaugeColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={gaugeStrokeDash}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-mono text-base font-bold transition-colors"
                style={{ color: gaugeColor }}
              >
                {linkChance}%
              </span>
              <span className="text-[9px] font-bold text-[var(--text-dimmer)] uppercase">
                {linkChance === 0 ? "UNLINKED" : "LINKED"}
              </span>
            </div>
          </div>
          <span className="mt-1 text-[11px] text-[var(--text-dim)] text-center max-w-[140px]">
            {linkChance >= 70
              ? "you're alone — easy to link"
              : linkChance >= 30
              ? "partial linkability remains"
              : linkChance > 0
              ? "almost fully blended"
              : "fully blended in pool"}
          </span>
        </div>
      </header>

      {/* FULL VIEW CANVAS STAGE */}
      <main className="relative flex-1 w-full min-h-[360px] overflow-hidden bg-[#07050e]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full select-none cursor-crosshair touch-none"
        />
      </main>

      {/* DOCKED BOTTOM CONTROL DECK */}
      <footer className="shrink-0 w-full border-t border-white/5 bg-[#0a0714]/95 px-6 pb-4 pt-3 backdrop-blur-md z-10 space-y-3">
        {/* Upper Explainer Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0e0a1c]/90 p-4 shadow-xl">
          <div className="grid gap-5 md:grid-cols-[220px_1fr_auto] md:items-center">
            {/* Left Diagram: Why it's trackable vs shielded */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
                <span>{linkChance > 0 ? "WHY IT'S TRACKABLE" : "HOW IT'S SHIELDED"}</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-1 text-center font-mono text-[10px]">
                <div className="rounded-lg border border-white/15 bg-white/5 p-1.5 flex-1">
                  <span className="block text-[8.5px] text-[var(--text-dimmer)]">WALLET</span>
                  <span className="font-bold text-white text-[10px]">0x3F..9a1c</span>
                </div>
                <div className="text-[var(--lilac)] font-bold text-xs">→</div>
                <div className="rounded-lg border border-[var(--ultra)]/50 bg-[var(--ultra)]/20 p-1.5 flex-1">
                  <span className="block text-[8.5px] text-[var(--lilac)]">POOL</span>
                  <span className="font-bold text-[var(--glow)] text-[10px]">VAULT</span>
                </div>
                <div className="text-[var(--lilac)] font-bold text-xs">→</div>
                <div
                  className={`rounded-lg border p-1.5 flex-1 ${
                    habits.newAddress
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/50 bg-rose-500/20 text-rose-300"
                  }`}
                >
                  <span className="block text-[8.5px] opacity-75">
                    {habits.newAddress ? "CLEAN" : "SAME"}
                  </span>
                  <span className="font-bold text-[10px]">
                    {habits.newAddress ? "0x8D..4e2b" : "0x3F..9a1c"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center Explainer Text */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--lilac)]">
                WHAT ANYONE CAN SEE
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white">
                {linkChance >= 70
                  ? "Your withdrawal is trackable"
                  : linkChance >= 30
                  ? "Partial heuristics leak your identity"
                  : linkChance > 0
                  ? "Near-complete anonymity achieved"
                  : "Zero linkability: 100% private in the pool"}
              </h2>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed line-clamp-2">
                {linkChance >= 70
                  ? "Anyone can see every deposit (top) and every withdrawal (bottom), forever. You withdrew to the same wallet with exact matching amounts — the link is obvious. Turn on the 5 habits below to keep it private."
                  : linkChance >= 30
                  ? "Changing address helped, but the exact odd decimal amount or immediate withdrawal timing creates heuristic correlation on public chain explorers."
                  : linkChance > 0
                  ? "By using a clean address, standard round bucket, and batch wave timing, only faint statistical traces remain."
                  : "All heuristic vectors are severed! Clean destination address, standard bucket denomination, delayed scheduled wave window, and multi-wave splitting."}
              </p>
            </div>

            {/* Right Action Button */}
            <div className="flex md:flex-col items-center">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full whitespace-nowrap rounded-xl bg-[var(--ultra)] px-6 py-3 text-xs font-bold text-white shadow-[0_8px_24px_-6px_rgba(156,72,240,0.5)] hover:bg-[var(--violet)] transition-all cursor-pointer active:scale-95"
              >
                {activeStep === 0
                  ? "START GUIDE"
                  : activeStep === 5
                  ? "RESET SIMULATOR"
                  : "NEXT HABIT →"}
              </button>
            </div>
          </div>
        </div>

        {/* Lower Habits Toolbar (5 Habits) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Step By Step button */}
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--glow)] hover:border-[var(--ultra)] hover:bg-white/10 transition-all cursor-pointer shrink-0"
          >
            <span>⟳</span>
            <span>STEP BY STEP</span>
          </button>

          {/* 5 Habit Toggles */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* 1. New Address */}
            <button
              type="button"
              onClick={() => toggleHabit("newAddress")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                habits.newAddress
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  habits.newAddress ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {habits.newAddress ? "✓" : "1"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">New address</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  not original wallet
                </span>
              </div>
            </button>

            {/* 2. Round Amount */}
            <button
              type="button"
              onClick={() => toggleHabit("roundAmount")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                habits.roundAmount
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  habits.roundAmount ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {habits.roundAmount ? "✓" : "2"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Round amount</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  1,000, not 1,234.56
                </span>
              </div>
            </button>

            {/* 3. Wait for the Wave */}
            <button
              type="button"
              onClick={() => toggleHabit("waitWave")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                habits.waitWave
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  habits.waitWave ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {habits.waitWave ? "✓" : "3"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Wait for wave</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  with the next wave
                </span>
              </div>
            </button>

            {/* 4. Don't Rush */}
            <button
              type="button"
              onClick={() => toggleHabit("dontRush")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                habits.dontRush
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  habits.dontRush ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {habits.dontRush ? "✓" : "4"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Don&apos;t rush</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  hours, not 10 mins
                </span>
              </div>
            </button>

            {/* 5. Split across waves */}
            <button
              type="button"
              onClick={() => toggleHabit("splitWaves")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                habits.splitWaves
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  habits.splitWaves ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {habits.splitWaves ? "✓" : "5"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Split waves</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  2 × 500 across waves
                </span>
              </div>
            </button>
          </div>

          {/* Traffic selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
              PEOPLE IN POOL:
            </span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {([8, 40, 200] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPoolTraffic(t)}
                  className={`rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    poolTraffic === t
                      ? "bg-[var(--ultra)] text-white shadow-xs"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {t}/h
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ABOUT THE MODEL MODAL POPUP */}
      {isAboutModelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsAboutModelOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#140F26] p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">About the Privacy Model</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Mathematical heuristics & anonymity set mechanics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutModelOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-dim)] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-[var(--text-dim)] leading-relaxed">
              <div>
                <h4 className="font-bold text-white text-sm">1. Address Graph Isolation</h4>
                <p className="mt-1">
                  Depositing from Wallet A and withdrawing to Wallet A links both ends directly onchain, making the shared pool act merely as a passthrough. Always exit to a fresh address.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">2. Anonymity Buckets (Exact Amounts)</h4>
                <p className="mt-1">
                  Depositing an odd number like <code className="text-[var(--lilac)]">1,234.56 USDG</code> and withdrawing the exact same amount creates a unique statistical fingerprint. Round amounts (e.g. 1,000) allow you to hide within everyone else withdrawing 1,000.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">3. Temporal Decoupling (Batch Waves)</h4>
                <p className="mt-1">
                  Exiting within seconds of depositing creates an obvious chronological match. Waiting across multiple 15-minute scheduled wave intervals severs the time correlation.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">4. Volume Splitting</h4>
                <p className="mt-1">
                  Breaking larger amounts into multiple smaller withdrawals across different wave intervals completely disrupts graph analysis algorithms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModelOpen(false)}
              className="mt-6 w-full rounded-2xl bg-[var(--ultra)] py-3 text-xs font-bold text-white hover:bg-[var(--violet)] transition-all cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
