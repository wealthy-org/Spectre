"use client";

import { useEffect, useRef } from "react";

interface WaveExitParticle {
  progress: number;
  speed: number;
  lane: number;
  size: number;
  color: string;
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

export function WithdrawWaveAnimation({ waveId = 48 }: { waveId?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 440);
    let height = (canvas.height = 165);

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = 165;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // Dynamic wave simulation
    const particles: WaveExitParticle[] = Array.from({ length: 14 }).map((_, i) => ({
      progress: (i / 14),
      speed: 0.005 + Math.random() * 0.003,
      lane: (i % 3) - 1, // -1, 0, 1 exit channels
      size: 2.2 + Math.random() * 1.5,
      color: i % 2 === 0 ? "#C9A2FF" : "#9C48F0",
    }));

    const sparks: WaveSpark[] = [];
    let gateFlash = 0;
    let waveCycle = 0;

    const triggerFlush = (originX = width * 0.45, originY = height * 0.5) => {
      gateFlash = 1.0;
      for (let i = 0; i < 26; i++) {
        const ang = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.3;
        const spd = 2 + Math.random() * 4.5;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 35 + Math.random() * 15,
          color: Math.random() > 0.4 ? "#C9A2FF" : "#34D399",
        });
      }
      particles.forEach((p) => {
        p.speed += 0.007;
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerFlush(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const centerY = height * 0.5;
      const poolX = 48;
      const gateX = width * 0.48;
      const exitBaseX = width - 48;

      // Exit destinations (3 fan-out channels)
      const exits = [
        { x: exitBaseX, y: centerY - 38, label: "0xA1…B4" },
        { x: exitBaseX, y: centerY, label: "0xC2…D8" },
        { x: exitBaseX, y: centerY + 38, label: "0xE3…F9" },
      ];

      // 1. Background dark gradient
      const bg = ctx.createRadialGradient(gateX, centerY, 0, gateX, centerY, width * 0.7);
      bg.addColorStop(0, "rgba(24, 12, 50, 0.65)");
      bg.addColorStop(0.6, "rgba(14, 9, 26, 0.88)");
      bg.addColorStop(1, "rgba(10, 6, 18, 0.98)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // 2. Guide conduits from Gate to Exits
      for (const dest of exits) {
        ctx.beginPath();
        ctx.moveTo(poolX, centerY);
        ctx.lineTo(gateX, centerY);
        ctx.lineTo(dest.x, dest.y);
        ctx.strokeStyle = "rgba(201, 162, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Central Batch Sluice Gate
      if (gateFlash > 0) gateFlash = Math.max(0, gateFlash - 0.025);
      waveCycle = (Math.sin(elapsed * 2) + 1) * 0.5;
      const gateRadius = 24 + waveCycle * 3;

      // Rotating wave orbital ring
      ctx.save();
      ctx.translate(gateX, centerY);
      ctx.rotate(elapsed * 1.1);
      ctx.beginPath();
      ctx.arc(0, 0, gateRadius + 8, 0, Math.PI * 1.5);
      ctx.strokeStyle = `rgba(156, 72, 240, ${0.4 + gateFlash * 0.5})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // Inner Gate Body
      const gateFill = ctx.createRadialGradient(gateX, centerY, 0, gateX, centerY, gateRadius);
      gateFill.addColorStop(0, `rgba(201, 162, 255, ${0.3 + gateFlash * 0.6})`);
      gateFill.addColorStop(0.7, "rgba(34, 14, 75, 0.95)");
      gateFill.addColorStop(1, "rgba(18, 8, 42, 1)");

      ctx.beginPath();
      ctx.arc(gateX, centerY, gateRadius, 0, Math.PI * 2);
      ctx.fillStyle = gateFill;
      ctx.fill();
      ctx.strokeStyle = gateFlash > 0 ? "#FFFFFF" : "#C9A2FF";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Gate text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BATCH", gateX, centerY - 5);
      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("SLUICE", gateX, centerY + 6);

      // Top Wave Badge
      const topBadgeY = centerY - 38;
      ctx.fillStyle = "rgba(156, 72, 240, 0.35)";
      ctx.strokeStyle = "#C9A2FF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(gateX - 32, topBadgeY - 8, 64, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText(`WAVE #${waveId}`, gateX, topBadgeY);

      // 4. Source: Shielded Pool Chamber (Left)
      const poolPulse = (Math.sin(elapsed * 2.5) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(poolX, centerY, 18 + poolPulse * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(156, 72, 240, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(poolX, centerY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(22, 10, 48, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "#9C48F0";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("SHIELDED", poolX, centerY - 4);
      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("POOL", poolX, centerY + 5);

      // 5. Exits: Public L2 Wallets (Right)
      for (const dest of exits) {
        ctx.beginPath();
        ctx.arc(dest.x, dest.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 26, 42, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
        ctx.fillText(dest.label, dest.x, dest.y);
      }

      // 6. Streaming Wave Particles
      for (const p of particles) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.speed = 0.005 + Math.random() * 0.003;

          // Arrival spark at destination
          const targetExit = exits[p.lane + 1];
          for (let s = 0; s < 2; s++) {
            const ang = Math.random() * Math.PI * 2;
            sparks.push({
              x: targetExit.x,
              y: targetExit.y,
              vx: Math.cos(ang) * (1 + Math.random() * 2),
              vy: Math.sin(ang) * (1 + Math.random() * 2),
              life: 0,
              maxLife: 20,
              color: "#38BDF8",
            });
          }
        }

        const t = p.progress;
        let px = 0;
        let py = 0;

        // Path: Phase 1 (Pool -> Gate), Phase 2 (Gate -> Fan-out Exit)
        if (t < 0.5) {
          const segT = t / 0.5;
          px = poolX + segT * (gateX - poolX);
          py = centerY + Math.sin(segT * Math.PI) * (p.lane * 8);
        } else {
          const segT = (t - 0.5) / 0.5;
          const targetExit = exits[p.lane + 1];
          const cpX = (gateX + targetExit.x) * 0.5;
          const cpY = centerY;
          const invT = 1 - segT;
          px = invT * invT * gateX + 2 * invT * segT * cpX + segT * segT * targetExit.x;
          py = invT * invT * centerY + 2 * invT * segT * targetExit.y + segT * segT * targetExit.y;
        }

        const alpha = Math.sin(t * Math.PI);

        // Particle glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.8);
        glow.addColorStop(0, `rgba(201, 162, 255, ${alpha * 0.95})`);
        glow.addColorStop(1, "rgba(156, 72, 240, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Update & Draw Sparks
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
      style={{ height: 165 }}
      title="Click to flush withdrawal wave!"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-pan-y"
      />
      <span className="pointer-events-none absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-wider text-[var(--text-dimmer)] backdrop-blur-xs opacity-60 transition-opacity group-hover:opacity-100">
        CLICK TO FLUSH WITHDRAWAL WAVE
      </span>
    </div>
  );
}
