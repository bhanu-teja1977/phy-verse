import { useRef, useEffect, useCallback } from "react";

interface Props {
  trajectory: { x: number; y: number; t: number }[];
  currentStep: number;
  objectName: string;
  isProjectile: boolean;
  isCircular?: boolean;
  isInclined?: boolean;
  isInclinedProjectile?: boolean;
  inclineAngle?: number;
}

export default function SimulationCanvas({ trajectory, currentStep, objectName, isProjectile, isCircular = false, isInclined = false, isInclinedProjectile = false, inclineAngle = 30 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || trajectory.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const padding = 60;
    const plotW = W - padding * 2;
    const plotH = H - padding * 2;

    let toScreenX: (x: number) => number;
    let toScreenY: (y: number) => number;
    let maxX: number;
    let maxY: number;

    const showInclined = isInclined || isInclinedProjectile;
    const thetaRad = (inclineAngle * Math.PI) / 180;

    if (isCircular) {
      const maxR = Math.max(
        ...trajectory.map(p => Math.sqrt(p.x * p.x + p.y * p.y)),
        1
      );
      const scale = Math.min(plotW, plotH) / (maxR * 2.2);
      const cx = W / 2;
      const cy = H / 2;
      toScreenX = (x: number) => cx + x * scale;
      toScreenY = (y: number) => cy - y * scale;
      maxX = maxR;
      maxY = maxR;
    } else {
      maxX = Math.max(...trajectory.map(p => p.x), 1);
      maxY = Math.max(...trajectory.map(p => p.y), 1);
      if (showInclined) {
        maxX = Math.max(maxX, 15);
        maxY = Math.max(maxY, 10);
      }
      const scaleX = plotW / (maxX * 1.1);
      const scaleY = plotH / (maxY * 1.1);
      toScreenX = (x: number) => padding + x * scaleX;
      toScreenY = (y: number) => H - padding - y * scaleY;
    }

    ctx.strokeStyle = "hsl(230, 15%, 88%)";
    ctx.lineWidth = 1;
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "hsl(230, 10%, 50%)";

    if (isCircular) {
      const cx = W / 2;
      const cy = H / 2;
      ctx.textAlign = "center";
      ctx.beginPath();
      ctx.moveTo(cx, padding);
      ctx.lineTo(cx, H - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(W - padding, cy);
      ctx.stroke();
      ctx.fillText("x (m)", W / 2, H - 10);
      ctx.save();
      ctx.translate(16, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("y (m)", 0, 0);
      ctx.restore();
    } else {
      const gridLinesX = 5;
      const gridLinesY = 4;
      ctx.textAlign = "center";
      for (let i = 0; i <= gridLinesX; i++) {
        const val = (maxX * 1.1 * i) / gridLinesX;
        const x = toScreenX(val);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, H - padding);
        ctx.stroke();
        ctx.fillText(val.toFixed(0), x, H - padding + 18);
      }
      ctx.textAlign = "right";
      for (let i = 0; i <= gridLinesY; i++) {
        const val = (maxY * 1.1 * i) / gridLinesY;
        const y = toScreenY(val);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(W - padding, y);
        ctx.stroke();
        ctx.fillText(val.toFixed(0), padding - 8, y + 4);
      }
      ctx.strokeStyle = "hsl(230, 25%, 25%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, H - padding);
      ctx.lineTo(W - padding, H - padding);
      ctx.stroke();
      ctx.fillStyle = "hsl(230, 10%, 40%)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isProjectile ? "Distance (m)" : "Distance (m)", W / 2, H - 10);
      ctx.save();
      ctx.translate(16, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(isProjectile ? "Height (m)" : "Height (m)", 0, 0);
      ctx.restore();
    }

    if (isCircular) {
      const cx = W / 2;
      const cy = H / 2;
      ctx.fillStyle = "hsl(230, 20%, 70%)";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showInclined) {
      if (inclineAngle <= 0) {
        ctx.strokeStyle = "hsl(25, 70%, 45%)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(toScreenX(0), toScreenY(0));
        ctx.lineTo(toScreenX(maxX * 1.1), toScreenY(0));
        ctx.stroke();
      } else {
        const cosT = Math.max(Math.cos(thetaRad), 0.01);
        const sinT = Math.max(Math.sin(thetaRad), 0.01);
        const slopeLen = Math.max(maxX / cosT, maxY / sinT) * 1.1;
        const sx = slopeLen * cosT;
        const sy = slopeLen * sinT;
        ctx.strokeStyle = "hsl(25, 70%, 45%)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(toScreenX(0), toScreenY(0));
        ctx.lineTo(toScreenX(sx), toScreenY(sy));
        ctx.stroke();
      }
      ctx.strokeStyle = "hsl(230, 15%, 88%)";
      ctx.lineWidth = 1;
    }

    // Trajectory path (dashed up to full)
    ctx.setLineDash(isCircular ? [] : [4, 4]);
    ctx.strokeStyle = "hsl(252, 56%, 57%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trajectory.length; i++) {
      const sx = toScreenX(trajectory[i].x);
      const sy = toScreenY(trajectory[i].y);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Current position dot
    const step = Math.min(currentStep, trajectory.length - 1);
    const pos = trajectory[step];
    const dotX = toScreenX(pos.x);
    const dotY = toScreenY(pos.y);

    // Glow
    const grad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 20);
    grad.addColorStop(0, "hsla(252, 56%, 57%, 0.4)");
    grad.addColorStop(1, "hsla(252, 56%, 57%, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Dot
    ctx.fillStyle = "hsl(252, 56%, 57%)";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "hsl(252, 56%, 70%)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = "hsl(230, 25%, 10%)";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(objectName.toLowerCase(), dotX, dotY - 16);
  }, [trajectory, currentStep, objectName, isProjectile, isCircular, isInclined, isInclinedProjectile, inclineAngle]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
