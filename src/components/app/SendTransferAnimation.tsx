"use client";

import { useEffect, useRef } from "react";

interface TransferPacket {
  progress: number;
  speed: number;
  yOffset: number;
  size: number;
  color: string;
}

interface TransferSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export function SendTransferAnimation() {
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

    // Particles and interactive states
    const packets: TransferPacket[] = Array.from({ length: 12 }).map((_, i) => ({
      progress: i / 12,
      speed: 0.005 + Math.random() * 0.003,
      yOffset: (Math.random() - 0.5) * 20,
      size: 2.2 + Math.random() * 1.5,
      color: Math.random() > 0.3 ? "#C9A2FF" : "#EBDDFF",
    }));

    const sparks: TransferSpark[] = [];
    let recipientFlash = 0;
    let senderFlash = 0;
    let centerNexusPulse = 0;

    const triggerBurstTransfer = (originX = 55, originY = height * 0.5) => {
      senderFlash = 1.0;
      centerNexusPulse = 1.0;
      for (let i = 0; i < 24; i++) {
        const ang = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4;
        const spd = 1.5 + Math.random() * 4;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 30 + Math.random() * 20,
          color: Math.random() > 0.4 ? "#9C48F0" : "#C9A2FF",
        });
      }
      // Speed up packets temporarily
      packets.forEach((p) => {
        p.speed += 0.006;
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerBurstTransfer(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      const centerY = height * 0.5;
      const senderX = 50;
      const recipientX = width - 50;
      const centerX = width * 0.5;

      // 1. Background dark gradient
      const bg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7);
      bg.addColorStop(0, "rgba(22, 12, 46, 0.6)");
      bg.addColorStop(0.6, "rgba(14, 9, 26, 0.85)");
      bg.addColorStop(1, "rgba(10, 6, 18, 0.98)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // 2. Cryptographic Vault Enclosure (Boundary box)
      const vaultPadX = 14;
      const vaultPadY = 12;
      const vaultW = width - vaultPadX * 2;
      const vaultH = height - vaultPadY * 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vaultPadX, vaultPadY, vaultW, vaultH, 12);
      ctx.fillStyle = "rgba(156, 72, 240, 0.02)";
      ctx.fill();
      ctx.strokeStyle = "rgba(201, 162, 255, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Top Vault Label
      ctx.fillStyle = "rgba(201, 162, 255, 0.75)";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SHIELDEDPOOL CONTRACT VAULT", centerX, vaultPadY + 10);

      // Bottom Guarantee Label
      ctx.fillStyle = "rgba(156, 72, 240, 0.85)";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("ZERO EXTERNAL TOKEN MOVEMENT · INTERNAL LEDGER MUTATION", centerX, height - vaultPadY - 8);

      // 3. Central Ledger Conduit Track
      ctx.beginPath();
      ctx.moveTo(senderX, centerY);
      ctx.lineTo(recipientX, centerY);
      ctx.strokeStyle = "rgba(201, 162, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing core track
      const trackGlow = ctx.createLinearGradient(senderX, centerY, recipientX, centerY);
      trackGlow.addColorStop(0, "rgba(156, 72, 240, 0.6)");
      trackGlow.addColorStop(0.5, "rgba(235, 221, 255, 0.8)");
      trackGlow.addColorStop(1, "rgba(201, 162, 255, 0.6)");
      ctx.beginPath();
      ctx.moveTo(senderX, centerY);
      ctx.lineTo(recipientX, centerY);
      ctx.strokeStyle = trackGlow;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. Central Verification Nexus
      if (centerNexusPulse > 0) centerNexusPulse = Math.max(0, centerNexusPulse - 0.025);
      const nexusSize = 18 + Math.sin(elapsed * 3) * 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(elapsed * 0.8);
      ctx.strokeStyle = `rgba(156, 72, 240, ${0.5 + centerNexusPulse * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-nexusSize * 0.5, -nexusSize * 0.5, nexusSize, nexusSize);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20, 8, 48, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "#C9A2FF";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#EBDDFF";
      ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("LEDGER", centerX, centerY);

      // 5. Transfer Packets Flowing Left to Right
      for (const pkt of packets) {
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.speed = 0.005 + Math.random() * 0.003;
          pkt.yOffset = (Math.random() - 0.5) * 20;
          recipientFlash = Math.max(recipientFlash, 0.6);

          // Spawn arrival spark
          for (let s = 0; s < 2; s++) {
            const ang = Math.random() * Math.PI * 2;
            sparks.push({
              x: recipientX,
              y: centerY,
              vx: Math.cos(ang) * (1 + Math.random() * 2),
              vy: Math.sin(ang) * (1 + Math.random() * 2),
              life: 0,
              maxLife: 20,
              color: "#C9A2FF",
            });
          }
        }

        const t = pkt.progress;
        // Bezier arch towards center and into recipient
        const px = senderX + t * (recipientX - senderX);
        const py = centerY + Math.sin(t * Math.PI) * pkt.yOffset;
        const alpha = Math.sin(t * Math.PI);

        // Packet outer glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, pkt.size * 2.8);
        glow.addColorStop(0, `rgba(201, 162, 255, ${alpha * 0.95})`);
        glow.addColorStop(1, "rgba(156, 72, 240, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, pkt.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Packet bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, pkt.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Sender Node (Left)
      if (senderFlash > 0) senderFlash = Math.max(0, senderFlash - 0.03);
      const senderPulse = (Math.sin(elapsed * 2.5) + 1) * 0.5;

      // Halo ring
      ctx.beginPath();
      ctx.arc(senderX, centerY, 20 + senderPulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(156, 72, 240, ${0.3 + senderFlash * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Node base
      ctx.beginPath();
      ctx.arc(senderX, centerY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(28, 12, 60, 0.95)";
      ctx.fill();
      ctx.strokeStyle = senderFlash > 0 ? "#FFFFFF" : "#9C48F0";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("SENDER", senderX, centerY - 4);
      ctx.fillStyle = "#C9A2FF";
      ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("0xYOU", senderX, centerY + 5);

      // 7. Recipient Node (Right)
      if (recipientFlash > 0) recipientFlash = Math.max(0, recipientFlash - 0.03);
      const recPulse = (Math.sin(elapsed * 2.5 + Math.PI) + 1) * 0.5;

      // Halo ring
      ctx.beginPath();
      ctx.arc(recipientX, centerY, 20 + recPulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 162, 255, ${0.3 + recipientFlash * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Node base
      ctx.beginPath();
      ctx.arc(recipientX, centerY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(18, 28, 48, 0.95)";
      ctx.fill();
      ctx.strokeStyle = recipientFlash > 0 ? "#FFFFFF" : "#38BDF8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("RECEIVER", recipientX, centerY - 4);
      ctx.fillStyle = "#38BDF8";
      ctx.font = "bold 7px ui-sans-serif, system-ui, -apple-system";
      ctx.fillText("0xDEST", recipientX, centerY + 5);

      // 8. Update & Draw Sparks
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
  }, []);

  return (
    <div
      aria-hidden="true"
      className="group relative w-full overflow-hidden rounded-xl border border-[var(--app-border-strong)] bg-[#120D20] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] cursor-pointer select-none"
      style={{ height: 165 }}
      title="Click to simulate internal shielded transfer!"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-pan-y"
      />
      <span className="pointer-events-none absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-wider text-[var(--text-dimmer)] backdrop-blur-xs opacity-60 transition-opacity group-hover:opacity-100">
        CLICK TO SIMULATE INTERNAL MOVE
      </span>
    </div>
  );
}
