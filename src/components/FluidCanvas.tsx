import { useRef, useEffect, useCallback } from "react";
import type { FluidParams, FluidResult } from "@/lib/fluidEngine";

interface Props {
  params: FluidParams;
  result: FluidResult;
}

export default function FluidCanvas({ params, result }: Props) {
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

    const padding = 40;

    if (params.problemType === "floatingBody") {
      const containerH = H - padding * 3;
      const containerW = W - padding * 2;
      const left = padding;
      const bottom = H - padding;
      const fluidTop = bottom - containerH * 0.8;
      const fluidH = bottom - fluidTop;

      ctx.fillStyle = "hsl(200, 60%, 85%)";
      ctx.fillRect(left, fluidTop, containerW, fluidH);
      ctx.strokeStyle = "hsl(230, 25%, 40%)";
      ctx.lineWidth = 2;
      ctx.strokeRect(left, fluidTop, containerW, fluidH);

      const fraction = result.fractionSubmerged ?? 0.6;
      const blockH = 36;
      const submergedH = blockH * fraction;
      const objY = bottom - fluidH * 0.5 - submergedH;
      const objX = left + containerW / 2 - 20;

      ctx.fillStyle = "hsl(30, 50%, 55%)";
      ctx.fillRect(objX, objY, 40, blockH);
      ctx.strokeStyle = "hsl(30, 50%, 40%)";
      ctx.strokeRect(objX, objY, 40, blockH);

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`Fraction submerged: ${(fraction * 100).toFixed(0)}%`, left + containerW / 2 - 45, fluidTop - 8);
    } else if (params.problemType === "continuity") {
      const centerY = H / 2;
      const r1 = Math.min(45, Math.sqrt(params.area1 / Math.PI) * 80) || 35;
      const r2 = Math.min(35, Math.sqrt(params.area2 / Math.PI) * 80) || 25;
      const pipeLen = (W - padding * 2) / 2;
      const left1 = padding;
      const left2 = W - padding - pipeLen;

      ctx.strokeStyle = "hsl(200, 40%, 50%)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(left1 + r1, centerY, r1, r1 * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left1 + r1, centerY);
      ctx.lineTo(left1 + pipeLen - r1, centerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(left1 + pipeLen - r1, centerY, r1, r1 * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(left2 + r2, centerY, r2, r2 * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left2 + r2, centerY);
      ctx.lineTo(left2 + pipeLen - r2, centerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(left2 + pipeLen - r2, centerY, r2, r2 * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      const flowOffset = (Date.now() / 80) % 80;
      ctx.strokeStyle = "hsl(200, 70%, 60%)";
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const x = left1 + ((flowOffset + i * 18) % (pipeLen + 50));
        ctx.beginPath();
        ctx.moveTo(x, centerY - 5);
        ctx.lineTo(x + 10, centerY);
        ctx.lineTo(x, centerY + 5);
        ctx.stroke();
      }

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`v₁ = ${params.velocity1} m/s`, left1 + pipeLen / 2 - 30, centerY - r1 - 10);
      ctx.fillText(`v₂ = ${result.velocity2?.toFixed(1) ?? "?"} m/s`, left2 + pipeLen / 2 - 30, centerY - r2 - 10);
    } else if (params.problemType === "effluxTank") {
      const tankW = W * 0.35;
      const tankH = H - padding * 2;
      const tankLeft = padding + 20;
      const tankTop = padding;
      const holeY = tankTop + tankH - 15;

      ctx.fillStyle = "hsl(200, 60%, 85%)";
      ctx.fillRect(tankLeft, tankTop, tankW, tankH);
      ctx.strokeStyle = "hsl(230, 25%, 40%)";
      ctx.lineWidth = 2;
      ctx.strokeRect(tankLeft, tankTop, tankW, tankH);

      const v = result.effluxVelocity ?? 12;
      const t = (Date.now() % 2000) / 2000;
      const jetLen = 40 + t * 80;
      const jetW = 8;

      ctx.fillStyle = "hsl(200, 70%, 60%)";
      ctx.beginPath();
      ctx.ellipse(tankLeft + tankW, holeY, jetW, 6, 0, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.fillRect(tankLeft + tankW, holeY - 6, jetLen, 12);

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`h = ${params.waterLevel} m`, tankLeft + tankW / 2 - 15, tankTop - 6);
      ctx.fillText(`v = ${v.toFixed(1)} m/s`, tankLeft + tankW + jetLen - 20, holeY + 25);
    } else if (params.problemType === "hydraulicLift") {
      const centerX = W / 2;
      const smallH = 25;
      const largeH = 35;
      const smallW = 50;
      const largeW = 80;

      const pressPhase = (Date.now() % 3000) / 3000;
      const smallY = padding + 60 + (pressPhase < 0.3 ? pressPhase * 50 : 0.3 * 50);
      const largeY = H - padding - 80 - (pressPhase > 0.3 && pressPhase < 0.6 ? (pressPhase - 0.3) * 60 : 0);

      ctx.fillStyle = "hsl(230, 30%, 70%)";
      ctx.fillRect(centerX - smallW - 60, smallY, smallW, smallH);
      ctx.fillRect(centerX + 60, largeY, largeW, largeH);
      ctx.strokeStyle = "hsl(230, 25%, 40%)";
      ctx.strokeRect(centerX - smallW - 60, smallY, smallW, smallH);
      ctx.strokeRect(centerX + 60, largeY, largeW, largeH);

      ctx.fillStyle = "hsl(200, 60%, 85%)";
      ctx.fillRect(centerX - smallW - 65, smallY + smallH, smallW + 10, 40);
      ctx.fillRect(centerX + 55, largeY - 40, largeW + 10, 40);

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("Small", centerX - smallW - 45, smallY - 5);
      ctx.fillText("Large", centerX + 90, largeY - 10);
    } else if (params.problemType === "waterJetProjectile") {
      const jetX = padding + 40;
      const jetY = padding + 80;
      const v0 = params.jetVelocity;
      const h = params.jetHeight;
      const g = 9.8;
      const scale = Math.min(W / 15, H / 8);

      ctx.fillStyle = "hsl(200, 30%, 92%)";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "hsl(230, 40%, 60%)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jetX - 20, jetY);
      ctx.lineTo(jetX, jetY);
      ctx.stroke();

      const t = (Date.now() % 1500) / 1500;
      const steps = 30;
      ctx.strokeStyle = "hsl(200, 70%, 55%)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const ti = (t + i / steps) * 0.5;
        const x = jetX + v0 * ti * scale * 0.5;
        const y = jetY + 0.5 * g * ti * ti * scale * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`v₀ = ${v0} m/s`, jetX - 15, jetY - 15);
      ctx.fillText(`h = ${h} m`, jetX - 10, jetY + 30);
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

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}
