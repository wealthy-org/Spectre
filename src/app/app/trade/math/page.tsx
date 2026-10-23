"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose } from "@/components/app/Icons";

interface OrderParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  side: "buy" | "sell";
  address: string;
  amount: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface BackgroundDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  lane: "buy" | "core" | "sell";
}

const PAIR_METRICS = {
  USDG_NVDA: {
    symbol: "NVDA",
    pairName: "USDG ⇄ NVDA",
    referencePrice: 139.38,
    buyVolume: 86420,
    sellVolume: 58000,
    matchedVolume: 58000,
    imbalanceVolume: 28420,
    crossPct: 67,
    savedSlippageUsd: 1420,
    ammSlippagePct: 1.84,
  },
  USDG_ETH: {
    symbol: "ETH",
    pairName: "USDG ⇄ ETH",
    referencePrice: 3250.0,
    buyVolume: 124000,
    sellVolume: 110000,
    matchedVolume: 110000,
    imbalanceVolume: 14000,
    crossPct: 89,
    savedSlippageUsd: 2860,
    ammSlippagePct: 1.25,
  },
  USDG_TSLA: {
    symbol: "TSLA",
    pairName: "USDG ⇄ TSLA",
    referencePrice: 243.24,
    buyVolume: 42000,
    sellVolume: 49000,
    matchedVolume: 42000,
    imbalanceVolume: 7000,
    crossPct: 86,
    savedSlippageUsd: 890,
    ammSlippagePct: 1.62,
  },
} as const;

export default function BatchAuctionMathPage() {
  // 5 Batch Auction Principles
  const [principles, setPrinciples] = useState({
    internalCrossing: true,
    uniformClearing: true,
    batchWindow: true,
    residualRouting: true,
    nettingFee: true,
  });

  const [selectedPair, setSelectedPair] = useState<keyof typeof PAIR_METRICS>("USDG_NVDA");
  const [isAboutModelOpen, setIsAboutModelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentPairData = PAIR_METRICS[selectedPair];

  // Calculate MEV Resistance Score & Efficiency
  const calculateMetrics = () => {
    let mevScore = 0;
    if (principles.batchWindow) mevScore += 40;
    if (principles.uniformClearing) mevScore += 35;
    if (principles.internalCrossing) mevScore += 15;
    if (principles.residualRouting) mevScore += 10;

    let effectiveSlippage = "0.00%";
    if (!principles.internalCrossing) {
      effectiveSlippage = `${currentPairData.ammSlippagePct}%`;
    }

    return {
      mevScore: Math.min(100, Math.max(0, mevScore)),
      effectiveSlippage,
      feeRate: principles.nettingFee ? "0.05%" : "0.30%",
      effectiveSavings: principles.internalCrossing ? `$${currentPairData.savedSlippageUsd.toLocaleString()}` : "$0",
    };
  };

  const metrics = calculateMetrics();

  // Toggle principle
  const togglePrinciple = (key: keyof typeof principles) => {
    setPrinciples((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Step-by-step guided mode
  const handleNextStep = () => {
    if (activeStep === 0) {
      setPrinciples({
        internalCrossing: true,
        uniformClearing: false,
        batchWindow: false,
        residualRouting: false,
        nettingFee: false,
      });
      setActiveStep(1);
    } else if (activeStep === 1) {
      setPrinciples((p) => ({ ...p, uniformClearing: true }));
      setActiveStep(2);
    } else if (activeStep === 2) {
      setPrinciples((p) => ({ ...p, batchWindow: true }));
      setActiveStep(3);
    } else if (activeStep === 3) {
      setPrinciples((p) => ({ ...p, residualRouting: true }));
      setActiveStep(4);
    } else if (activeStep === 4) {
      setPrinciples((p) => ({ ...p, nettingFee: true }));
      setActiveStep(5);
    } else {
      // Reset
      setPrinciples({
        internalCrossing: false,
        uniformClearing: false,
        batchWindow: false,
        residualRouting: false,
        nettingFee: false,
      });
      setActiveStep(0);
    }
  };

  // High-Fidelity Canvas Simulation
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

    // Background ambient particles
    const bgDots: BackgroundDot[] = Array.from({ length: 90 }).map(() => {
      const laneRoll = Math.random();
      const lane = laneRoll < 0.35 ? "buy" : laneRoll < 0.65 ? "core" : "sell";
      return {
        x: Math.random() * width,
        y:
          lane === "buy"
            ? height * 0.12 + Math.random() * (height * 0.22)
            : lane === "core"
            ? height * 0.40 + Math.random() * (height * 0.20)
            : height * 0.68 + Math.random() * (height * 0.22),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.18,
        size: 1.2 + Math.random() * 1.6,
        alpha: 0.12 + Math.random() * 0.4,
        lane,
      };
    });

    // Particle streams
    const sparks: Spark[] = [];
    let coreFlash = 0;

    const triggerMatchBurst = (cx: number, cy: number) => {
      coreFlash = 1.0;
      for (let i = 0; i < 36; i++) {
        const ang = (Math.PI * 2 * i) / 36 + (Math.random() - 0.5) * 0.3;
        const spd = 2.5 + Math.random() * 4.5;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 42 + Math.random() * 24,
          color: Math.random() > 0.5 ? "#C9A2FF" : "#34D399",
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerMatchBurst(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    // Active order flow
    const sampleAddresses = [
      "0x8a..1e", "0x3c..f9", "0x5d..42", "0x91..b8", "0x2e..10", "0x7f..8b",
      "0x44..c1", "0x19..d4", "0x6b..a0", "0xf2..08", "0xcc..77", "0x0d..33",
    ];

    const orders: OrderParticle[] = Array.from({ length: 22 }).map((_, i) => {
      const side = i % 2 === 0 ? "buy" : "sell";
      return {
        id: i,
        x: Math.random() * (width * 0.38),
        y: side === "buy" ? height * 0.20 + (Math.random() - 0.5) * 35 : height * 0.80 + (Math.random() - 0.5) * 35,
        vx: 0.75 + Math.random() * 0.65,
        vy: (Math.random() - 0.5) * 0.2,
        size: 3 + Math.random() * 1.5,
        alpha: 0.5 + Math.random() * 0.45,
        side,
        address: sampleAddresses[i % sampleAddresses.length],
        amount:
          side === "buy"
            ? `+$${(Math.random() * 6000 + 1200).toFixed(0)} USDG`
            : `-${(Math.random() * 40 + 5).toFixed(0)} ${currentPairData.symbol}`,
      };
    });

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const yBuyLane = height * 0.20;
      const yCoreLane = height * 0.50;
      const ySellLane = height * 0.80;
      const coreX = width * 0.50;

      // 1. Full-Width Horizontal Swimlane Dividers
      // Buy Swimlane line
      ctx.beginPath();
      ctx.moveTo(0, height * 0.34);
      ctx.lineTo(width, height * 0.34);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sell Swimlane line
      ctx.beginPath();
      ctx.moveTo(0, height * 0.66);
      ctx.lineTo(width, height * 0.66);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Full-Width Time Ticks Along Bottom (-15m to settlement)
      const intervals = ["-15 min", "-12 min", "-9 min", "-6 min", "-3 min", "-1 min", "LOCK", "CLEAR", "FINAL"];
      const tickStep = (width - 120) / (intervals.length - 1);
      ctx.fillStyle = "rgba(235, 221, 255, 0.35)";
      ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";

      intervals.forEach((label, i) => {
        const tx = 60 + i * tickStep;
        ctx.fillText(label, tx, height - 12);

        // Vertical faint grid line across entire canvas height
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, height - 26);
        ctx.strokeStyle = i >= 6 ? "rgba(156, 72, 240, 0.12)" : "rgba(255, 255, 255, 0.035)";
        ctx.lineWidth = i >= 6 ? 1.5 : 1;
        ctx.stroke();
      });

      // Swimlane Left Badges
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "left";

      // Top lane label
      ctx.fillStyle = "rgba(52, 211, 153, 0.75)";
      ctx.fillText(`BUY ORDERS (USDG) — TOTAL: $${currentPairData.buyVolume.toLocaleString()}`, 28, height * 0.09);

      // Center lane label
      ctx.fillStyle = "rgba(201, 162, 255, 0.75)";
      ctx.fillText("BATCH AUCTION CORE — 15-MINUTE WAVE CLEARING", 28, height * 0.39);

      // Bottom lane label
      ctx.fillStyle = "rgba(244, 63, 94, 0.75)";
      ctx.fillText(`SELL ORDERS (${currentPairData.symbol}) — TOTAL: $${currentPairData.sellVolume.toLocaleString()}`, 28, height * 0.71);

      // 3. Draw Background Ambient Crowd Particles
      for (const dot of bgDots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0) dot.x = width;
        if (dot.x > width) dot.x = 0;

        ctx.fillStyle =
          dot.lane === "buy"
            ? `rgba(52, 211, 153, ${dot.alpha * 0.5})`
            : dot.lane === "sell"
            ? `rgba(244, 63, 94, ${dot.alpha * 0.5})`
            : `rgba(156, 72, 240, ${dot.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw 15-Minute Scheduled Batch Window Pillar (if batchWindow is active)
      if (principles.batchWindow) {
        const windowWidth = 240;
        const windowLeft = coreX - windowWidth * 0.5;

        // Glowing vertical band
        const windowGrad = ctx.createLinearGradient(windowLeft, 0, windowLeft + windowWidth, 0);
        windowGrad.addColorStop(0, "rgba(156, 72, 240, 0)");
        windowGrad.addColorStop(0.2, "rgba(156, 72, 240, 0.08)");
        windowGrad.addColorStop(0.5, "rgba(201, 162, 255, 0.14)");
        windowGrad.addColorStop(0.8, "rgba(156, 72, 240, 0.08)");
        windowGrad.addColorStop(1, "rgba(156, 72, 240, 0)");
        ctx.fillStyle = windowGrad;
        ctx.fillRect(windowLeft, 0, windowWidth, height - 26);

        // Dashed border container
        ctx.strokeStyle = "rgba(201, 162, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(windowLeft, 0, windowWidth, height - 26);
        ctx.setLineDash([]);

        // Window Top Badge
        ctx.fillStyle = "rgba(20, 15, 36, 0.95)";
        ctx.strokeStyle = "#9C48F0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(coreX - 70, 14, 140, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#C9A2FF";
        ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BATCH WAVE WINDOW", coreX, 25);
        ctx.textBaseline = "alphabetic";
      }

      // 5. Draw Supply & Demand Clearing Curves in background (when uniformClearing is on)
      if (principles.uniformClearing) {
        const graphLeft = coreX - 110;
        const graphRight = coreX + 110;

        // Demand curve (Green, sloping downward)
        ctx.beginPath();
        ctx.moveTo(graphLeft, yCoreLane - 46);
        ctx.bezierCurveTo(coreX - 30, yCoreLane - 20, coreX + 30, yCoreLane + 20, graphRight, yCoreLane + 46);
        ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Supply curve (Rose, sloping upward)
        ctx.beginPath();
        ctx.moveTo(graphLeft, yCoreLane + 46);
        ctx.bezierCurveTo(coreX - 30, yCoreLane + 20, coreX + 30, yCoreLane - 20, graphRight, yCoreLane - 46);
        ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 6. Draw Central Batch Core Reactor
      coreFlash = Math.max(0, coreFlash - 0.02);
      const corePulse = (Math.sin(elapsed * 3.5) + 1) * 0.5;

      // Radial Core Glow
      const coreGlow = ctx.createRadialGradient(coreX, yCoreLane, 0, coreX, yCoreLane, 130);
      coreGlow.addColorStop(0, `rgba(156, 72, 240, ${0.25 + coreFlash * 0.45 + corePulse * 0.08})`);
      coreGlow.addColorStop(0.7, "rgba(156, 72, 240, 0.05)");
      coreGlow.addColorStop(1, "rgba(156, 72, 240, 0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(coreX - 130, yCoreLane - 130, 260, 260);

      // Core Outer Pulsing Ring
      ctx.beginPath();
      ctx.arc(coreX, yCoreLane, 52 + corePulse * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 162, 255, ${0.35 + coreFlash * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core Central Disc Card
      ctx.fillStyle = "rgba(16, 11, 28, 0.96)";
      ctx.strokeStyle = principles.internalCrossing ? "#9C48F0" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(coreX - 86, yCoreLane - 38, 172, 76, 20);
      ctx.fill();
      ctx.stroke();

      // Core Text Content
      ctx.textAlign = "center";
      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 10px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(principles.internalCrossing ? "INTERNAL CROSSING" : "UNBATCHED POOL", coreX, yCoreLane - 15);

      ctx.fillStyle = principles.internalCrossing ? "#34D399" : "#F43F5E";
      ctx.font = "bold 15px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(
        principles.internalCrossing
          ? `$${currentPairData.matchedVolume.toLocaleString()}`
          : "HIGH SLIPPAGE",
        coreX,
        yCoreLane + 4
      );

      ctx.fillStyle = principles.internalCrossing ? "#A7F3D0" : "#FDA4AF";
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(
        principles.internalCrossing
          ? `0.00% slippage · P* = $${currentPairData.referencePrice.toFixed(2)}`
          : "Continuous AMM curve",
        coreX,
        yCoreLane + 18
      );

      ctx.fillStyle = "rgba(235, 221, 255, 0.6)";
      ctx.font = "9px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(
        principles.nettingFee ? "0.05% netting fee (83% saved)" : "0.30% typical LP fee",
        coreX,
        yCoreLane + 30
      );
      ctx.textAlign = "left";

      // 7. Update and Draw Flowing Order Particles
      orders.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // When nearing center core, converge toward it
        if (p.x > width * 0.32 && p.x < coreX) {
          const dy = yCoreLane - p.y;
          p.y += dy * 0.055;
        }

        // Crossing boundary reached!
        if (p.x >= coreX - 10) {
          if (idx % 4 === 0) {
            triggerMatchBurst(coreX, yCoreLane);
          }
          // Reset particle to left
          p.x = 24 + Math.random() * 50;
          p.y = p.side === "buy" ? yBuyLane + (Math.random() - 0.5) * 30 : ySellLane + (Math.random() - 0.5) * 30;
        }

        const isBuy = p.side === "buy";

        // Draw particle dot with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isBuy ? "#34D399" : "#F43F5E";
        ctx.shadowColor = isBuy ? "#34D399" : "#F43F5E";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw badge box for order label
        if (idx % 3 === 0) {
          const badgeWidth = 94;
          const badgeHeight = 20;
          const bx = p.x - badgeWidth * 0.5;
          const by = isBuy ? p.y - 26 : p.y + 10;

          ctx.fillStyle = "rgba(15, 12, 26, 0.9)";
          ctx.strokeStyle = isBuy ? "rgba(52, 211, 153, 0.45)" : "rgba(244, 63, 94, 0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx, by, badgeWidth, badgeHeight, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isBuy ? "#A7F3D0" : "#FECDD3";
          ctx.font = "bold 8.5px ui-monospace, SFMono-Regular, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${p.address} ${p.amount}`, bx + badgeWidth * 0.5, by + badgeHeight * 0.5);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = "left";
        }
      });

      // 8. Residual Outflow to Right (Only Imbalance Touches External AMM)
      const outflowStartX = coreX + 86;
      const outflowEndX = width - 40;

      if (principles.residualRouting) {
        // Stream of matched private balances (settling back into shielded pool)
        ctx.beginPath();
        ctx.setLineDash([4, 5]);
        ctx.moveTo(outflowStartX, yCoreLane - 12);
        ctx.lineTo(outflowEndX - 160, yCoreLane - 12);
        ctx.strokeStyle = "rgba(52, 211, 153, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stream of net imbalance to external venue
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(outflowStartX, yCoreLane + 12);
        ctx.lineTo(outflowEndX - 160, yCoreLane + 12);
        ctx.strokeStyle = "rgba(201, 162, 255, 0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // External DEX Terminal Card
        const dexCardWidth = 150;
        const dexCardHeight = 66;
        const dexCardX = outflowEndX - dexCardWidth;
        const dexCardY = yCoreLane - dexCardHeight * 0.5;

        ctx.fillStyle = "rgba(18, 13, 32, 0.96)";
        ctx.strokeStyle = "rgba(201, 162, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(dexCardX, dexCardY, dexCardWidth, dexCardHeight, 14);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(235, 221, 255, 0.7)";
        ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
        ctx.fillText("ROBINHOOD AMM ADAPTER", dexCardX + dexCardWidth * 0.5, dexCardY + 18);

        ctx.fillStyle = "#C9A2FF";
        ctx.font = "bold 13px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(`NET $${currentPairData.imbalanceVolume.toLocaleString()}`, dexCardX + dexCardWidth * 0.5, dexCardY + 36);

        ctx.fillStyle = "#34D399";
        ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
        ctx.fillText("1 Single Aggregate Swap", dexCardX + dexCardWidth * 0.5, dexCardY + 52);
        ctx.textAlign = "left";
      }

      // 9. Render Match Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.95;
        s.vy *= 0.95;
        s.life++;

        const progress = s.life / s.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.2 * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [principles, selectedPair, currentPairData]);

  // Gauge color calculation
  const gaugeColor =
    metrics.mevScore >= 80
      ? "#10B981"
      : metrics.mevScore >= 50
      ? "#38BDF8"
      : metrics.mevScore >= 25
      ? "#F59E0B"
      : "#EF4444";

  const gaugeStrokeDash = 2 * Math.PI * 38;
  const strokeDashoffset = gaugeStrokeDash * (1 - metrics.mevScore / 100);

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
              href="/app/trade"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <span>← Back to Trade</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Batch auction math
          </h1>
          <div>
            <button
              type="button"
              onClick={() => setIsAboutModelOpen(true)}
              className="mt-1 inline-flex items-center rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white uppercase cursor-pointer"
            >
              ABOUT THE FORMULA
            </button>
          </div>
        </div>

        {/* CENTER METRIC PILLS */}
        <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">PAIR</span>
            <span className="font-bold font-mono text-white">{currentPairData.pairName}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">UNIFORM PRICE</span>
            <span className="font-bold font-mono text-[var(--lilac)]">${currentPairData.referencePrice.toFixed(2)}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">NETTED RATIO</span>
            <span className="font-bold font-mono text-emerald-400">{currentPairData.crossPct}%</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">SAVED SLIPPAGE</span>
            <span className="font-bold font-mono text-emerald-400">{metrics.effectiveSavings}</span>
          </div>
        </div>

        {/* RIGHT: CIRCULAR GAUGE MEV PROTECTION */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
            MEV RESISTANCE
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
                {metrics.mevScore}%
              </span>
              <span className="text-[9px] font-bold text-[var(--text-dimmer)] uppercase">
                {metrics.mevScore === 100 ? "IMMUNE" : "EXPOSED"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* FULL-VIEW MAIN CANVAS SIMULATOR */}
      <main className="relative flex-1 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full block cursor-crosshair"
          title="Click anywhere to trigger wave settlement spark burst"
        />

        {/* FLOATING EXPLAINER CARD OVER CANVAS */}
        <div className="absolute bottom-6 left-6 z-20 max-w-[590px] w-[calc(100%-3rem)] sm:w-auto rounded-2xl border border-white/10 bg-[#0c0916]/95 p-4.5 shadow-2xl backdrop-blur-xl transition-all">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Left Diagram: 3D Isometric SVG Graphic */}
            <div className="relative rounded-xl border border-white/10 bg-black/50 p-3 sm:w-[220px] shrink-0 overflow-hidden">
              <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
                <span>{principles.internalCrossing ? "HOW IT'S NETTED" : "CONTINUOUS AMM"}</span>
              </div>

              {/* 3D Isometric SVG Graphic */}
              <div className="mt-3 flex items-center justify-center">
                <svg viewBox="0 0 190 70" className="w-full h-auto overflow-visible">
                  {/* Buy Pool Box */}
                  <g transform="translate(6, 6)">
                    <rect x="0" y="0" width="36" height="20" rx="4" fill="#0e2417" stroke="#10b981" strokeWidth="1" />
                    <text x="18" y="11" fill="#6ee7b7" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">BUYS</text>
                    <text x="18" y="17" fill="#34d399" fontSize="5.5" fontFamily="monospace" textAnchor="middle">${(currentPairData.buyVolume / 1000).toFixed(0)}k</text>
                  </g>

                  {/* Sell Pool Box */}
                  <g transform="translate(6, 40)">
                    <rect x="0" y="0" width="36" height="20" rx="4" fill="#291017" stroke="#f43f5e" strokeWidth="1" />
                    <text x="18" y="11" fill="#fda4af" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SELLS</text>
                    <text x="18" y="17" fill="#fb7185" fontSize="5.5" fontFamily="monospace" textAnchor="middle">${(currentPairData.sellVolume / 1000).toFixed(0)}k</text>
                  </g>

                  {/* Flow Arrows -> Core */}
                  <path d="M 44 16 L 68 28" stroke="rgba(52, 211, 153, 0.6)" strokeWidth="1" strokeDasharray="2,2" />
                  <path d="M 44 50 L 68 38" stroke="rgba(244, 63, 94, 0.6)" strokeWidth="1" strokeDasharray="2,2" />

                  {/* Center Cylindrical Batch Engine */}
                  <g transform="translate(95, 33)">
                    <ellipse cx="0" cy="8" rx="24" ry="9" fill="rgba(156,72,240,0.22)" />
                    <path d="M -22 0 C -22 6, 22 6, 22 0 L 22 7 C 22 13, -22 13, -22 7 Z" fill="url(#coreGrad)" />
                    <ellipse cx="0" cy="0" rx="22" ry="7" fill="#1c1335" stroke="#9C48F0" strokeWidth="1" />
                    <circle cx="-10" cy="-1" r="1.2" fill="#34d399" />
                    <circle cx="10" cy="-1" r="1.2" fill="#fb7185" />
                    <text x="0" y="2.5" fill="#EBDDFF" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.4">WAVE #185</text>
                  </g>

                  {/* Flow Arrow -> Crossed Result */}
                  <path d="M 120 31 L 138 21" stroke="#34d399" strokeWidth="1" strokeDasharray="2,2" />
                  <polygon points="140,20 135,19 137,23" fill="#34d399" />

                  {/* Flow Arrow -> Imbalance to AMM */}
                  <path d="M 120 35 L 138 45" stroke="#C9A2FF" strokeWidth="1" strokeDasharray="2,2" />
                  <polygon points="140,46 137,43 135,47" fill="#C9A2FF" />

                  {/* Crossed Match Box */}
                  <g transform="translate(142, 8)">
                    <rect x="0" y="0" width="44" height="22" rx="4" fill="#0d241d" stroke="#34d399" strokeWidth="1" />
                    <text x="22" y="10" fill="#a7f3d0" fontSize="6" fontWeight="bold" textAnchor="middle">CROSSED</text>
                    <text x="22" y="18" fill="#34d399" fontSize="6" fontFamily="monospace" textAnchor="middle">0 SLIPPAGE</text>
                  </g>

                  {/* External Imbalance Swap Box */}
                  <g transform="translate(142, 38)">
                    <rect x="0" y="0" width="44" height="22" rx="4" fill="#1b122c" stroke="#9C48F0" strokeWidth="1" />
                    <text x="22" y="10" fill="#e9d5ff" fontSize="6" fontWeight="bold" textAnchor="middle">NET AMM</text>
                    <text x="22" y="18" fill="#c084fc" fontSize="6" fontFamily="monospace" textAnchor="middle">${(currentPairData.imbalanceVolume / 1000).toFixed(0)}k SWAP</text>
                  </g>

                  <defs>
                    <linearGradient id="coreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b1768" />
                      <stop offset="100%" stopColor="#140a24" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Explainer Text Content */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--lilac)]">
                {activeStep === 1
                  ? "PRINCIPLE 1: INTERNAL CROSSING"
                  : activeStep === 2
                  ? "PRINCIPLE 2: UNIFORM CLEARING PRICE"
                  : activeStep === 3
                  ? "PRINCIPLE 3: 15-MIN BATCH WINDOW"
                  : activeStep === 4
                  ? "PRINCIPLE 4: RESIDUAL IMBALANCE ROUTING"
                  : activeStep === 5
                  ? "PRINCIPLE 5: 0.05% NETTING FEE SAVINGS"
                  : "BATCH AUCTION MECHANICS"}
              </span>

              <h2 className="text-base font-bold tracking-tight text-white leading-snug">
                {activeStep === 1
                  ? "Buys and sells cross with zero market impact"
                  : activeStep === 2
                  ? "All participants receive the exact same price"
                  : activeStep === 3
                  ? "Discrete wave windows eliminate MEV sandwich attacks"
                  : activeStep === 4
                  ? "Only net imbalance touches external liquidity"
                  : activeStep === 5
                  ? "Save 83% in trading fees vs standard AMMs"
                  : metrics.mevScore === 100
                  ? "Complete MEV immunity & zero internal slippage"
                  : "Toggle principles below to see how batch math protects you"}
              </h2>

              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                {activeStep === 1
                  ? `In continuous AMMs, every swap moves the price curve. In Spectre, $${currentPairData.matchedVolume.toLocaleString()} of bids and asks cancel each other out peer-to-peer at 0.00% slippage.`
                  : activeStep === 2
                  ? "Continuous DEXs allow searchers to frontrun and sandwich. Spectre calculates a single Uniform Clearing Price where supply equals demand, leaving zero profit for sandwich bots."
                  : activeStep === 3
                  ? "Orders collect silently inside the shielded pool over 15-minute intervals. Time priority is eliminated, neutralizing latency games and priority gas auctions."
                  : activeStep === 4
                  ? `Only the net unmatched residual ($${currentPairData.imbalanceVolume.toLocaleString()}) routes to Robinhood Chain DEX as a single aggregate transaction. Your individual trade is never exposed.`
                  : activeStep === 5
                  ? "Spectre charges a 0.05% netting fee on internally crossed volume, compared to 0.30% typical LP fees on Uniswap. Net savings stay with the traders."
                  : "Batch auctions pool buy and sell orders into discrete 15-minute waves. Internal crossing matches opposing intents at zero slippage, with uniform execution and zero MEV extraction."}
              </p>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] px-5 py-2 text-xs font-extrabold text-black shadow-[0_4px_16px_rgba(204,255,0,0.35)] transition-all cursor-pointer active:scale-95"
                >
                  {activeStep === 0
                    ? "START"
                    : activeStep === 5
                    ? "RESET SIMULATOR"
                    : "NEXT PRINCIPLE →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DOCKED BOTTOM CONTROL DECK */}
      <footer className="shrink-0 w-full border-t border-white/5 bg-[#0a0714]/95 px-6 pb-4 pt-3 backdrop-blur-md z-10">
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

          {/* 5 Principle Toggles */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* 1. Internal Crossing */}
            <button
              type="button"
              onClick={() => togglePrinciple("internalCrossing")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.internalCrossing
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.internalCrossing ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.internalCrossing ? "✓" : "1"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Internal crossing</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  0 slippage match
                </span>
              </div>
            </button>

            {/* 2. Uniform Price */}
            <button
              type="button"
              onClick={() => togglePrinciple("uniformClearing")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.uniformClearing
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.uniformClearing ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.uniformClearing ? "✓" : "2"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Uniform price</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  single clearing rate
                </span>
              </div>
            </button>

            {/* 3. 15m Batch Wave */}
            <button
              type="button"
              onClick={() => togglePrinciple("batchWindow")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.batchWindow
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.batchWindow ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.batchWindow ? "✓" : "3"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">15m batch wave</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  zero MEV / sandwich
                </span>
              </div>
            </button>

            {/* 4. Residual Routing */}
            <button
              type="button"
              onClick={() => togglePrinciple("residualRouting")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.residualRouting
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.residualRouting ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.residualRouting ? "✓" : "4"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Residual routing</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  imbalance to AMM
                </span>
              </div>
            </button>

            {/* 5. 0.05% Netting Fee */}
            <button
              type="button"
              onClick={() => togglePrinciple("nettingFee")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.nettingFee
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.nettingFee ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.nettingFee ? "✓" : "5"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">0.05% Netting fee</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  83% cheaper than AMM
                </span>
              </div>
            </button>
          </div>

          {/* Pair selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
              SIMULATE PAIR:
            </span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["USDG_NVDA", "USDG_ETH", "USDG_TSLA"] as const).map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setSelectedPair(pKey)}
                  className={`rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedPair === pKey
                      ? "bg-[var(--ultra)] text-white shadow-xs"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {PAIR_METRICS[pKey].symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ABOUT THE FORMULA MODAL POPUP */}
      {isAboutModelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsAboutModelOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#140F26] p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">About Batch Auction Math & Mechanics</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Discrete time uniform clearing price & internal netting derivation
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
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">1. Internal Netting Formula</h4>
                <p className="mt-1">
                  Within each 15-minute wave window, total buy volume and total sell volume for an asset pair are summed:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  V_matched = min(∑ Buys, ∑ Sells)<br />
                  Imbalance = |∑ Buys - ∑ Sells|
                </div>
                <p>
                  The matched volume <code className="text-emerald-400">V_matched</code> crosses internally with zero market impact and 0.00% price slippage.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">2. Uniform Clearing Price (UCP)</h4>
                <p className="mt-1">
                  In a continuous AMM (Uniswap), each transaction moves the price, allowing arbitrageurs to sandwich users. Spectre executes all fills inside a wave at a single uniform clearing price P*:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  P* = Equilibrium price where Q_demand(P*) = Q_supply(P*)
                </div>
                <p>
                  No order gets a worse price due to placement sequence. Time priority is completely neutralized.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">3. Pro-Rata Partial Fills (Invariant)</h4>
                <p className="mt-1">
                  If the wave has an imbalance, fills are determined deterministically according to pro-rata participation:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  userFill = userRequested × totalFilled / totalRequested
                </div>
                <p>
                  This guarantees mathematical fairness without operator discretion or miner bribery.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">4. Fee Advantage vs Standard Pools</h4>
                <p className="mt-1">
                  Standard DEX liquidity pools charge a 0.30% fee on total volume. Spectre charges only a 0.05% netting fee on internally matched volume, passing an 83% fee discount back to traders.
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
