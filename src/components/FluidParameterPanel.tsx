import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Droplets, Zap, ArrowRight } from "lucide-react";
import type { FluidParams } from "@/lib/fluidEngine";

interface Props {
  params: FluidParams;
  onChange: (key: keyof FluidParams, value: number) => void;
}

const floatingBodyFields = [
  { key: "objectDensity" as const, label: "Object Density", unit: "kg/m³", min: 100, step: 10, icon: Droplets },
  { key: "fluidDensity" as const, label: "Fluid Density", unit: "kg/m³", min: 100, step: 10, icon: Droplets },
];

const continuityFields = [
  { key: "area1" as const, label: "Area 1", unit: "m²", min: 0.01, step: 0.01, icon: ArrowRight },
  { key: "velocity1" as const, label: "Velocity 1", unit: "m/s", min: 0.1, step: 0.1, icon: Zap },
  { key: "area2" as const, label: "Area 2", unit: "m²", min: 0.01, step: 0.01, icon: ArrowRight },
];

const effluxFields = [
  { key: "waterLevel" as const, label: "Water Level", unit: "m", min: 0.5, step: 0.5, icon: Droplets },
  { key: "gravity" as const, label: "Gravity", unit: "m/s²", min: 1, step: 0.1, icon: Zap },
];

const hydraulicFields = [
  { key: "smallPistonArea" as const, label: "Small Piston Area", unit: "m²", min: 0.001, step: 0.001, icon: ArrowRight },
  { key: "largePistonArea" as const, label: "Large Piston Area", unit: "m²", min: 0.01, step: 0.01, icon: ArrowRight },
  { key: "appliedForce" as const, label: "Applied Force", unit: "N", min: 1, step: 10, icon: Scale },
];

const waterJetFields = [
  { key: "jetVelocity" as const, label: "Jet Velocity", unit: "m/s", min: 1, step: 0.5, icon: Zap },
  { key: "jetHeight" as const, label: "Height", unit: "m", min: 0.1, step: 0.1, icon: Droplets },
];

const pressureFields = [
  { key: "fluidDensity" as const, label: "Fluid Density", unit: "kg/m³", min: 100, step: 10, icon: Droplets },
  { key: "depth" as const, label: "Depth", unit: "m", min: 0.1, step: 0.5, icon: Zap },
];

const buoyantForceFields = [
  { key: "objectVolume" as const, label: "Object Volume", unit: "m³", min: 0.001, step: 0.001, icon: Droplets },
  { key: "fluidDensity" as const, label: "Fluid Density", unit: "kg/m³", min: 100, step: 10, icon: Droplets },
];

const CALC_ONLY_TYPES = ["pressureDepthCalc", "buoyantForceCalc", "bernoulliCalc", "reynoldsCalc"];

export default function FluidParameterPanel({ params, onChange }: Props) {
  const isCalcOnly = CALC_ONLY_TYPES.includes(params.problemType);

  const fields =
    params.problemType === "floatingBody"
      ? floatingBodyFields
      : params.problemType === "continuity"
        ? continuityFields
        : params.problemType === "effluxTank"
          ? effluxFields
          : params.problemType === "hydraulicLift"
            ? hydraulicFields
            : params.problemType === "waterJetProjectile"
              ? waterJetFields
              : params.problemType === "buoyantForceCalc"
                ? buoyantForceFields
                : pressureFields;

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-5">
      <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
      {fields.map(config => {
        const Icon = config.icon;
        const id = `fluid-param-${config.key}`;
        const val = params[config.key] ?? 0;
        return (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary text-primary">
                  <Icon size={14} />
                </div>
                <Label htmlFor={id} className="text-sm font-medium text-foreground">
                  {config.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{config.unit}</span>
            </div>
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              step={config.step}
              min={config.min}
              value={Number.isFinite(val) ? val : ""}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) onChange(config.key, v);
              }}
              readOnly={isCalcOnly}
              className={isCalcOnly ? "opacity-75" : ""}
            />
          </div>
        );
      })}
    </div>
  );
}
