import { useRef, useEffect, useCallback } from "react";

interface Props {
  trajectory: { x: number; y: number; t: number }[];
  currentStep: number;
  objectName: string;
  isProjectile: boolean;
}

export default function SimulationCanvas({ trajectory, currentStep, objectName, isProjectile }: Props) {
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

    // Compute bounds
    const maxX = Math.max(...trajectory.map(p => p.x), 1);
    const maxY = Math.max(...trajectory.map(p => p.y), 1);
    const padding = 60;
    const plotW = W - padding * 2;
    const plotH = H - padding * 2;

    const scaleX = plotW / (maxX * 1.1);
    const scaleY = plotH / (maxY * 1.1);

    const toScreenX = (x: number) => padding + x * scaleX;
    const toScreenY = (y: number) => H - padding - y * scaleY;

    // Grid
    ctx.strokeStyle = "hsl(230, 15%, 88%)";
    ctx.lineWidth = 1;
    const gridLinesX = 5;
    const gridLinesY = 4;
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "hsl(230, 10%, 50%)";
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

    // Axes
    ctx.strokeStyle = "hsl(230, 25%, 25%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, H - padding);
    ctx.lineTo(W - padding, H - padding);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "hsl(230, 10%, 40%)";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isProjectile ? "Distance (m)" : "Distance (m)", W / 2, H - 10);
    ctx.save();
    ctx.translate(16, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(isProjectile ? "Height (m)" : "Height (m)", 0, 0);
    ctx.restore();

    // Trajectory path (dashed up to full)
    ctx.setLineDash([4, 4]);
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
  }, [trajectory, currentStep, objectName, isProjectile]);

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
