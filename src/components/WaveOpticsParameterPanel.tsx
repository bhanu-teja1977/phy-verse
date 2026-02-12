import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Sliders, Target } from "lucide-react";
import type { WaveOpticsParams } from "@/lib/waveOpticsEngine";

interface Props {
  params: WaveOpticsParams;
  onChange: (key: keyof WaveOpticsParams, value: number) => void;
}

const waveFields = [
  { key: "wavelength" as const, label: "Wavelength", unit: "m", min: 0.1, step: 0.1, icon: Zap },
  { key: "frequency" as const, label: "Frequency", unit: "Hz", min: 0.1, step: 0.1, icon: Sliders },
];

const doubleSlitFields = [
  { key: "wavelength" as const, label: "Wavelength", unit: "nm", min: 100, step: 1, icon: Zap, inNm: true },
  { key: "slitSeparation" as const, label: "Slit Separation", unit: "mm", min: 0.01, step: 0.01, icon: Sliders, inMm: true },
  { key: "screenDistance" as const, label: "Screen Distance", unit: "m", min: 0.5, step: 0.1, icon: Target },
];

const singleSlitFields = [
  { key: "wavelength" as const, label: "Wavelength", unit: "nm", min: 100, step: 1, icon: Zap, inNm: true },
  { key: "slitWidth" as const, label: "Slit Width", unit: "mm", min: 0.01, step: 0.01, icon: Sliders, inMm: true },
];

const refractionFields = [
  { key: "refractiveIndex1" as const, label: "n₁ (Medium 1)", unit: "", min: 1, step: 0.01, icon: Sliders },
  { key: "refractiveIndex2" as const, label: "n₂ (Medium 2)", unit: "", min: 1, step: 0.01, icon: Sliders },
  { key: "angleOfIncidence" as const, label: "Angle of Incidence", unit: "°", min: 0, step: 1, icon: Target },
];

const reflectionFields = [
  { key: "angleOfIncidence" as const, label: "Angle of Incidence", unit: "°", min: 0, step: 1, icon: Target },
];

const criticalAngleFields = [
  { key: "refractiveIndex1" as const, label: "n₁ (Denser medium)", unit: "", min: 1, step: 0.01, icon: Sliders },
  { key: "refractiveIndex2" as const, label: "n₂ (Rarer medium)", unit: "", min: 1, step: 0.01, icon: Sliders },
];

const CALC_ONLY_TYPES = ["fringeSpacingCalc", "snellCalc", "waveSpeedCalc", "criticalAngle"];

export default function WaveOpticsParameterPanel({ params, onChange }: Props) {
  const isCalcOnly = CALC_ONLY_TYPES.includes(params.problemType);

  const fields =
    params.problemType === "wavePropagation" || params.problemType === "waveSpeedCalc"
      ? waveFields
      : params.problemType === "doubleSlit" || params.problemType === "fringeSpacingCalc"
        ? doubleSlitFields
        : params.problemType === "singleSlitDiffraction"
          ? singleSlitFields
          : params.problemType === "reflection"
            ? reflectionFields
            : params.problemType === "criticalAngle"
              ? criticalAngleFields
              : refractionFields;

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-5">
      <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
      {fields.map(config => {
        const Icon = config.icon;
        const id = `wave-param-${config.key}`;
        let val = params[config.key] ?? 0;
        let displayVal = val;
        let step = config.step;
        let unitLabel = config.unit;

        if ("inNm" in config && config.inNm && val < 1e-6) {
          displayVal = val * 1e9;
          step = 1;
          unitLabel = "nm";
        } else if ("inMm" in config && config.inMm && val < 0.01) {
          displayVal = val * 1000;
          step = 0.01;
          unitLabel = "mm";
        }

        return (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary text-accent">
                  <Icon size={14} />
                </div>
                <Label htmlFor={id} className="text-sm font-medium text-foreground">
                  {config.label}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{unitLabel}</span>
            </div>
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              step={step}
              min={config.min}
              value={Number.isFinite(val) ? displayVal : ""}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) {
                  let finalVal = v;
                  if ("inNm" in config && config.inNm && v >= 100) finalVal = v * 1e-9;
                  else if ("inMm" in config && config.inMm) finalVal = v * 1e-3;
                  onChange(config.key, finalVal);
                }
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
