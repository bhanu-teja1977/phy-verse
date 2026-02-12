import { Zap, Sliders, Target } from "lucide-react";
import type { WaveOpticsResult } from "@/lib/waveOpticsEngine";

interface Props {
  result: WaveOpticsResult;
}

export default function WaveOpticsResultsPanel({ result }: Props) {
  if (result.error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm">
        {result.error}
      </div>
    );
  }

  let items: { label: string; value: number; unit: string; icon: typeof Zap; format?: (v: number) => string }[] = [];

  if (result.problemType === "wavePropagation" || result.problemType === "waveSpeedCalc") {
    items = [
      { label: "Wave Speed", value: result.waveSpeed!, unit: "m/s", icon: Zap },
      { label: "Period", value: result.period!, unit: "s", icon: Sliders },
    ];
  } else if (result.problemType === "doubleSlit" || result.problemType === "fringeSpacingCalc") {
    items = [
      {
        label: "Fringe Spacing",
        value: result.fringeSpacing!,
        unit: "m",
        icon: Target,
        format: (v: number) => v.toExponential(2),
      },
    ];
  } else if (result.problemType === "singleSlitDiffraction") {
    items = [
      {
        label: "First Minima Angle",
        value: result.firstMinimaAngle ?? 0,
        unit: "°",
        icon: Target,
        format: (v: number) => v.toFixed(2),
      },
    ];
  } else if (result.problemType === "refraction" || result.problemType === "snellCalc") {
    items = [
      {
        label: "Angle of Refraction",
        value: result.angleOfRefraction!,
        unit: "°",
        icon: Target,
        format: (v: number) => v.toFixed(2),
      },
    ];
  } else if (result.problemType === "reflection") {
    items = [
      {
        label: "Angle of Reflection",
        value: result.angleOfRefraction ?? 0,
        unit: "°",
        icon: Target,
        format: (v: number) => v.toFixed(2),
      },
    ];
  } else if (result.problemType === "criticalAngle") {
    items = [
      {
        label: "Critical Angle",
        value: result.criticalAngle!,
        unit: "°",
        icon: Target,
        format: (v: number) => v.toFixed(2),
      },
    ];
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
      <h3 className="font-semibold text-foreground text-lg">Results</h3>
      <div className="grid gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          const fmt = item.format ?? ((v: number) => v.toFixed(2));
          const val = fmt(item.value);
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary text-accent">
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
