"use client";

import { useEffect, useRef } from "react";
import type { SonicState } from "@/lib/sonic-client";

const STATE_COLORS: Record<SonicState, { glow: string; ring: string; label: string }> = {
  idle: { glow: "rgba(156,163,175,0.2)", ring: "#9CA3AF", label: "Ready" },
  connecting: { glow: "rgba(59,130,246,0.3)", ring: "#3B82F6", label: "Connecting..." },
  listening: { glow: "rgba(59,130,246,0.4)", ring: "#1E40AF", label: "Listening" },
  thinking: { glow: "rgba(245,158,11,0.4)", ring: "#D97706", label: "Looking up data..." },
  speaking: { glow: "rgba(16,185,129,0.4)", ring: "#059669", label: "Nova Sonic" },
};

export function SonicVisualizer({
  state,
  amplitude,
}: {
  state: SonicState;
  amplitude: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const smoothAmplitude = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    canvas.width = size * 2; // retina
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);

    const center = size / 2;
    const baseRadius = 28;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Smooth amplitude
      const target = amplitude;
      smoothAmplitude.current += (target - smoothAmplitude.current) * 0.15;
      const amp = smoothAmplitude.current;

      const colors = STATE_COLORS[state];
      const pulseRadius = baseRadius + amp * 60;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        center, center, pulseRadius * 0.5,
        center, center, pulseRadius * 1.5
      );
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(center, center, pulseRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main orb
      const orbGradient = ctx.createRadialGradient(
        center - 5, center - 5, 2,
        center, center, pulseRadius
      );
      orbGradient.addColorStop(0, "rgba(255,255,255,0.9)");
      orbGradient.addColorStop(0.4, colors.ring);
      orbGradient.addColorStop(1, colors.glow);
      ctx.beginPath();
      ctx.arc(center, center, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGradient;
      ctx.fill();

      // Ring
      ctx.beginPath();
      ctx.arc(center, center, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = colors.ring;
      ctx.lineWidth = 2;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [state, amplitude]);

  const colors = STATE_COLORS[state];

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={canvasRef} />
      <span
        className="text-[10px] font-semibold tracking-wide"
        style={{ color: colors.ring }}
      >
        {colors.label}
      </span>
    </div>
  );
}
