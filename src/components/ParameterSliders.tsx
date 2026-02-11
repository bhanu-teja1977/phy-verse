import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Target, ArrowDown, Triangle } from "lucide-react";

interface Props {
  initialVelocity: number;
  angle: number;
  acceleration: number;
  gravity: number;
  initialHeight: number;
  isProjectile: boolean;
  onChange: (key: string, value: number) => void;
}

const numericFieldConfigs = [
  { key: "initialVelocity", label: "Initial Velocity", unit: "m/s", min: 0, step: 0.1, icon: Zap, iconColor: "text-primary" },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0.1, step: 0.1, icon: ArrowDown, iconColor: "text-destructive" },
  { key: "initialHeight", label: "Initial Height", unit: "m", min: 0, step: 0.1, icon: Triangle, iconColor: "text-accent" },
] as const;

const linearOnlyField = {
  key: "acceleration",
  label: "Acceleration",
  unit: "m/s²",
  step: 0.1,
  icon: Zap,
  iconColor: "text-info",
} as const;

export default function ParameterSliders({ initialVelocity, angle, acceleration, gravity, initialHeight, isProjectile, onChange }: Props) {
  const values: Record<string, number> = { initialVelocity, angle, acceleration, gravity, initialHeight };
  const LinearIcon = linearOnlyField.icon;
  const numericFields = isProjectile
    ? numericFieldConfigs
    : numericFieldConfigs.filter(config => config.key !== "initialHeight");

  const handleNumberChange = (key: string, raw: string) => {
    const value = parseFloat(raw);
    if (Number.isNaN(value)) return;
    onChange(key, value);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-5">
      <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
      {numericFields.map(config => {
        const Icon = config.icon;
        const id = `param-${config.key}`;
        return (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-secondary ${config.iconColor}`}>
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
              value={Number.isFinite(values[config.key]) ? values[config.key] : 0}
              onChange={event => handleNumberChange(config.key, event.target.value)}
            />
          </div>
        );
      })}

      {!isProjectile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-secondary ${linearOnlyField.iconColor}`}>
                <LinearIcon size={14} />
              </div>
              <Label htmlFor={`param-${linearOnlyField.key}`} className="text-sm font-medium text-foreground">
                {linearOnlyField.label}
              </Label>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{linearOnlyField.unit}</span>
          </div>
          <Input
            id={`param-${linearOnlyField.key}`}
            type="number"
            inputMode="decimal"
            step={linearOnlyField.step}
            value={Number.isFinite(values[linearOnlyField.key]) ? values[linearOnlyField.key] : 0}
            onChange={event => handleNumberChange(linearOnlyField.key, event.target.value)}
          />
        </div>
      )}

      {isProjectile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary text-accent">
                <Target size={14} />
              </div>
              <span className="text-sm font-medium text-foreground">Launch Angle</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{values.angle.toFixed(1)}°</span>
          </div>
          <Slider
            value={[values.angle]}
            min={-90}
            max={90}
            step={0.5}
            onValueChange={([v]) => onChange("angle", v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-90°</span>
            <span>90°</span>
          </div>
        </div>
      )}
    </div>
  );
}
