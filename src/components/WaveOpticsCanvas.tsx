import { useRef, useEffect, useCallback } from "react";
import type { WaveOpticsParams, WaveOpticsResult } from "@/lib/waveOpticsEngine";

interface Props {
  params: WaveOpticsParams;
  result: WaveOpticsResult;
}

export default function WaveOpticsCanvas({ params, result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const padding = 50;

    if (params.problemType === "wavePropagation") {
      const centerY = H / 2;
      const lambda = params.wavelength;
      const f = params.frequency;
      const A = 20;
      const scaleX = (W - padding * 2) / 8;

      const t = (Date.now() / 200) % (1 / Math.max(f, 0.1));
      ctx.strokeStyle = "hsl(45, 90%, 55%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = padding; px <= W - padding; px += 2) {
        const x = (px - padding) / scaleX;
        const y = centerY + A * Math.sin(2 * Math.PI * (x / Math.max(lambda, 0.1) - f * t));
        if (px === padding) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`λ = ${params.wavelength} m`, W / 2 - 30, padding - 10);
      ctx.fillText(`v = ${result.waveSpeed?.toFixed(2) ?? "?"} m/s`, W / 2 - 35, H - 15);
    } else if (params.problemType === "doubleSlit") {
      const slitY = H / 2;
      const dPx = Math.min(params.slitSeparation * 8000, W * 0.4);
      const slitLeft = (W - dPx) / 2;
      const slitRight = slitLeft + dPx;

      ctx.fillStyle = "hsl(230, 20%, 15%)";
      ctx.fillRect(0, 0, W * 0.3, H);
      ctx.fillRect(slitLeft - 25, 0, 50, slitY - 20);
      ctx.fillRect(slitRight - 25, 0, 50, slitY - 20);
      ctx.fillRect(slitLeft - 25, slitY + 20, 50, H - slitY - 20);
      ctx.fillRect(slitRight - 25, slitY + 20, 50, H - slitY - 20);

      ctx.strokeStyle = "hsl(45, 90%, 55%)";
      ctx.lineWidth = 2;
      const rayCount = 7;
      for (let i = -Math.floor(rayCount / 2); i <= Math.floor(rayCount / 2); i++) {
        const spread = i * 0.12;
        ctx.beginPath();
        ctx.moveTo(W * 0.35, slitY);
        ctx.lineTo(slitLeft, slitY + spread * 35);
        ctx.moveTo(W * 0.35, slitY);
        ctx.lineTo(slitRight, slitY + spread * 35);
        ctx.stroke();
      }

      const screenX = W - padding - 40;
      ctx.fillStyle = "hsl(230, 20%, 20%)";
      ctx.fillRect(screenX, 0, 40, H);

      const β = result.fringeSpacing ?? 0.001;
      const fringeScale = Math.min(β * 80000, 35);
      ctx.fillStyle = "hsl(45, 90%, 70%)";
      for (let i = -4; i <= 4; i++) {
        const fy = slitY + i * fringeScale;
        if (fy > 15 && fy < H - 15) {
          const intensity = 1 - Math.abs(i) * 0.15;
          ctx.globalAlpha = Math.max(0.3, intensity);
          ctx.fillRect(screenX, fy - 3, 40, 6);
          ctx.globalAlpha = 1;
        }
      }

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(`β = ${result.fringeSpacing?.toExponential(2) ?? "?"} m`, W / 2 - 40, H - 10);
    } else if (params.problemType === "singleSlitDiffraction") {
      const slitY = H / 2;
      const slitX = W / 2;
      const slitW = 40;

      ctx.fillStyle = "hsl(230, 20%, 15%)";
      ctx.fillRect(0, 0, W * 0.35, H);
      ctx.fillRect(slitX - slitW - 30, 0, slitW + 30, slitY - 30);
      ctx.fillRect(slitX, 0, 30, slitY - 30);
      ctx.fillRect(slitX - slitW - 30, slitY + 30, slitW + 30, H - slitY - 30);
      ctx.fillRect(slitX, slitY + 30, 30, H - slitY - 30);

      const spread = 0.2;
      ctx.strokeStyle = "hsl(45, 90%, 55%)";
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(W * 0.4, slitY);
        ctx.lineTo(slitX, slitY + i * spread * 50);
        ctx.stroke();
      }

      const screenX = W - padding - 40;
      ctx.fillStyle = "hsl(230, 20%, 20%)";
      ctx.fillRect(screenX, 0, 40, H);

      ctx.fillStyle = "hsl(45, 90%, 70%)";
      ctx.globalAlpha = 1;
      ctx.fillRect(screenX, slitY - 8, 40, 16);
      for (let i = 1; i <= 2; i++) {
        ctx.globalAlpha = 0.7 - i * 0.2;
        ctx.fillRect(screenX, slitY - 8 - i * 25, 40, 12);
        ctx.fillRect(screenX, slitY + 8 + (i - 1) * 25, 40, 12);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("Central bright", slitX - 25, slitY - 40);
    } else if (params.problemType === "refraction") {
      const boundaryY = H / 2;
      const θ1 = (params.angleOfIncidence * Math.PI) / 180;
      const n1 = params.refractiveIndex1;
      const n2 = params.refractiveIndex2;
      const sinθ2 = (n1 * Math.sin(θ1)) / n2;
      const θ2 = Math.asin(Math.min(1, Math.max(-1, sinθ2)));

      ctx.fillStyle = "hsl(200, 30%, 95%)";
      ctx.fillRect(0, 0, W, boundaryY);
      ctx.fillStyle = "hsl(200, 50%, 88%)";
      ctx.fillRect(0, boundaryY, W, H - boundaryY);

      ctx.strokeStyle = "hsl(230, 25%, 40%)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, boundaryY);
      ctx.lineTo(W, boundaryY);
      ctx.stroke();

      const rayLen = 120;
      const incX = rayLen * Math.cos(θ1);
      const incY = -rayLen * Math.sin(θ1);
      const refX = rayLen * Math.cos(θ2);
      const refY = rayLen * Math.sin(θ2);

      const cx = W / 2;
      const cy = boundaryY;

      ctx.strokeStyle = "hsl(45, 90%, 50%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - incX, cy + incY);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + refX, cy + refY);
      ctx.stroke();

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`n₁ = ${n1}`, padding, boundaryY / 2 - 10);
      ctx.fillText(`n₂ = ${n2}`, padding, boundaryY + boundaryY / 2 + 10);
      ctx.fillText(`θ₂ = ${result.angleOfRefraction?.toFixed(1) ?? "?"}°`, cx + refX / 2 + 5, cy + refY / 2);
    } else if (params.problemType === "reflection") {
      const mirrorY = H / 2;
      const θ = (params.angleOfIncidence * Math.PI) / 180;
      const rayLen = 100;

      ctx.fillStyle = "hsl(200, 20%, 92%)";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "hsl(230, 30%, 50%)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(padding, mirrorY);
      ctx.lineTo(W - padding, mirrorY);
      ctx.stroke();

      const incX = rayLen * Math.cos(θ);
      const incY = -rayLen * Math.sin(θ);
      const reflX = rayLen * Math.cos(θ);
      const reflY = rayLen * Math.sin(θ);

      const cx = W / 2;
      const cy = mirrorY;

      ctx.strokeStyle = "hsl(45, 90%, 50%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - incX, cy + incY);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + reflX, cy - reflY);
      ctx.stroke();

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`θ = ${params.angleOfIncidence}°`, cx - 40, cy - 15);
      ctx.fillText("Mirror", W / 2 - 20, mirrorY + 20);
    }
  }, [params, result]);

  useEffect(() => {
    let frame: number;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-full min-h-[280px]" style={{ display: "block", width: "100%" }} />;
}
