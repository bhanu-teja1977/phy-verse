import { TrendingUp, Zap, Scale, Droplets } from "lucide-react";
import type { FluidResult } from "@/lib/fluidEngine";

interface Props {
  result: FluidResult;
}

export default function FluidResultsPanel({ result }: Props) {
  if (result.error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm">
        {result.error}
      </div>
    );
  }

  let items: { label: string; value: number | string; unit: string; icon: typeof Droplets; format?: (v: number) => string }[] = [];

  if (result.problemType === "floatingBody") {
    items = [
      {
        label: "Fraction Submerged",
        value: (result.fractionSubmerged ?? 0) * 100,
        unit: "%",
        icon: Droplets,
        format: v => v.toFixed(1),
      },
      { label: "Buoyant Force", value: result.buoyantForce ?? 0, unit: "N", icon: Scale },
      { label: "Weight", value: result.weight ?? 0, unit: "N", icon: Scale },
    ];
  } else if (result.problemType === "continuity") {
    items = [{ label: "Velocity 2", value: result.velocity2 ?? 0, unit: "m/s", icon: Zap }];
  } else if (result.problemType === "effluxTank") {
    items = [{ label: "Efflux Velocity", value: result.effluxVelocity ?? 0, unit: "m/s", icon: Zap }];
  } else if (result.problemType === "hydraulicLift") {
    items = [{ label: "Large Piston Force", value: result.largePistonForce ?? 0, unit: "N", icon: Scale }];
  } else if (result.problemType === "waterJetProjectile") {
    items = [];
  } else if (result.problemType === "pressureDepthCalc") {
    items = [{ label: "Pressure", value: result.pressure ?? 0, unit: "Pa", icon: Scale }];
  } else if (result.problemType === "buoyantForceCalc") {
    items = [{ label: "Buoyant Force", value: result.buoyantForce ?? 0, unit: "N", icon: Droplets }];
  } else if (result.problemType === "bernoulliCalc" || result.problemType === "reynoldsCalc") {
    items = [];
  }

  if (items.length === 0 && result.equationsUsed.length > 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-lg">Results</h3>
        <div className="space-y-2">
          {result.equationsUsed.map((eq, i) => (
            <p key={i} className="font-mono text-sm text-foreground">
              {eq}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
      <h3 className="font-semibold text-foreground text-lg">Results</h3>
      <div className="grid gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          const fmt = item.format ?? (v => (typeof v === "number" ? v.toFixed(2) : String(v)));
          const val = fmt(typeof item.value === "number" ? item.value : 0);
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary text-primary">
                  <Icon size={14} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {val} {item.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
