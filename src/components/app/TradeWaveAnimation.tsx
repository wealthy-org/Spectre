"use client";

import { useEffect, useRef } from "react";

interface WaveOrder {
  side: "buy" | "sell";
  progress: number;
  speed: number;
  laneY: number;
  size: number;
}

interface MatchSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export function TradeWaveAnimation({ waveId = 1 }: { waveId?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 440);
    let height = (canvas.height = 160);

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = 160;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // Active wave state
    let centerCoreFlash = 0;
    const sparks: MatchSpark[] = [];

    // Order streams
    const orders: WaveOrder[] = Array.from({ length: 16 }).map((_, i) => ({
      side: i % 2 === 0 ? "buy" : "sell",
      progress: (i / 16) + Math.random() * 0.05,
      speed: 0.005 + Math.random() * 0.004,
      laneY: (Math.random() - 0.5) * 44,
      size: 2.5 + Math.random() * 1.5,
    }));

    const triggerClearWave = (originX = width * 0.5, originY = height * 0.5) => {
      centerCoreFlash = 1.0;
      for (let i = 0; i < 24; i++) {
        const ang = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.3;
        const spd = 2 + Math.random() * 4;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 35 + Math.random() * 20,
          color: Math.random() > 0.5 ? "#C9A2FF" : "#34D399",
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerClearWave(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const buySourceX = 40;
      const sellSourceX = width - 40;

      // Background vignette
      const bg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7);
      bg.addColorStop(0, "rgba(24, 12, 52, 0.6)");
      bg.addColorStop(0.6, "rgba(14, 9, 26, 0.85)");
      bg.addColorStop(1, "rgba(10, 6, 18, 0.98)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Connecting guide tracks
      ctx.beginPath();
      ctx.moveTo(buySourceX, centerY);
      ctx.lineTo(centerX, centerY);
      ctx.lineTo(sellSourceX, centerY);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 1. Center Netting Engine Core
      if (centerCoreFlash > 0) centerCoreFlash = Math.max(0, centerCoreFlash - 0.03);

      const corePulse = (Math.sin(elapsed * 3) + 1) * 0.5;
      const ringRadius = 24 + corePulse * 4;

      // Rotating orbital ring 1
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(elapsed * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 6, 0, Math.PI * 1.4);
      ctx.strokeStyle = `rgba(156, 72, 240, ${0.4 + centerCoreFlash * 0.5})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Rotating orbital ring 2 (counter-rotate)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-elapsed * 1.5);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 12, 0, Math.PI * 1.2);
      ctx.strokeStyle = `rgba(201, 162, 255, ${0.3 + centerCoreFlash * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Core body
      const coreFill = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringRadius);
      coreFill.addColorStop(0, `rgba(201, 162, 255, ${0.35 + centerCoreFlash * 0.6})`);
      coreFill.addColorStop(0.7, "rgba(36, 16, 85, 0.95)");
      coreFill.addColorStop(1, "rgba(20, 8, 48, 1)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreFill;
      ctx.fill();
      ctx.strokeStyle = centerCoreFlash > 0 ? "#FFFFFF" : "#C9A2FF";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Core Labels
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BATCH", centerX, centerY - 5);
      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("NETTING", centerX, centerY + 6);

      // Top Wave Badge
      const topBadgeY = centerY - 38;
      ctx.fillStyle = "rgba(156, 72, 240, 0.35)";
      ctx.strokeStyle = "#C9A2FF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(centerX - 32, topBadgeY - 8, 64, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(`WAVE #${waveId}`, centerX, topBadgeY);

      // 2. Buy Source (Left Node)
      ctx.beginPath();
      ctx.arc(buySourceX, centerY, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 36, 24, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#34D399";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("BUYS", buySourceX, centerY);

      // 3. Sell Source (Right Node)
      ctx.beginPath();
      ctx.arc(sellSourceX, centerY, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(36, 16, 48, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "#C9A2FF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("SELLS", sellSourceX, centerY);

      // 4. Flowing Orders toward Center
      for (const ord of orders) {
        ord.progress += ord.speed;
        if (ord.progress >= 1) {
          ord.progress = 0;
          ord.speed = 0.005 + Math.random() * 0.004;
          ord.laneY = (Math.random() - 0.5) * 44;

          // Impact collision flash
          centerCoreFlash = Math.max(centerCoreFlash, 0.6);
          // Micro sparks
          for (let s = 0; s < 3; s++) {
            const ang = Math.random() * Math.PI * 2;
            sparks.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(ang) * (1 + Math.random() * 2),
              vy: Math.sin(ang) * (1 + Math.random() * 2),
              life: 0,
              maxLife: 20,
              color: ord.side === "buy" ? "#34D399" : "#C9A2FF",
            });
          }
        }

        const t = ord.progress;
        const isBuy = ord.side === "buy";

        // Curved flight to center
        const startX = isBuy ? buySourceX : sellSourceX;
        const endX = centerX;
        const cpX = (startX + endX) * 0.5;
        const cpY = centerY + ord.laneY;

        const invT = 1 - t;
        const px = invT * invT * startX + 2 * invT * t * cpX + t * t * endX;
        const py = invT * invT * centerY + 2 * invT * t * cpY + t * t * centerY;

        const alpha = Math.sin(t * Math.PI);
        const col = isBuy ? "rgba(52, 211, 153," : "rgba(201, 162, 255,";

        const glow = ctx.createRadialGradient(px, py, 0, px, py, ord.size * 2.5);
        glow.addColorStop(0, `${col} ${alpha * 0.95})`);
        glow.addColorStop(1, `${col} 0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, ord.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(px, py, ord.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Residual Net Settlement Arrow (Downwards)
      const arrowY = centerY + ringRadius + 14;
      const netPulse = (Math.sin(elapsed * 4) + 1) * 0.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, arrowY);
      ctx.lineTo(centerX + 10, arrowY);
      ctx.lineTo(centerX, arrowY + 9);
      ctx.closePath();
      ctx.fillStyle = `rgba(201, 162, 255, ${0.4 + netPulse * 0.5})`;
      ctx.fill();

      ctx.fillStyle = "rgba(222, 215, 238, 0.7)";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("ONE PUBLIC SETTLEMENT", centerX, arrowY + 18);

      // 6. Sparks update & draw
      for (let si = sparks.length - 1; si >= 0; si--) {
        const sp = sparks[si];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.95;
        sp.vy *= 0.95;
        sp.life++;

        const alpha = Math.max(0, 1 - sp.life / sp.maxLife);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.8 * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (sp.life >= sp.maxLife) {
          sparks.splice(si, 1);
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
  }, [waveId]);

  return (
    <div
      aria-hidden="true"
      className="group relative w-full overflow-hidden rounded-xl border border-[var(--app-border-strong)] bg-[#120D20] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer select-none"
      style={{ height: 160 }}
      title="Click to trigger instant batch netting simulation!"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-pan-y"
      />
      <span className="pointer-events-none absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-wider text-[var(--text-dimmer)] backdrop-blur-xs opacity-60 transition-opacity group-hover:opacity-100">
        CLICK TO SIMULATE NETTING
      </span>
    </div>
  );
}
