import { TrendingUp, Clock, Navigation } from "lucide-react";

interface Props {
  displacement: number;
  time: number;
  maxHeight: number | null;
  range: number | null;
}

export default function ResultsPanel({ displacement, time, maxHeight, range }: Props) {
  const items = [
    ...(maxHeight !== null
      ? [{ label: "Maximum Height", value: maxHeight.toFixed(2), unit: "m", icon: TrendingUp, bg: "bg-result-purple" }]
      : []),
    { label: "Time Taken", value: time.toFixed(2), unit: "s", icon: Clock, bg: "bg-result-yellow" },
    ...(range !== null
      ? [{ label: "Horizontal Range", value: range.toFixed(2), unit: "m", icon: Navigation, bg: "bg-result-green" }]
      : [{ label: "Displacement", value: displacement.toFixed(2), unit: "m", icon: Navigation, bg: "bg-result-green" }]),
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
