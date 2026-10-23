"use client";

import { useEffect, useRef } from "react";

function drawHex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth = 1
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const hx = x + radius * Math.cos(angle);
    const hy = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

interface HexCell {
  x: number;
  y: number;
  r: number;
  c: number;
  flash: number;
  pulsePhase: number;
  isPool: boolean;
  isYou: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Streamer {
  progress: number;
  speed: number;
  curveY: number;
  targetIdx: number;
  size: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
}

export function ShieldCanvasAnimation() {
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

    // Grid coordinates
    const hexRadius = 11.5;
    const hexH = Math.sqrt(3) * hexRadius;
    const hexW = hexRadius * 1.5;
    const hexCells: HexCell[] = [];

    let youCenterX = 80;
    let youCenterY = height * 0.52;
    let poolCenterX = width - 110;
    let poolCenterY = height * 0.5;

    const buildGrid = () => {
      hexCells.length = 0;
      youCenterX = Math.max(70, width * 0.22);
      youCenterY = height * 0.52;
      poolCenterX = Math.max(width * 0.72, width - 110);
      poolCenterY = height * 0.5;

      const cols = Math.ceil(width / hexW) + 2;
      const rows = Math.ceil(height / hexH) + 2;

      for (let r = -1; r <= rows; r++) {
        for (let c = -1; c <= cols; c++) {
          const x = c * hexW;
          const y = r * hexH + ((c % 2) * hexH) / 2;

          const distYou = Math.hypot(x - youCenterX, y - youCenterY);
          const distPool = Math.hypot(x - poolCenterX, y - poolCenterY);

          const isYou = distYou < hexRadius * 2.8;
          const isPool = distPool < hexRadius * 4.6;

          hexCells.push({
            x,
            y,
            r,
            c,
            flash: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            isPool,
            isYou,
          });
        }
      }
    };

    buildGrid();

    // Stream particles from YOU to POOL
    const poolIndices: number[] = [];
    hexCells.forEach((h, i) => {
      if (h.isPool) poolIndices.push(i);
    });

    const streamers: Streamer[] = Array.from({ length: 18 }).map((_, i) => ({
      progress: i / 18 + Math.random() * 0.04,
      speed: 0.004 + Math.random() * 0.0035,
      curveY: (Math.random() - 0.5) * 60,
      targetIdx: poolIndices[Math.floor(Math.random() * poolIndices.length)] ?? 0,
      size: 2.2 + Math.random() * 1.4,
    }));

    // Interactive particles and ripples
    const burstParticles: Particle[] = [];
    const ripples: ClickRipple[] = [];

    // Mouse tracking for hover proximity glow
    let mouseX = -999;
    let mouseY = -999;
    let isMouseInside = false;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseInside = true;
    };

    const handlePointerLeave = () => {
      isMouseInside = false;
      mouseX = -999;
      mouseY = -999;
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // 1. Create shockwave ripple
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.7,
        speed: 6.5,
        intensity: 1.0,
      });

      // 2. Spawn spark particle burst
      const burstCount = 14;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
        const spd = 1.5 + Math.random() * 3.5;
        burstParticles.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0,
          maxLife: 35 + Math.random() * 25,
          size: 1.5 + Math.random() * 2,
          color: Math.random() > 0.4 ? "#C9A2FF" : "#9C48F0",
        });
      }

      // 3. Directly flash cells near click
      hexCells.forEach((h) => {
        const d = Math.hypot(h.x - clickX, h.y - clickY);
        if (d < 50) {
          h.flash = Math.max(h.flash, 1 - d / 50);
        }
      });
    };

    canvas.addEventListener("mousemove", handlePointerMove);
    canvas.addEventListener("mouseleave", handlePointerLeave);
    canvas.addEventListener("mousedown", handlePointerDown);

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      // Deep obsidian ambient background
      const gradBg = ctx.createRadialGradient(
        youCenterX,
        youCenterY,
        0,
        youCenterX,
        youCenterY,
        width * 0.8
      );
      gradBg.addColorStop(0, "rgba(28, 14, 60, 0.55)");
      gradBg.addColorStop(0.5, "rgba(16, 10, 30, 0.8)");
      gradBg.addColorStop(1, "rgba(12, 8, 20, 0.95)");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, width, height);

      // 1. Process shockwave ripples
      for (let ri = ripples.length - 1; ri >= 0; ri--) {
        const rip = ripples[ri];
        rip.radius += rip.speed;
        rip.intensity = Math.max(0, 1 - rip.radius / rip.maxRadius);

        // Render subtle ring
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 162, 255, ${rip.intensity * 0.45})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Illuminate cells caught in wave
        hexCells.forEach((h) => {
          const d = Math.hypot(h.x - rip.x, h.y - rip.y);
          if (Math.abs(d - rip.radius) < 16) {
            h.flash = Math.max(h.flash, rip.intensity * 0.85);
          }
        });

        if (rip.radius >= rip.maxRadius) {
          ripples.splice(ri, 1);
        }
      }

      // 2. Render Honeycomb Dense Field
      const ambientPulse = Math.sin(elapsed * 1.5);

      for (let i = 0; i < hexCells.length; i++) {
        const h = hexCells[i];
        if (h.flash > 0) h.flash = Math.max(0, h.flash - 0.025);

        // Hover distance
        let hoverGlow = 0;
        if (isMouseInside) {
          const mDist = Math.hypot(h.x - mouseX, h.y - mouseY);
          if (mDist < 65) {
            hoverGlow = Math.max(0, (1 - mDist / 65) * 0.8);
          }
        }

        // Ambient breathing pulse
        const cellPulse = (Math.sin(elapsed * 2 + h.pulsePhase) + 1) * 0.5;

        let fill = "rgba(156, 72, 240, 0.025)";
        let stroke = "rgba(201, 162, 255, 0.09)";
        let lw = 0.8;

        if (h.isYou) {
          // YOU cluster
          fill = `rgba(156, 72, 240, ${0.12 + cellPulse * 0.15})`;
          stroke = `rgba(201, 162, 255, ${0.3 + cellPulse * 0.25})`;
          lw = 1.1;
        } else if (h.isPool) {
          // POOL cluster
          const poolWave = (Math.sin(elapsed * 2.5 + (h.c + h.r) * 0.4) + 1) * 0.5;
          fill = `rgba(156, 72, 240, ${0.08 + poolWave * 0.18})`;
          stroke = `rgba(201, 162, 255, ${0.22 + poolWave * 0.35})`;
          lw = 1.1;
        }

        // Apply interactive hover / click flash
        if (h.flash > 0 || hoverGlow > 0) {
          const combined = Math.min(1, h.flash + hoverGlow);
          fill = `rgba(201, 162, 255, ${0.18 + combined * 0.55})`;
          stroke = `rgba(255, 255, 255, ${0.45 + combined * 0.55})`;
          lw = 1.4;
        }

        drawHex(ctx, h.x, h.y, hexRadius, fill, stroke, lw);
      }

      // 3. Concentric radar waves radiating from YOU
      const radarPeriod = 2.6;
      for (let w = 0; w < 3; w++) {
        const phase = (elapsed / radarPeriod + w / 3) % 1;
        const r = 16 + phase * 48;
        const alpha = Math.max(0, 1 - phase) * 0.45;
        ctx.beginPath();
        ctx.arc(youCenterX, youCenterY, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 162, 255, ${alpha})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // 4. YOU Center Node
      drawHex(
        ctx,
        youCenterX,
        youCenterY,
        21,
        "rgba(38, 16, 90, 0.95)",
        "#9C48F0",
        2
      );
      const youCorePulse = (Math.sin(elapsed * 4) + 1) * 0.5;
      drawHex(
        ctx,
        youCenterX,
        youCenterY,
        13,
        `rgba(201, 162, 255, ${0.35 + youCorePulse * 0.4})`,
        "#C9A2FF",
        1.3
      );

      // YOU Badge Pill
      const badgeY = youCenterY - 33;
      ctx.fillStyle = "rgba(156, 72, 240, 0.35)";
      ctx.strokeStyle = "#C9A2FF";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(youCenterX - 18, badgeY - 8, 36, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("YOU", youCenterX, badgeY);

      // POOL Text Label
      ctx.fillStyle = "rgba(235, 221, 255, 0.85)";
      ctx.font = "bold 10px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "0.15em";
      ctx.fillText("POOL", poolCenterX, poolCenterY + 48);

      // 5. Continuous Streamers from YOU to POOL
      ctx.save();
      for (const s of streamers) {
        s.progress += s.speed;
        if (s.progress >= 1) {
          s.progress = 0;
          s.speed = 0.004 + Math.random() * 0.0035;
          s.curveY = (Math.random() - 0.5) * 60;
          s.targetIdx = poolIndices[Math.floor(Math.random() * poolIndices.length)] ?? 0;
          const target = hexCells[s.targetIdx];
          if (target) target.flash = 1.0;
        }

        const target = hexCells[s.targetIdx] || { x: poolCenterX, y: poolCenterY };

        const t = s.progress;
        const cpX = (youCenterX + target.x) * 0.5;
        const cpY = (youCenterY + target.y) * 0.5 + s.curveY;

        const invT = 1 - t;
        const px = invT * invT * youCenterX + 2 * invT * t * cpX + t * t * target.x;
        const py = invT * invT * youCenterY + 2 * invT * t * cpY + t * t * target.y;

        const pAlpha = Math.sin(t * Math.PI);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, s.size * 3);
        glow.addColorStop(0, `rgba(201, 162, 255, ${pAlpha * 0.95})`);
        glow.addColorStop(1, "rgba(156, 72, 240, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, s.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, s.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. Burst Particles (from user clicks)
      for (let pi = burstParticles.length - 1; pi >= 0; pi--) {
        const bp = burstParticles[pi];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vx *= 0.94;
        bp.vy *= 0.94;
        bp.life++;

        const alpha = Math.max(0, 1 - bp.life / bp.maxLife);
        ctx.fillStyle = bp.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (bp.life >= bp.maxLife) {
          burstParticles.splice(pi, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      canvas.removeEventListener("mousemove", handlePointerMove);
      canvas.removeEventListener("mouseleave", handlePointerLeave);
      canvas.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="group relative w-full overflow-hidden rounded-xl border border-[var(--app-border-strong)] bg-[#120D20] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-crosshair select-none"
      style={{ height: 160 }}
      title="Click anywhere to trigger particle energy ripples!"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-pan-y"
      />
      {/* Subtle interactive hint */}
      <span className="pointer-events-none absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-wider text-[var(--text-dimmer)] backdrop-blur-xs opacity-60 transition-opacity group-hover:opacity-100">
        CLICK TO PULSE
      </span>
    </div>
  );
}
