import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Target, ArrowDown, Triangle, Circle, RotateCw, Scale, Grip, Mountain } from "lucide-react";

interface Props {
  initialVelocity: number;
  angle: number;
  acceleration: number;
  gravity: number;
  initialHeight: number;
  isProjectile: boolean;
  isCircular: boolean;
  isVerticalMotion: boolean;
  isFriction: boolean;
  isInclined: boolean;
  isInclinedProjectile: boolean;
  radius: number;
  angularVelocity: number;
  mass: number | null;
  coefficientOfFriction: number;
  inclineAngle: number;
  launchAngleRelativeToIncline: number;
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

const circularFieldConfigs = [
  { key: "radius", label: "Radius", unit: "m", min: 0.1, step: 0.1, icon: Circle, iconColor: "text-accent" },
  { key: "angularVelocity", label: "Angular Velocity", unit: "rad/s", min: 0.1, step: 0.1, icon: RotateCw, iconColor: "text-primary" },
  { key: "mass", label: "Mass (optional)", unit: "kg", min: 0, step: 0.1, icon: Scale, iconColor: "text-muted-foreground" },
] as const;

const verticalOnlyFields = [
  { key: "initialVelocity", label: "Initial Velocity", unit: "m/s", min: 0, step: 0.1, icon: Zap, iconColor: "text-primary" },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0.1, step: 0.1, icon: ArrowDown, iconColor: "text-destructive" },
] as const;

const frictionFieldConfigs = [
  { key: "initialVelocity", label: "Initial Velocity", unit: "m/s", min: 0, step: 0.1, icon: Zap, iconColor: "text-primary" },
  { key: "mass", label: "Mass", unit: "kg", min: 0.1, step: 0.1, icon: Scale, iconColor: "text-accent" },
  { key: "coefficientOfFriction", label: "Coefficient of Friction (μ)", unit: "", min: 0, step: 0.01, icon: Grip, iconColor: "text-warning" },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0.1, step: 0.1, icon: ArrowDown, iconColor: "text-destructive" },
] as const;

const inclinedFieldConfigs = [
  { key: "mass", label: "Mass", unit: "kg", min: 0.1, step: 0.1, icon: Scale, iconColor: "text-accent" },
  { key: "inclineAngle", label: "Angle of Incline", unit: "°", min: 0, step: 1, icon: Mountain, iconColor: "text-primary" },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0.1, step: 0.1, icon: ArrowDown, iconColor: "text-destructive" },
  { key: "coefficientOfFriction", label: "Coefficient of Friction (optional)", unit: "", min: 0, step: 0.01, icon: Grip, iconColor: "text-muted-foreground" },
] as const;

const inclinedProjectileFieldConfigs = [
  { key: "initialVelocity", label: "Initial Velocity", unit: "m/s", min: 0.1, step: 0.1, icon: Zap, iconColor: "text-primary" },
  { key: "launchAngleRelativeToIncline", label: "Launch Angle (relative to incline)", unit: "°", min: -90, step: 1, icon: Target, iconColor: "text-accent" },
  { key: "inclineAngle", label: "Incline Angle", unit: "°", min: 0, step: 1, icon: Mountain, iconColor: "text-primary" },
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0.1, step: 0.1, icon: ArrowDown, iconColor: "text-destructive" },
  { key: "initialHeight", label: "Initial Height (optional)", unit: "m", min: 0, step: 0.5, icon: Triangle, iconColor: "text-muted-foreground" },
] as const;

export default function ParameterSliders({
  initialVelocity,
  angle,
  acceleration,
  gravity,
  initialHeight,
  isProjectile,
  isCircular,
  isVerticalMotion,
  isFriction,
  isInclined,
  isInclinedProjectile,
  radius,
  angularVelocity,
  mass,
  coefficientOfFriction,
  inclineAngle,
  launchAngleRelativeToIncline,
  onChange,
}: Props) {
  const values: Record<string, number> = {
    initialVelocity,
    angle,
    acceleration,
    gravity,
    initialHeight,
    radius,
    angularVelocity,
    mass: mass ?? 0,
    coefficientOfFriction: coefficientOfFriction ?? 0.3,
    inclineAngle: inclineAngle ?? 30,
    launchAngleRelativeToIncline: launchAngleRelativeToIncline ?? 45,
  };
  const LinearIcon = linearOnlyField.icon;
  const numericFields = isProjectile
    ? numericFieldConfigs
    : isVerticalMotion
      ? []
      : numericFieldConfigs.filter(config => config.key !== "initialHeight");

  const handleNumberChange = (key: string, raw: string) => {
    const value = parseFloat(raw);
    if (Number.isNaN(value) && key !== "mass") return;
    onChange(key, value);
  };

  if (isVerticalMotion) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 space-y-5">
        <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
        {verticalOnlyFields.map(config => {
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
                onChange={e => handleNumberChange(config.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    );
  }

  const renderFieldPanel = (configs: typeof frictionFieldConfigs) => (
    <div className="bg-card rounded-lg border border-border p-5 space-y-5">
      <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
      {configs.map(config => {
        const Icon = config.icon;
        const id = `param-${config.key}`;
        return (
          <div key={config.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-secondary ${config.iconColor}`}>
                  <Icon size={14} />
                </div>
                <Label htmlFor={id} className="text-sm font-medium text-foreground">{config.label}</Label>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{config.unit || ""}</span>
            </div>
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              step={config.step}
              min={config.min}
              value={config.key === "mass" && (mass == null || mass <= 0) ? "" : (Number.isFinite(values[config.key]) ? values[config.key] : config.min)}
              onChange={e => {
                const v = e.target.value;
                if (config.key === "mass" && (v === "" || parseFloat(v) <= 0)) onChange("mass", 0);
                else { const num = parseFloat(v); if (!Number.isNaN(num)) onChange(config.key, num); }
              }}
            />
          </div>
        );
      })}
    </div>
  );

  if (isFriction) return renderFieldPanel(frictionFieldConfigs);
  if (isInclined) return renderFieldPanel(inclinedFieldConfigs);
  if (isInclinedProjectile) return renderFieldPanel(inclinedProjectileFieldConfigs);

  if (isCircular) {
    return (
      <div className="bg-card rounded-lg border border-border p-5 space-y-5">
        <h3 className="font-semibold text-foreground text-lg">Parameters</h3>
        {circularFieldConfigs.map(config => {
          const Icon = config.icon;
          const id = `param-${config.key}`;
          const val = config.key === "mass" ? (mass ?? 0) : values[config.key];
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
                value={config.key === "mass" ? (mass != null && mass > 0 ? mass : "") : val}
                onChange={e => {
                  const v = e.target.value;
                  if (config.key === "mass") {
                    if (v === "") onChange("mass", 0);
                    else {
                      const num = parseFloat(v);
                      onChange("mass", Number.isNaN(num) ? 0 : num);
                    }
                  } else {
                    const num = parseFloat(v);
                    if (!Number.isNaN(num)) onChange(config.key, num);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

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
