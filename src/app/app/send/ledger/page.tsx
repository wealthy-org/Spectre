"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose } from "@/components/app/Icons";

interface DataPacket {
  progress: number;
  speed: number;
  lane: number;
  size: number;
  amount: string;
}

interface VaultHashRing {
  angle: number;
  speed: number;
  radius: number;
  hashes: string[];
}

interface ParticleSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const ASSET_DATA = {
  USDG: {
    symbol: "USDG",
    name: "Global Dollar",
    transferAmount: 1000,
    unit: "USDG",
    aliceInitial: 5000,
    bobInitial: 1200,
    totalVaultSupply: 250000,
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    transferAmount: 0.5,
    unit: "ETH",
    aliceInitial: 2.5,
    bobInitial: 0.8,
    totalVaultSupply: 140.0,
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corp",
    transferAmount: 10,
    unit: "NVDA",
    aliceInitial: 50,
    bobInitial: 15,
    totalVaultSupply: 2400,
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc",
    transferAmount: 10,
    unit: "TSLA",
    aliceInitial: 40,
    bobInitial: 8,
    totalVaultSupply: 1850,
  },
} as const;

export default function InternalLedgerPage() {
  const [principles, setPrinciples] = useState({
    internalMutation: true,
    zeroErcEvents: true,
    vaultCustodyLock: true,
    instantBlockExecution: true,
    zeroProtocolFee: true,
  });

  const [selectedAsset, setSelectedAsset] = useState<keyof typeof ASSET_DATA>("USDG");
  const [isAboutModelOpen, setIsAboutModelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAsset = ASSET_DATA[selectedAsset];

  // Calculate Privacy & Ledger Integrity Score
  const calculateIntegrity = () => {
    let score = 0;
    if (principles.internalMutation) score += 30;
    if (principles.zeroErcEvents) score += 30;
    if (principles.vaultCustodyLock) score += 20;
    if (principles.instantBlockExecution) score += 10;
    if (principles.zeroProtocolFee) score += 10;

    return {
      privacyScore: Math.min(100, Math.max(0, score)),
      emittedErcEvents: principles.zeroErcEvents ? 0 : 1,
      protocolFee: principles.zeroProtocolFee ? "0.00% (Free)" : "0.25%",
      executionSpeed: principles.instantBlockExecution ? "1 Block (~2s)" : "Delayed",
    };
  };

  const metrics = calculateIntegrity();

  const togglePrinciple = (key: keyof typeof principles) => {
    setPrinciples((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      setPrinciples({
        internalMutation: true,
        zeroErcEvents: false,
        vaultCustodyLock: false,
        instantBlockExecution: false,
        zeroProtocolFee: false,
      });
      setActiveStep(1);
    } else if (activeStep === 1) {
      setPrinciples((p) => ({ ...p, zeroErcEvents: true }));
      setActiveStep(2);
    } else if (activeStep === 2) {
      setPrinciples((p) => ({ ...p, vaultCustodyLock: true }));
      setActiveStep(3);
    } else if (activeStep === 3) {
      setPrinciples((p) => ({ ...p, instantBlockExecution: true }));
      setActiveStep(4);
    } else if (activeStep === 4) {
      setPrinciples((p) => ({ ...p, zeroProtocolFee: true }));
      setActiveStep(5);
    } else {
      setPrinciples({
        internalMutation: false,
        zeroErcEvents: false,
        vaultCustodyLock: false,
        instantBlockExecution: false,
        zeroProtocolFee: false,
      });
      setActiveStep(0);
    }
  };

  // High-End Dual-Terminal Cryptographic Vault Canvas
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

    // Cryptographic Vault Hash Rings
    const hashRings: VaultHashRing[] = [
      {
        angle: 0,
        speed: 0.4,
        radius: 95,
        hashes: ["0x7F2A", "KECCAK", "0xB41C", "STORAGE", "0x9E01", "MUTATION"],
      },
      {
        angle: Math.PI / 4,
        speed: -0.3,
        radius: 125,
        hashes: ["SLOT_0", "ALICE", "CONSERVED", "BOB", "SLOT_1", "SHIELDED"],
      },
    ];

    // Stream of encrypted data packets moving along circuit bus
    const packets: DataPacket[] = Array.from({ length: 6 }).map((_, i) => ({
      progress: (i / 6) + Math.random() * 0.1,
      speed: 0.0035 + Math.random() * 0.002,
      lane: (i % 3) - 1, // -1, 0, 1
      size: 4 + Math.random() * 2,
      amount: `${currentAsset.transferAmount} ${currentAsset.unit}`,
    }));

    const sparks: ParticleSpark[] = [];
    let vaultImpactFlash = 0;

    const triggerManualPulse = (cx: number, cy: number) => {
      vaultImpactFlash = 1.0;
      for (let i = 0; i < 38; i++) {
        const ang = (Math.PI * 2 * i) / 38 + (Math.random() - 0.5) * 0.3;
        const spd = 2.5 + Math.random() * 4.5;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 40 + Math.random() * 20,
          color: Math.random() > 0.5 ? "#C9A2FF" : "#34D399",
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerManualPulse(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.50;
      const centerY = height * 0.42;
      const senderX = Math.max(90, width * 0.16);
      const recipientX = Math.min(width - 90, width * 0.84);
      const terminalY = centerY;

      // 1. Futuristic Tech Background Matrix Grid
      ctx.strokeStyle = "rgba(156, 72, 240, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Glowing Circuit Pathways Connecting Sender -> Center Vault -> Recipient
      // Circuit Bus: Sender to Vault
      ctx.beginPath();
      ctx.moveTo(senderX + 80, terminalY);
      ctx.bezierCurveTo(centerX - 130, terminalY, centerX - 130, centerY, centerX - 90, centerY);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Circuit Core Line (Dashed)
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(senderX + 80, terminalY);
      ctx.bezierCurveTo(centerX - 130, terminalY, centerX - 130, centerY, centerX - 90, centerY);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Circuit Bus: Vault to Recipient
      ctx.beginPath();
      ctx.moveTo(centerX + 90, centerY);
      ctx.bezierCurveTo(centerX + 130, centerY, centerX + 130, terminalY, recipientX - 80, terminalY);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Circuit Core Line (Dashed)
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(centerX + 90, centerY);
      ctx.bezierCurveTo(centerX + 130, centerY, centerX + 130, terminalY, recipientX - 80, terminalY);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Render Center Cryptographic Vault Reactor (Unique Hex/Ring Matrix)
      vaultImpactFlash = Math.max(0, vaultImpactFlash - 0.025);
      const vaultPulse = (Math.sin(elapsed * 3) + 1) * 0.5;

      // Vault Ambient Deep Glow
      const vGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 160);
      vGlow.addColorStop(0, `rgba(156, 72, 240, ${0.28 + vaultImpactFlash * 0.5 + vaultPulse * 0.06})`);
      vGlow.addColorStop(0.7, "rgba(156, 72, 240, 0.04)");
      vGlow.addColorStop(1, "rgba(156, 72, 240, 0)");
      ctx.fillStyle = vGlow;
      ctx.fillRect(centerX - 160, centerY - 160, 320, 320);

      // Rotating Cryptographic Hash Orbit Rings
      hashRings.forEach((ring, rIdx) => {
        ring.angle += ring.speed * 0.015;

        // Circular Rail
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rIdx === 0 ? "rgba(201, 162, 255, 0.2)" : "rgba(156, 72, 240, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Hash Labels
        const count = ring.hashes.length;
        ctx.font = "bold 8.5px ui-monospace, SFMono-Regular, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ring.hashes.forEach((h, hIdx) => {
          const theta = ring.angle + (Math.PI * 2 * hIdx) / count;
          const hx = centerX + Math.cos(theta) * ring.radius;
          const hy = centerY + Math.sin(theta) * ring.radius;

          ctx.fillStyle = rIdx === 0 ? "rgba(201, 162, 255, 0.7)" : "rgba(167, 139, 250, 0.55)";
          ctx.fillText(h, hx, hy);
        });
      });

      // Impermeable Vault Hexagon Security Shield Perimeter
      const hexRadius = 82 + vaultPulse * 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + Math.PI / 6;
        const x = centerX + Math.cos(ang) * hexRadius;
        const y = centerY + Math.sin(ang) * hexRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = principles.vaultCustodyLock ? "#9C48F0" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(18, 12, 34, 0.94)";
      ctx.fill();

      // Vault Core Central Holographic HUD
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Vault Badge
      ctx.fillStyle = "rgba(201, 162, 255, 0.2)";
      ctx.strokeStyle = "rgba(201, 162, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(centerX - 52, centerY - 48, 104, 18, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 8.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("SHIELDED STORAGE", centerX, centerY - 39);

      // Main Mutation State Equation
      ctx.fillStyle = principles.internalMutation ? "#34D399" : "#F43F5E";
      ctx.font = "bold 13px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(
        principles.internalMutation ? "INTERNAL MUTATION" : "PUBLIC LOG LEAK",
        centerX,
        centerY - 16
      );

      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 10px ui-monospace, monospace";
      ctx.fillText("balanceOf[Alice] -= 1,000", centerX, centerY + 2);
      ctx.fillText("balanceOf[Bob]   += 1,000", centerX, centerY + 18);

      // Invariant Conserved status
      ctx.fillStyle = "rgba(235, 221, 255, 0.7)";
      ctx.font = "bold 8.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(
        `VAULT CONSERVED: ${currentAsset.totalVaultSupply.toLocaleString()} ${currentAsset.unit}`,
        centerX,
        centerY + 38
      );

      // 4. Render Left Terminal: Sender (Alice · 0x3F..9a1c)
      const senderCardW = 150;
      const senderCardH = 92;
      const sLeft = senderX - senderCardW * 0.5;
      const sTop = terminalY - senderCardH * 0.5;

      ctx.fillStyle = "rgba(16, 12, 30, 0.95)";
      ctx.strokeStyle = "rgba(201, 162, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sLeft, sTop, senderCardW, senderCardH, 16);
      ctx.fill();
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = "#A78BFA";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "left";
      ctx.fillText("SENDER ACCOUNT", sLeft + 16, sTop + 20);

      // Address
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px ui-monospace, monospace";
      ctx.fillText("0x3F..9a1c", sLeft + 16, sTop + 38);

      // Balance deduction
      ctx.fillStyle = "rgba(235, 221, 255, 0.6)";
      ctx.font = "9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("Shielded Balance:", sLeft + 16, sTop + 56);

      ctx.fillStyle = "#FDA4AF";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(
        `${(currentAsset.aliceInitial - currentAsset.transferAmount).toLocaleString()} ${currentAsset.unit} (-${currentAsset.transferAmount})`,
        sLeft + 16,
        sTop + 74
      );

      // 5. Render Right Terminal: Recipient (Bob · 0x8D..4e2b)
      const recCardW = 150;
      const recCardH = 92;
      const rLeft = recipientX - recCardW * 0.5;
      const rTop = terminalY - recCardH * 0.5;

      ctx.fillStyle = "rgba(16, 12, 30, 0.95)";
      ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rLeft, rTop, recCardW, recCardH, 16);
      ctx.fill();
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = "#34D399";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "left";
      ctx.fillText("RECIPIENT ACCOUNT", rLeft + 16, rTop + 20);

      // Address
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px ui-monospace, monospace";
      ctx.fillText("0x8D..4e2b", rLeft + 16, rTop + 38);

      // Balance credited
      ctx.fillStyle = "rgba(235, 221, 255, 0.6)";
      ctx.font = "9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("Shielded Balance:", rLeft + 16, rTop + 56);

      ctx.fillStyle = "#34D399";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(
        `${(currentAsset.bobInitial + currentAsset.transferAmount).toLocaleString()} ${currentAsset.unit} (+${currentAsset.transferAmount})`,
        rLeft + 16,
        rTop + 74
      );

      // 6. Animate Flowing Encrypted Data Packets Along the Curve
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1.0) {
          pkt.progress = 0;
          triggerManualPulse(recipientX, terminalY);
        }

        // Compute (x, y) along bezier spline from Sender to Vault to Recipient
        let px = 0;
        let py = 0;
        const laneOffset = pkt.lane * 6;

        if (pkt.progress < 0.5) {
          // Sender to Vault phase
          const t = pkt.progress * 2; // 0 to 1
          const p0x = senderX + 75;
          const p0y = terminalY + laneOffset;
          const p1x = centerX - 120;
          const p1y = terminalY + laneOffset;
          const p2x = centerX - 40;
          const p2y = centerY + laneOffset;

          px = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          py = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
        } else {
          // Vault to Recipient phase
          const t = (pkt.progress - 0.5) * 2; // 0 to 1
          const p0x = centerX + 40;
          const p0y = centerY + laneOffset;
          const p1x = centerX + 120;
          const p1y = terminalY + laneOffset;
          const p2x = recipientX - 75;
          const p2y = terminalY + laneOffset;

          px = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
          py = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
        }

        // Draw quantum packet orb with glow
        ctx.beginPath();
        ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
        const isPastVault = pkt.progress >= 0.5;
        ctx.fillStyle = isPastVault ? "#34D399" : "#C9A2FF";
        ctx.shadowColor = isPastVault ? "#34D399" : "#C9A2FF";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7. Bottom Public Mempool Scanner / Block Radar
      const radarY = height - 52;
      ctx.beginPath();
      ctx.moveTo(24, radarY);
      ctx.lineTo(width - 24, radarY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Radar sweep wave
      const radarSweep = (elapsed * 0.15) % 1.0;
      const rx = 24 + radarSweep * (width - 48);

      const radGrad = ctx.createLinearGradient(rx - 80, 0, rx + 80, 0);
      radGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      radGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.2)");
      radGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(rx - 80, radarY - 20, 160, 40);

      // Radar text indicators
      ctx.textAlign = "left";
      ctx.font = "bold 9.5px ui-sans-serif, system-ui, -apple-system";
      ctx.fillStyle = "rgba(235, 221, 255, 0.5)";
      ctx.fillText("PUBLIC MEMPOOL OBSERVER RADAR", 32, radarY + 22);

      ctx.textAlign = "right";
      ctx.fillStyle = principles.zeroErcEvents ? "#34D399" : "#F43F5E";
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(
        principles.zeroErcEvents
          ? "✓ 0 ERC-20 TRANSFERS DETECTED (ZERO PUBLIC FOOTPRINT)"
          : "⚠ HEURISTIC LEAK: ERC-20 Transfer Event Emitted!",
        width - 32,
        radarY + 22
      );

      // 8. Render Sparks
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
  }, [principles, selectedAsset, currentAsset]);

  // Circular Gauge Calculation
  const gaugeColor =
    metrics.privacyScore >= 80
      ? "#10B981"
      : metrics.privacyScore >= 50
      ? "#38BDF8"
      : metrics.privacyScore >= 25
      ? "#F59E0B"
      : "#EF4444";

  const gaugeStrokeDash = 2 * Math.PI * 38;
  const strokeDashoffset = gaugeStrokeDash * (1 - metrics.privacyScore / 100);

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
              href="/app/send"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <span>← Back to Send</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Internal ledger transfer
          </h1>
          <div>
            <button
              type="button"
              onClick={() => setIsAboutModelOpen(true)}
              className="mt-1 inline-flex items-center rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-white/70 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white uppercase cursor-pointer"
            >
              ABOUT THE LEDGER
            </button>
          </div>
        </div>

        {/* CENTER METRIC PILLS */}
        <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">ASSET</span>
            <span className="font-bold font-mono text-white">{currentAsset.name}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">ERC-20 LOGS</span>
            <span className="font-bold font-mono text-emerald-400">0 Emitted</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">PROTOCOL FEE</span>
            <span className="font-bold font-mono text-emerald-400">0.00% (Free)</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-dimmer)] uppercase text-[10px] font-bold">SPEED</span>
            <span className="font-bold font-mono text-[var(--lilac)]">1 Block (~2s)</span>
          </div>
        </div>

        {/* RIGHT: CIRCULAR GAUGE PRIVACY INTEGRITY */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
            PRIVACY INTEGRITY
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
                {metrics.privacyScore}%
              </span>
              <span className="text-[9px] font-bold text-[var(--text-dimmer)] uppercase">
                {metrics.privacyScore === 100 ? "SHIELDED" : "LEAKING"}
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
          title="Click anywhere to trigger cryptographic mutation burst"
        />

        {/* FLOATING EXPLAINER CARD OVER CANVAS */}
        <div className="absolute bottom-6 left-6 z-20 max-w-[590px] w-[calc(100%-3rem)] sm:w-auto rounded-2xl border border-white/10 bg-[#0c0916]/95 p-4.5 shadow-2xl backdrop-blur-xl transition-all">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Left Diagram: 3D Isometric SVG Graphic */}
            <div className="relative rounded-xl border border-white/10 bg-black/50 p-3 sm:w-[220px] shrink-0 overflow-hidden">
              <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-[var(--text-dimmer)] uppercase">
                <span>{principles.internalMutation ? "INTERNAL VAULT LEDGER" : "PUBLIC ERC-20"}</span>
              </div>

              {/* 3D Isometric SVG Graphic */}
              <div className="mt-3 flex items-center justify-center">
                <svg viewBox="0 0 190 70" className="w-full h-auto overflow-visible">
                  {/* Sender Wallet Box */}
                  <g transform="translate(6, 6)">
                    <rect x="0" y="0" width="38" height="22" rx="4" fill="#141124" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="19" y="10" fill="#a78bfa" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SENDER</text>
                    <text x="19" y="17" fill="#888" fontSize="5.5" fontFamily="monospace" textAnchor="middle">0x3F..9a1c</text>
                  </g>

                  {/* Flow Arrow Left -> Vault */}
                  <path d="M 46 17 L 68 28" stroke="rgba(201, 162, 255, 0.6)" strokeWidth="1" strokeDasharray="2,2" />

                  {/* Center Cylindrical Vault Disc */}
                  <g transform="translate(95, 33)">
                    <ellipse cx="0" cy="8" rx="24" ry="9" fill="rgba(156,72,240,0.22)" />
                    <path d="M -22 0 C -22 6, 22 6, 22 0 L 22 7 C 22 13, -22 13, -22 7 Z" fill="url(#vaultGrad)" />
                    <ellipse cx="0" cy="0" rx="22" ry="7" fill="#1c1335" stroke="#9C48F0" strokeWidth="1" />
                    <circle cx="-10" cy="-1" r="1.2" fill="#c9a2ff" />
                    <circle cx="10" cy="-1" r="1.2" fill="#34d399" />
                    <text x="0" y="2.5" fill="#EBDDFF" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.4">POOL VAULT</text>
                  </g>

                  {/* Flow Arrow Vault -> Recipient */}
                  <path d="M 120 35 L 140 45" stroke="#34d399" strokeWidth="1" strokeDasharray="2,2" />
                  <polygon points="142,46 137,44 137,48" fill="#34d399" />

                  {/* Recipient Wallet Box */}
                  <g transform="translate(142, 38)">
                    <rect x="0" y="0" width="44" height="22" rx="4" fill="#0d241d" stroke="#34d399" strokeWidth="1" />
                    <text x="22" y="10" fill="#a7f3d0" fontSize="6.5" fontWeight="bold" textAnchor="middle">RECIPIENT</text>
                    <text x="22" y="17" fill="#34d399" fontSize="5.5" fontFamily="monospace" textAnchor="middle">0x8D..4e2b</text>
                  </g>

                  {/* Bottom Mempool Status Ribbon */}
                  <g transform="translate(6, 42)">
                    <rect x="0" y="0" width="60" height="18" rx="3" fill="#0a0714" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                    <text x="30" y="8" fill="#666" fontSize="5" textAnchor="middle">MEMPOOL</text>
                    <text x="30" y="14" fill="#34d399" fontSize="5.5" fontWeight="bold" textAnchor="middle">0 ERC20 LOGS</text>
                  </g>

                  <defs>
                    <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
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
                  ? "PRINCIPLE 1: INTERNAL LEDGER MUTATION"
                  : activeStep === 2
                  ? "PRINCIPLE 2: ZERO ERC-20 EVENT LEAKAGE"
                  : activeStep === 3
                  ? "PRINCIPLE 3: VAULT CUSTODY LOCK"
                  : activeStep === 4
                  ? "PRINCIPLE 4: INSTANT 1-BLOCK EXECUTION"
                  : activeStep === 5
                  ? "PRINCIPLE 5: 0.00% PROTOCOL FEE"
                  : "INTERNAL LEDGER MECHANICS"}
              </span>

              <h2 className="text-base font-bold tracking-tight text-white leading-snug">
                {activeStep === 1
                  ? "Balances mutate directly inside the ShieldedPool mapping"
                  : activeStep === 2
                  ? "Zero ERC-20 Transfer events emitted to public explorers"
                  : activeStep === 3
                  ? "Underlying tokens never leave the smart contract vault"
                  : activeStep === 4
                  ? "Instant execution in a single block with zero waiting"
                  : activeStep === 5
                  ? "Completely free transfers with zero protocol fee"
                  : metrics.privacyScore === 100
                  ? "100% private internal transfer & zero public trace"
                  : "Toggle principles below to see how internal ledger moves work"}
              </h2>

              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                {activeStep === 1
                  ? `When you transfer ${currentAsset.transferAmount} ${currentAsset.unit}, the contract executes \`balanceOf[from] -= amount\` and \`balanceOf[to] += amount\`. No external transaction touches Alice or Bob.`
                  : activeStep === 2
                  ? "Standard ERC-20 transfers emit a public event logging \`Transfer(from, to, amount)\`. Spectre severs this heuristic entirely: indexers only see an opaque call to the pool."
                  : activeStep === 3
                  ? "The actual ERC-20 tokens or ETH remain firmly locked inside the ShieldedPool contract custody. Ownership changes internally without moving tokens on the Robinhood L2 layer."
                  : activeStep === 4
                  ? "Unlike Trade Waves which require 15-minute batch intervals for netting, private transfers execute immediately in the very next block (~2 seconds)."
                  : activeStep === 5
                  ? "Internal transfers carry 0.00% protocol fee. You only pay standard Robinhood Chain gas (subsidized/minimal), keeping private peer-to-peer moves frictionless."
                  : "Moving tokens inside the shielded pool operates as an internal ledger transfer. Tokens remain safely locked inside the contract vault while internal balances mutate without emitting public ERC-20 logs."}
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
            {/* 1. Internal Ledger Mutation */}
            <button
              type="button"
              onClick={() => togglePrinciple("internalMutation")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.internalMutation
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.internalMutation ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.internalMutation ? "✓" : "1"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Internal ledger</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  mapping mutation only
                </span>
              </div>
            </button>

            {/* 2. Zero ERC-20 Events */}
            <button
              type="button"
              onClick={() => togglePrinciple("zeroErcEvents")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.zeroErcEvents
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.zeroErcEvents ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.zeroErcEvents ? "✓" : "2"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Zero ERC-20 events</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  no Transfer logs emitted
                </span>
              </div>
            </button>

            {/* 3. Vault Custody Lock */}
            <button
              type="button"
              onClick={() => togglePrinciple("vaultCustodyLock")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.vaultCustodyLock
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.vaultCustodyLock ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.vaultCustodyLock ? "✓" : "3"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Vault custody lock</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  tokens stay in contract
                </span>
              </div>
            </button>

            {/* 4. Instant Settlement */}
            <button
              type="button"
              onClick={() => togglePrinciple("instantBlockExecution")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.instantBlockExecution
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.instantBlockExecution ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.instantBlockExecution ? "✓" : "4"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Instant 1-block</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  no wave delay
                </span>
              </div>
            </button>

            {/* 5. 0.00% Protocol Fee */}
            <button
              type="button"
              onClick={() => togglePrinciple("zeroProtocolFee")}
              className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 min-w-[140px] ${
                principles.zeroProtocolFee
                  ? "border-[var(--ultra)] bg-[var(--ultra)]/25 text-white shadow-[0_0_12px_rgba(156,72,240,0.3)]"
                  : "border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  principles.zeroProtocolFee ? "bg-emerald-400 text-black" : "bg-white/20 text-white"
                }`}
              >
                {principles.zeroProtocolFee ? "✓" : "5"}
              </span>
              <div className="text-left">
                <span className="block font-bold leading-tight">0.00% Protocol fee</span>
                <span className="text-[9.5px] text-[var(--text-dimmer)]">
                  free internal moves
                </span>
              </div>
            </button>
          </div>

          {/* Asset selector */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dimmer)]">
              SIMULATE ASSET:
            </span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["USDG", "ETH", "NVDA", "TSLA"] as const).map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSelectedAsset(sym)}
                  className={`rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedAsset === sym
                      ? "bg-[var(--ultra)] text-white shadow-xs"
                      : "text-[var(--text-dim)] hover:text-white"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ABOUT THE LEDGER MODAL POPUP */}
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
                <h3 className="text-lg font-bold text-white">About the Internal Ledger Architecture</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Cryptographic state mutation & public event suppression
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
                <h4 className="font-bold text-white text-sm">1. Smart Contract Storage Layout</h4>
                <p className="mt-1">
                  Inside <code className="text-[var(--lilac)]">ShieldedPool.sol</code>, user balances are tracked via an internal nested mapping:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  mapping(address =&gt; mapping(address =&gt; uint256)) private _balances;<br />
                  // _balances[asset][owner] = amount
                </div>
                <p>
                  Calling <code className="text-emerald-400">transfer(asset, to, amount)</code> mutates the mapping state in EVM storage without calling any ERC-20 contract.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">2. Elimination of Public Mempool Logs</h4>
                <p className="mt-1">
                  Standard ERC-20 token transfers emit:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-rose-300">
                  event Transfer(address indexed from, address indexed to, uint256 value);
                </div>
                <p>
                  Because Spectre does not call <code className="text-white">ERC20.transfer</code>, zero events are emitted to the Robinhood Chain mempool. External blockchain explorers only record an opaque interaction with the ShieldedPool address.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">3. Value Conservation Invariant</h4>
                <p className="mt-1">
                  The total amount of tokens held by the contract vault strictly equals the sum of all internal balances:
                </p>
                <div className="my-2 rounded-lg bg-black/40 p-2 font-mono text-[11px] text-[var(--lilac)]">
                  ∑ _balances[asset][user_i] ≡ IERC20(asset).balanceOf(address(this))
                </div>
                <p>
                  No value can ever be created or destroyed during an internal transfer.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <h4 className="font-bold text-white text-sm">4. Instant 1-Block Finality</h4>
                <p className="mt-1">
                  Unlike Trade Waves which aggregate order intents across 15-minute windows to discover clearing prices, internal transfers do not require counterparty matching. Transfers execute and finalize in a single block (~2 seconds on Robinhood Chain).
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
