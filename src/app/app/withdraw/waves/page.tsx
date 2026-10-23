"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose } from "@/components/app/Icons";

interface CloudParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  depth: number;
}

interface ExitBeam {
  x: number;
  progress: number;
  speed: number;
  wallet: string;
  amount: string;
}

interface WaveSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const BUCKET_OPTIONS = {
  "0.1_ETH": {
    label: "0.1 ETH",
    amount: "0.1 ETH",
    usdValue: "$325",
    asset: "ETH",
    anonymityK: 24,
    linkChance: 0,
  },
  "0.5_ETH": {
    label: "0.5 ETH",
    amount: "0.5 ETH",
    usdValue: "$1,625",
    asset: "ETH",
    anonymityK: 16,
    linkChance: 0,
  },
  "1.0_ETH": {
    label: "1.0 ETH",
    amount: "1.0 ETH",
    usdValue: "$3,250",
    asset: "ETH",
    anonymityK: 12,
    linkChance: 0,
  },
  "2.5_ETH": {
    label: "2.5 ETH",
    amount: "2.5 ETH",
    usdValue: "$8,125",
    asset: "ETH",
    anonymityK: 8,
    linkChance: 4,
  },
} as const;

export default function WithdrawalWavesPage() {
  const [principles, setPrinciples] = useState({
    standardBucket: true,
    waveRelease: true,
    cleanAddress: true,
    timeDelay: true,
    splitVolume: true,
  });

  const [selectedBucket, setSelectedBucket] = useState<keyof typeof BUCKET_OPTIONS>("0.1_ETH");
  const [isAboutModelOpen, setIsAboutModelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentBucket = BUCKET_OPTIONS[selectedBucket];

  // Calculate Unlinkability Score (0% - 100%)
  const calculateUnlinkability = () => {
    let score = 0;
    if (principles.cleanAddress) score += 35;
    if (principles.standardBucket) score += 25;
    if (principles.waveRelease) score += 20;
    if (principles.timeDelay) score += 10;
    if (principles.splitVolume) score += 10;

    return {
      unlinkScore: Math.min(100, Math.max(0, score)),
      kAnonymity: principles.standardBucket ? currentBucket.anonymityK : 1,
      linkProbability: principles.standardBucket ? `${(100 / currentBucket.anonymityK).toFixed(1)}%` : "100%",
    };
  };

  const metrics = calculateUnlinkability();

  const togglePrinciple = (key: keyof typeof principles) => {
    setPrinciples((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      setPrinciples({
        cleanAddress: true,
        standardBucket: false,
        waveRelease: false,
        timeDelay: false,
        splitVolume: false,
      });
      setActiveStep(1);
    } else if (activeStep === 1) {
      setPrinciples((p) => ({ ...p, standardBucket: true }));
      setActiveStep(2);
    } else if (activeStep === 2) {
      setPrinciples((p) => ({ ...p, waveRelease: true }));
      setActiveStep(3);
    } else if (activeStep === 3) {
      setPrinciples((p) => ({ ...p, timeDelay: true }));
      setActiveStep(4);
    } else if (activeStep === 4) {
      setPrinciples((p) => ({ ...p, splitVolume: true }));
      setActiveStep(5);
    } else {
      setPrinciples({
        cleanAddress: false,
        standardBucket: false,
        waveRelease: false,
        timeDelay: false,
        splitVolume: false,
      });
      setActiveStep(0);
    }
  };

  // High-Fidelity Anonymity Funnel & Wave Release Canvas Simulation
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

    // 1. Swirling Anonymous Pool Cloud Particles (Top Area)
    const cloudParticles: CloudParticle[] = Array.from({ length: 95 }).map(() => ({
      x: Math.random() * width,
      y: 20 + Math.random() * (height * 0.30),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.25,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.55,
      depth: Math.random(),
    }));

    // 2. Synchronized Exit Beams (Passing through center shutter into bottom wallets)
    const cleanWallets = ["0x8D..4e2b", "0x19..d4", "0x55..fe", "0xaa..02", "0x31..9c", "0x7e..6a"];
    const exitBeams: ExitBeam[] = Array.from({ length: 6 }).map((_, i) => ({
      x: width * (0.20 + i * 0.12),
      progress: (i / 6) + Math.random() * 0.1,
      speed: 0.005 + Math.random() * 0.003,
      wallet: cleanWallets[i % cleanWallets.length],
      amount: currentBucket.amount,
    }));

    const sparks: WaveSpark[] = [];
    let releaseFlash = 0;

    const triggerWaveRelease = (cx: number, cy: number) => {
      releaseFlash = 1.0;
      for (let i = 0; i < 40; i++) {
        const ang = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.3;
        const spd = 2.8 + Math.random() * 4.8;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 45 + Math.random() * 22,
          color: Math.random() > 0.45 ? "#C9A2FF" : "#34D399",
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerWaveRelease(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const yCloudBottom = height * 0.30;
      const yShutter = height * 0.50;
      const yWallets = height * 0.78;
      const centerX = width * 0.50;

      // 1. Futuristic Background Grid & Anonymity Depth Lines
      ctx.strokeStyle = "rgba(156, 72, 240, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Horizontal Zone Dividers with Time Ticks
      ctx.beginPath();
      ctx.moveTo(0, yCloudBottom);
      ctx.lineTo(width, yCloudBottom);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, yShutter + 40);
      ctx.lineTo(width, yShutter + 40);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.stroke();

      // Top Zone Label: Anonymous Cloud
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(201, 162, 255, 0.75)";
      ctx.fillText("SHARED SHIELDED POOL (ANONYMOUS CLOUD RESERVOIR)", 28, 24);

      // Center Zone Label: Wave Shutter
      ctx.fillStyle = "rgba(156, 72, 240, 0.85)";
      ctx.fillText("15-MINUTE SYNCHRONIZED WAVE SHUTTER (WAVE #48)", 28, yCloudBottom + 24);

      // Bottom Zone Label: Clean Destination Wallets
      ctx.fillStyle = "rgba(52, 211, 153, 0.75)";
      ctx.fillText("CLEAN RECIPIENT WALLETS — K-ANONYMITY BUCKET OUTPUT", 28, yShutter + 62);

      // 3. Render Swirling Anonymous Cloud Particles
      for (const p of cloudParticles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 10) p.y = yCloudBottom - 10;
        if (p.y > yCloudBottom) p.y = 15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(156, 72, 240, ${p.alpha})`;
        ctx.shadowColor = "#9C48F0";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Render Funnel Stream Lines (Converging from Cloud to Center Shutter)
      ctx.beginPath();
      ctx.moveTo(width * 0.15, yCloudBottom);
      ctx.bezierCurveTo(width * 0.25, yShutter - 30, centerX - 140, yShutter - 30, centerX - 110, yShutter);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width * 0.85, yCloudBottom);
      ctx.bezierCurveTo(width * 0.75, yShutter - 30, centerX + 140, yShutter - 30, centerX + 110, yShutter);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Render Center 15-Minute Wave Release Shutter Chamber
      releaseFlash = Math.max(0, releaseFlash - 0.025);
      const wavePulse = (Math.sin(elapsed * 3.5) + 1) * 0.5;

      // Radial Glow behind Shutter
      const sGlow = ctx.createRadialGradient(centerX, yShutter, 0, centerX, yShutter, 150);
      sGlow.addColorStop(0, `rgba(156, 72, 240, ${0.28 + releaseFlash * 0.45 + wavePulse * 0.06})`);
      sGlow.addColorStop(0.7, "rgba(156, 72, 240, 0.04)");
      sGlow.addColorStop(1, "rgba(156, 72, 240, 0)");
      ctx.fillStyle = sGlow;
      ctx.fillRect(centerX - 150, yShutter - 150, 300, 300);

      // Shutter Outer Ring
      ctx.beginPath();
      ctx.arc(centerX, yShutter, 56 + wavePulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 162, 255, ${0.35 + releaseFlash * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shutter Core Disc Card
      ctx.fillStyle = "rgba(16, 11, 28, 0.96)";
      ctx.strokeStyle = principles.waveRelease ? "#9C48F0" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(centerX - 92, yShutter - 38, 184, 76, 20);
      ctx.fill();
      ctx.stroke();

      // Shutter Core Content
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(principles.waveRelease ? "SYNCHRONIZED WAVE SHUTTER" : "IMMEDIATE UNPOOLED EXIT", centerX, yShutter - 18);

      ctx.fillStyle = principles.standardBucket ? "#34D399" : "#F43F5E";
      ctx.font = "bold 15px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(
        principles.standardBucket
          ? `BUCKET: ${currentBucket.amount}`
          : "ODD AMOUNT (LINKABLE)",
        centerX,
        yShutter + 2
      );

      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(
        `K-Anonymity = ${metrics.kAnonymity} peers in Wave #48`,
        centerX,
        yShutter + 18
      );

      ctx.fillStyle = "rgba(235, 221, 255, 0.6)";
      ctx.font = "9px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(
        `Link Probability: ${metrics.linkProbability} · 0.0% Fee`,
        centerX,
        yShutter + 30
      );

      // 6. Render Output Diverging Streams from Center Shutter to Clean Wallets
      exitBeams.forEach((beam, bIdx) => {
        beam.progress += beam.speed;
        if (beam.progress >= 1.0) {
          beam.progress = 0;
          if (bIdx % 2 === 0) triggerWaveRelease(beam.x, yWallets);
        }

        // Connecting curve from Shutter bottom to Wallet Node
        ctx.beginPath();
        ctx.moveTo(centerX, yShutter + 38);
        ctx.bezierCurveTo(centerX + (beam.x - centerX) * 0.4, yShutter + 70, beam.x, yShutter + 70, beam.x, yWallets - 20);
        ctx.strokeStyle = principles.cleanAddress ? "rgba(52, 211, 153, 0.25)" : "rgba(244, 63, 94, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pulsing exit particle moving down
        const t = beam.progress;
        const p0x = centerX;
        const p0y = yShutter + 38;
        const p1x = centerX + (beam.x - centerX) * 0.4;
        const p1y = yShutter + 70;
        const p2x = beam.x;
        const p2y = yWallets - 20;

        const bx = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
        const by = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;

        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = principles.cleanAddress ? "#34D399" : "#F43F5E";
        ctx.shadowColor = principles.cleanAddress ? "#34D399" : "#F43F5E";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Clean Destination Wallet Cards
        const cardW = 86;
        const cardH = 46;
        const cx = beam.x - cardW * 0.5;
        const cy = yWallets - 10;

        ctx.fillStyle = "rgba(16, 12, 30, 0.94)";
        ctx.strokeStyle = principles.cleanAddress ? "rgba(52, 211, 153, 0.35)" : "rgba(244, 63, 94, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cardW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = principles.cleanAddress ? "#6EE7B7" : "#FDA4AF";
        ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
        ctx.fillText(principles.cleanAddress ? "CLEAN WALLET" : "SAME WALLET", beam.x, cy + 14);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 9.5px ui-monospace, monospace";
        ctx.fillText(principles.cleanAddress ? beam.wallet : "0x3F..9a1c", beam.x, cy + 27);

        ctx.fillStyle = "#34D399";
        ctx.font = "bold 9px ui-monospace, monospace";
        ctx.fillText(`+${currentBucket.amount}`, beam.x, cy + 39);
      });

      // 7. Bottom Public Chain Heuristics Radar Scanner
      const radarY = height - 52;
      ctx.beginPath();
      ctx.moveTo(24, radarY);
      ctx.lineTo(width - 24, radarY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const radarSweep = (elapsed * 0.15) % 1.0;
      const rx = 24 + radarSweep * (width - 48);

      const radGrad = ctx.createLinearGradient(rx - 80, 0, rx + 80, 0);
      radGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      radGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.2)");
      radGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(rx - 80, radarY - 20, 160, 40);

      ctx.textAlign = "left";
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillStyle = "rgba(235, 221, 255, 0.5)";
      ctx.fillText("ONCHAIN GRAPH HEURISTICS SCANNER", 32, radarY + 22);

      ctx.textAlign = "right";
      ctx.fillStyle = metrics.unlinkScore === 100 ? "#34D399" : "#F59E0B";
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(
        metrics.unlinkScore === 100
          ? "✓ ZERO GRAPH CORRELATION · TEMPORAL LINK SEVERED"
          : "⚠ PARTIAL HEURISTICS LEAK · ACTIVATE STANDARD BUCKETS",
        width - 32,
        radarY + 22
      );

      // 8. Render Wave Sparks
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
  }, [principles, selectedBucket, currentBucket, metrics]);

  // Gauge calculation
  const gaugeColor =
    metrics.unlinkScore >= 80
      ? "#10B981"
      : metrics.unlinkScore >= 50
      ? "#38BDF8"
      : metrics.unlinkScore >= 25
      ? "#F59E0B"
      : "#EF4444";

  const gaugeStrokeDash = 2 * Math.PI * 38;
  const strokeDashoffset = gaugeStrokeDash * (1 - metrics.unlinkScore / 100);

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
              href="/app/withdraw"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <span>← Back to Withdraw</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Withdrawal waves & anonymity sets
          </h1>
          <div>
            <button
              type="button"
              onClick={() => setIsAboutModelOpen(true)}
              className="mt-1 inline-flex items-center rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white uppercase cursor-pointer"
            >
              ABOUT WAVE MIXING
            </button>
          </div>
        </div>

        {/* CENTER METRIC PILLS */}
        <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">WAVE</span>
            <span className="font-bold font-mono text-[var(--lilac)]">Wave #48 Live</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">ANONYMITY SET</span>
            <span className="font-bold font-mono text-emerald-400">K = {metrics.kAnonymity} Peers</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">BUCKET</span>
            <span className="font-bold font-mono text-white">{currentBucket.amount} ({currentBucket.usdValue})</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">LINK CHANCE</span>
            <span className="font-bold font-mono text-emerald-400">{metrics.linkProbability}</span>
          </div>
        </div>

        {/* RIGHT: CIRCULAR GAUGE UNLINKABILITY */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
            UNLINKABILITY
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
                {metrics.unlinkScore}%
              </span>
              <span className="text-[9px] font-bold text-[var(--text-dimmer)] uppercase">
                {metrics.unlinkScore === 100 ? "UNLINKED" : "LINKED"}
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
          title="Click anywhere to trigger wave release spark burst"
        />

        {/* FLOATING EXPLAINER CARD OVER CANVAS */}
        <div className="absolute bottom-6 left-6 z-20 max-w-[590px] w-[calc(100%-3rem)] sm:w-auto rounded-2xl border border-white/10 bg-[#0c0916]/95 p-4.5 shadow-2xl backdrop-blur-xl transition-all">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Left Diagram: 3D Isometric SVG Graphic */}
            <div className="relative rounded-xl border border-white/10 bg-black/50 p-3 sm:w-[220px] shrink-0 overflow-hidden">
              <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
                <span>{principles.waveRelease ? "SYNCHRONIZED BATCH WAVE" : "UNBATCHED LEAK"}</span>
              </div>

              {/* 3D Isometric SVG Graphic */}
              <div className="mt-3 flex items-center justify-center">
                <svg viewBox="0 0 190 70" className="w-full h-auto overflow-visible">
                  {/* Anonymous Pool Cylinder */}
                  <g transform="translate(95, 12)">
                    <ellipse cx="0" cy="5" rx="30" ry="8" fill="rgba(156,72,240,0.22)" />
                    <path d="M -26 0 C -26 5, 26 5, 26 0 L 26 6 C 26 11, -26 11, -26 6 Z" fill="url(#poolVGrad)" />
                    <ellipse cx="0" cy="0" rx="26" ry="6" fill="#1c1335" stroke="#9C48F0" strokeWidth="1" />
                    <text x="0" y="2" fill="#EBDDFF" fontSize="5.5" fontWeight="bold" textAnchor="middle">ANONYMOUS POOL</text>
                  </g>

                  {/* Flow Arrow -> Wave Shutter */}
                  <path d="M 95 24 L 95 34" stroke="rgba(201, 162, 255, 0.6)" strokeWidth="1" strokeDasharray="2,2" />

                  {/* Wave Shutter Disc */}
                  <g transform="translate(95, 38)">
                    <ellipse cx="0" cy="0" rx="24" ry="7" fill="#140F26" stroke="#C9A2FF" strokeWidth="1" />
                    <text x="0" y="2" fill="#34D399" fontSize="5.5" fontWeight="bold" textAnchor="middle">WAVE #48</text>
                  </g>

                  {/* Diverging Paths to 3 Clean Wallets */}
                  <path d="M 80 44 L 40 56" stroke="#34d399" strokeWidth="0.8" strokeDasharray="2,2" />
                  <path d="M 95 44 L 95 56" stroke="#34d399" strokeWidth="0.8" strokeDasharray="2,2" />
                  <path d="M 110 44 L 150 56" stroke="#34d399" strokeWidth="0.8" strokeDasharray="2,2" />

                  {/* Output Wallets */}
                  <g transform="translate(40, 58)">
                    <rect x="-16" y="0" width="32" height="12" rx="2" fill="#0d241d" stroke="#34d399" strokeWidth="0.8" />
                    <text x="0" y="8" fill="#6ee7b7" fontSize="4.5" textAnchor="middle">0x8D..4e2b</text>
                  </g>
                  <g transform="translate(95, 58)">
                    <rect x="-16" y="0" width="32" height="12" rx="2" fill="#0d241d" stroke="#34d399" strokeWidth="0.8" />
                    <text x="0" y="8" fill="#6ee7b7" fontSize="4.5" textAnchor="middle">0x19..d4</text>
                  </g>
                  <g transform="translate(150, 58)">
                    <rect x="-16" y="0" width="32" height="12" rx="2" fill="#0d241d" stroke="#34d399" strokeWidth="0.8" />
                    <text x="0" y="8" fill="#6ee7b7" fontSize="4.5" textAnchor="middle">0x55..fe</text>
                  </g>

                  <defs>
                    <linearGradient id="poolVGrad" x1="0" y1="0" x2="0" y2="1">
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
                  ? "PRINCIPLE 1: FRESH DESTINATION ADDRESS"
                  : activeStep === 2
                  ? "PRINCIPLE 2: UNIFORM ANONYMITY BUCKETS"
                  : activeStep === 3
                  ? "PRINCIPLE 3: 15-MINUTE WAVE TIMING"
                  : activeStep === 4
                  ? "PRINCIPLE 4: TEMPORAL DELAY BUFFER"
                  : activeStep === 5
                  ? "PRINCIPLE 5: VOLUME SPLITTING (MULTI-HOP)"
                  : "WITHDRAWAL PRIVACY MECHANICS"}
              </span>

              <h2 className="text-base font-bold tracking-tight text-white leading-snug">
                {activeStep === 1
                  ? "Always withdraw to a clean, unlinked destination wallet"
                  : activeStep === 2
                  ? "Standard bucket sizes blend perfectly into identical exits"
                  : activeStep === 3
                  ? "Exits release simultaneously in waves to sever time correlation"
                  : activeStep === 4
                  ? "Waiting across multiple waves dissolves chronological patterns"
                  : activeStep === 5
                  ? "Splitting large exits into smaller buckets maximizes entropy"
                  : metrics.unlinkScore === 100
                  ? "100% unlinked withdrawal & zero onchain trace"
                  : "Toggle principles below to see how wave batching protects you"}
              </h2>

              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                {activeStep === 1
                  ? "Withdrawing to the same wallet you used to deposit immediately links your address onchain. Always withdraw to a fresh, unfunded address."
                  : activeStep === 2
                  ? `Withdrawing odd numbers creates a unique fingerprint. By choosing standard denominations like ${currentBucket.amount}, your transaction is mathematically indistinguishable from ${currentBucket.anonymityK} other withdrawals.`
                  : activeStep === 3
                  ? "If a withdrawal occurs seconds after a deposit, chain analysts correlate the timing. Batching exits into 15-minute waves groups all exits into a single block release."
                  : activeStep === 4
                  ? "Holding your assets in the shielded pool for several hours or days before exiting completely severs time-of-day heuristic clustering."
                  : activeStep === 5
                  ? "Large balances should be exited as 2 to 5 separate standard buckets staggered across different wave intervals to disrupt graph analysis."
                  : "Withdrawals exit through synchronized 15-minute waves. By using standard denomination buckets and clean destination wallets, deposit-to-withdrawal linkability is mathematically destroyed."}
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
            {/* 1. Clean Destination */}
            <button
              type="button"
              onClick={() => togglePrinciple("cleanAddress")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.cleanAddress
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.cleanAddress ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.cleanAddress ? "✓" : "1"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Clean destination</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  fresh unlinked wallet
                </span>
              </div>
            </button>

            {/* 2. Standard Bucket */}
            <button
              type="button"
              onClick={() => togglePrinciple("standardBucket")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.standardBucket
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.standardBucket ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.standardBucket ? "✓" : "2"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Standard bucket</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  hide in equal amounts
                </span>
              </div>
            </button>

            {/* 3. 15m Wave Release */}
            <button
              type="button"
              onClick={() => togglePrinciple("waveRelease")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.waveRelease
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.waveRelease ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.waveRelease ? "✓" : "3"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">15m wave release</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  batch exit in 1 block
                </span>
              </div>
            </button>

            {/* 4. Time Delay Buffer */}
            <button
              type="button"
              onClick={() => togglePrinciple("timeDelay")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.timeDelay
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.timeDelay ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.timeDelay ? "✓" : "4"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Time delay</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  wait across waves
                </span>
              </div>
            </button>

            {/* 5. Split Volume */}
            <button
              type="button"
              onClick={() => togglePrinciple("splitVolume")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.splitVolume
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.splitVolume ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.splitVolume ? "✓" : "5"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Split volume</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  multi-hop staggered
                </span>
              </div>
            </button>
          </div>

          {/* Bucket selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
              SELECT BUCKET:
            </span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["0.1_ETH", "0.5_ETH", "1.0_ETH", "2.5_ETH"] as const).map((bKey) => (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => setSelectedBucket(bKey)}
                  className={`rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedBucket === bKey
                      ? "bg-[var(--ultra)] text-white shadow-xs"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {BUCKET_OPTIONS[bKey].amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ABOUT WAVE MIXING MODAL POPUP */}
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
                <h3 className="text-lg font-bold text-white">About Withdrawal Waves & Anonymity Sets</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Mathematical entropy & temporal decoupling derivation
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
                <h4 className="font-bold text-white text-sm">1. Shannon Entropy of Anonymity Sets</h4>
                <p className="mt-1">
                  The privacy level of a withdrawal is quantified by its Shannon Entropy over the set of possible deposit counterparts K:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  H(X) = -∑ (1/K) · log₂(1/K) = log₂(K) bits
                </div>
                <p>
                  When K = 16 participants exit in the identical standard denomination, an analyst faces maximal entropy with a link probability of only 6.25%.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">2. Standard Bucket Denominations</h4>
                <p className="mt-1">
                  Odd amounts (e.g., withdrawing 1.2345 ETH) destroy anonymity sets because only one user deposited that exact number. Standard buckets (0.1, 0.5, 1.0, 2.5 ETH) ensure every withdrawal has dozens of identical counterparts.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">3. Temporal Decoupling (15-Minute Waves)</h4>
                <p className="mt-1">
                  Rather than releasing funds immediately, withdrawals accumulate silently inside the pool and execute simultaneously in synchronized wave blocks. This severs all timestamp correlation between deposits and exits.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">4. Address Graph Severing</h4>
                <p className="mt-1">
                  Depositing from Wallet A and withdrawing to Wallet B breaks all onchain graph edges. For external chain analytics, there is zero transactional link between Wallet A and Wallet B.
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
