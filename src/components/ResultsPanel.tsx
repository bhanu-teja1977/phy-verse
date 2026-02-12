import { TrendingUp, Clock, Navigation, RotateCw, Zap, Scale, Grip } from "lucide-react";

interface Props {
  displacement: number;
  time: number;
  maxHeight: number | null;
  range: number | null;
  angularVelocity?: number;
  centripetalAcceleration?: number;
  centripetalForce?: number | null;
  isCircular?: boolean;
  frictionForce?: number;
  frictionAcceleration?: number;
  timeToStop?: number;
  isFriction?: boolean;
  isConstantVelocity?: boolean;
  normalForce?: number;
  netAccelerationAlongIncline?: number;
  inclineFrictionForce?: number | null;
  isInclined?: boolean;
}

export default function ResultsPanel({
  displacement,
  time,
  maxHeight,
  range,
  angularVelocity,
  centripetalAcceleration,
  centripetalForce,
  isCircular = false,
  frictionForce,
  frictionAcceleration,
  timeToStop,
  isFriction = false,
  normalForce,
  netAccelerationAlongIncline,
  inclineFrictionForce,
  isInclined = false,
  isConstantVelocity = false,
}: Props) {
  const items = isFriction && (isConstantVelocity || (frictionForce != null && frictionAcceleration != null))
    ? isConstantVelocity
      ? [
          { label: "Friction Force", value: "0", unit: "N", icon: Grip, bg: "bg-result-purple" as const },
          { label: "Acceleration", value: "0", unit: "m/s²", icon: Zap, bg: "bg-result-yellow" as const },
          { label: "Motion Type", value: "Constant velocity", unit: "", icon: Navigation, bg: "bg-result-green" as const },
        ]
      : [
          { label: "Friction Force", value: frictionForce!.toFixed(2), unit: "N", icon: Grip, bg: "bg-result-purple" as const },
          { label: "Acceleration due to Friction", value: frictionAcceleration!.toFixed(2), unit: "m/s²", icon: Zap, bg: "bg-result-yellow" as const },
          ...(timeToStop != null ? [{ label: "Time to Stop", value: timeToStop.toFixed(2), unit: "s", icon: Clock, bg: "bg-result-green" as const }] : []),
          { label: "Distance Traveled", value: displacement.toFixed(2), unit: "m", icon: Navigation, bg: "bg-result-green" as const },
        ]
    : isInclined && netAccelerationAlongIncline != null
      ? [
          { label: "Net Acceleration along Incline", value: netAccelerationAlongIncline.toFixed(2), unit: "m/s²", icon: Zap, bg: "bg-result-purple" as const },
          ...(normalForce != null ? [{ label: "Normal Force", value: normalForce.toFixed(2), unit: "N", icon: Scale, bg: "bg-result-yellow" as const }] : []),
          ...(inclineFrictionForce != null && inclineFrictionForce > 0 ? [{ label: "Friction Force", value: inclineFrictionForce.toFixed(2), unit: "N", icon: Grip, bg: "bg-result-green" as const }] : []),
          { label: "Time to Bottom", value: time.toFixed(2), unit: "s", icon: Clock, bg: "bg-result-green" as const },
        ]
      : isCircular && angularVelocity != null && centripetalAcceleration != null
    ? [
        { label: "Angular Velocity", value: angularVelocity.toFixed(2), unit: "rad/s", icon: RotateCw, bg: "bg-result-purple" as const },
        { label: "Centripetal Acceleration", value: centripetalAcceleration.toFixed(2), unit: "m/s²", icon: Zap, bg: "bg-result-yellow" as const },
        ...(centripetalForce != null && centripetalForce > 0
          ? [{ label: "Centripetal Force", value: centripetalForce.toFixed(2), unit: "N", icon: Scale, bg: "bg-result-green" as const }]
          : []),
      ]
    : [
        ...(maxHeight !== null
          ? [{ label: "Maximum Height", value: maxHeight.toFixed(2), unit: "m", icon: TrendingUp, bg: "bg-result-purple" as const }]
          : []),
        { label: "Time Taken", value: time.toFixed(2), unit: "s", icon: Clock, bg: "bg-result-yellow" as const },
        ...(range !== null
          ? [{ label: "Horizontal Range", value: range.toFixed(2), unit: "m", icon: Navigation, bg: "bg-result-green" as const }]
          : [{ label: "Displacement", value: displacement.toFixed(2), unit: "m", icon: Navigation, bg: "bg-result-green" as const }]),
      ];

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
      <h3 className="font-semibold text-foreground text-lg">Results</h3>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`flex items-center justify-between rounded-lg p-3 ${item.bg}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                <Icon size={16} className="text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">{item.value}</span>
              <span className="text-sm text-muted-foreground ml-1">{item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
