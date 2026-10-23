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

interface Particle {
  progress: number;
  speed: number;
  curveY: number;
  targetIndex: number;
  size: number;
}

export function ShieldCanvasAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 428);
    let height = (canvas.height = 156);

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = 156;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // Honeycomb cluster definition
    const hexRadius = 13;
    const hexH = Math.sqrt(3) * hexRadius;
    const hexPositions: { x: number; y: number; flash: number; active: boolean }[] = [];

    const generateHoneycomb = () => {
      hexPositions.length = 0;
      const clusterCenterX = Math.max(width * 0.75, width - 120);
      const clusterCenterY = height * 0.48;

      const cols = 6;
      const rows = 4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offsetX = (c - cols / 2) * (hexRadius * 1.5);
          const offsetY = (r - rows / 2) * hexH + ((c % 2) * hexH) / 2;
          const dist = Math.hypot(offsetX, offsetY);
          // Keep an organic cluster boundary
          if (dist < hexRadius * 4.2) {
            hexPositions.push({
              x: clusterCenterX + offsetX,
              y: clusterCenterY + offsetY,
              flash: 0,
              active: (r + c) % 3 === 0,
            });
          }
        }
      }
    };

    generateHoneycomb();

    // Flowing particles
    const particles: Particle[] = Array.from({ length: 14 }).map((_, i) => ({
      progress: i / 14 + Math.random() * 0.05,
      speed: 0.005 + Math.random() * 0.004,
      curveY: (Math.random() - 0.5) * 55,
      targetIndex: Math.floor(Math.random() * Math.max(hexPositions.length, 1)),
      size: 2 + Math.random() * 1.5,
    }));

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const youX = 64;
      const youY = height * 0.52;
      const poolClusterX = Math.max(width * 0.75, width - 120);
      const poolClusterY = height * 0.48;

      // Deep purple ambient glow on YOU node
      const bgGlow = ctx.createRadialGradient(youX, youY, 0, youX, youY, 95);
      bgGlow.addColorStop(0, "rgba(156, 72, 240, 0.16)");
      bgGlow.addColorStop(1, "rgba(156, 72, 240, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 1. Radar expanding waves from YOU (Electric Ultra Purple / Lilac)
      const radarPeriod = 2.4;
      for (let w = 0; w < 3; w++) {
        const phase = (elapsed / radarPeriod + w / 3) % 1;
        const r = 16 + phase * 42;
        const alpha = Math.max(0, 1 - phase) * 0.4;
        ctx.beginPath();
        ctx.arc(youX, youY, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 162, 255, ${alpha})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // 2. YOU Central Node (Deep Iris & Ultra Purple)
      drawHex(ctx, youX, youY, 20, "rgba(36, 16, 85, 0.95)", "#9C48F0", 1.8);
      const pulseCore = 0.7 + Math.sin(elapsed * 4) * 0.3;
      drawHex(
        ctx,
        youX,
        youY,
        12,
        `rgba(201, 162, 255, ${0.4 * pulseCore})`,
        "#C9A2FF",
        1.2
      );

      // YOU Badge Pill
      const badgeY = youY - 32;
      ctx.fillStyle = "rgba(156, 72, 240, 0.25)";
      ctx.strokeStyle = "#9C48F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(youX - 18, badgeY - 8, 36, 16, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("YOU", youX, badgeY);

      // 3. Render Honeycomb Pool Cells (Spectre Lilac & Purple Theme)
      if (hexPositions.length === 0) generateHoneycomb();

      for (let i = 0; i < hexPositions.length; i++) {
        const h = hexPositions[i];
        if (!h) continue;

        // Flash decay
        if (h.flash > 0) h.flash = Math.max(0, h.flash - 0.03);

        const isPulsing = h.active;
        const pulse = isPulsing ? (Math.sin(elapsed * 3 + i) + 1) * 0.5 : 0;

        let fill = "rgba(156, 72, 240, 0.06)";
        let stroke = "rgba(201, 162, 255, 0.16)";

        if (h.flash > 0) {
          fill = `rgba(201, 162, 255, ${0.25 + h.flash * 0.55})`;
          stroke = `rgba(255, 255, 255, ${0.4 + h.flash * 0.6})`;
        } else if (isPulsing) {
          fill = `rgba(156, 72, 240, ${0.12 + pulse * 0.18})`;
          stroke = `rgba(201, 162, 255, ${0.25 + pulse * 0.35})`;
        }

        drawHex(ctx, h.x, h.y, hexRadius, fill, stroke, 1);
      }

      // POOL Label
      ctx.fillStyle = "rgba(235, 221, 255, 0.65)";
      ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("POOL", poolClusterX, poolClusterY + 44);

      // 4. Flowing Particles & Guide Lines (Lilac/Ultra stream)
      ctx.save();
      for (const p of particles) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.speed = 0.005 + Math.random() * 0.004;
          p.curveY = (Math.random() - 0.5) * 55;
          p.targetIndex = Math.floor(Math.random() * hexPositions.length);
          const target = hexPositions[p.targetIndex];
          if (target) target.flash = 1.0;
        }

        const target = hexPositions[p.targetIndex] || { x: poolClusterX, y: poolClusterY };

        // Quadratic Bezier interpolation
        const t = p.progress;
        const cpX = (youX + target.x) * 0.5;
        const cpY = (youY + target.y) * 0.5 + p.curveY;

        const invT = 1 - t;
        const px = invT * invT * youX + 2 * invT * t * cpX + t * t * target.x;
        const py = invT * invT * youY + 2 * invT * t * cpY + t * t * target.y;

        // Particle head with luminous lilac glow
        const particleAlpha = Math.sin(t * Math.PI);
        const pGlow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.8);
        pGlow.addColorStop(0, `rgba(201, 162, 255, ${particleAlpha * 0.95})`);
        pGlow.addColorStop(1, "rgba(156, 72, 240, 0)");

        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden rounded-xl border border-[var(--app-border-strong)] bg-[#130E22]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
      style={{ height: 156 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-pan-y"
      />
    </div>
  );
}
