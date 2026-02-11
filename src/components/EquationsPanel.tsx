import { FileText } from "lucide-react";

interface Props {
  equations: string[];
  isProjectile: boolean;
}

export default function EquationsPanel({ equations, isProjectile }: Props) {
  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-warning" />
        <h3 className="font-semibold text-foreground text-lg">Equations Used</h3>
      </div>
      {isProjectile && equations.length >= 2 && (
        <>
          <div>
            <span className="text-xs font-semibold text-accent tracking-wider uppercase">Horizontal</span>
            <p className="font-mono text-sm text-foreground mt-1">{equations[0]}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-warning tracking-wider uppercase">Vertical</span>
            <p className="font-mono text-sm text-foreground mt-1">{equations[1]}</p>
          </div>
          {equations.slice(2).map((eq, i) => (
            <p key={i} className="font-mono text-sm text-muted-foreground">{eq}</p>
          ))}
        </>
      )}
      {!isProjectile && equations.map((eq, i) => (
        <p key={i} className="font-mono text-sm text-foreground">{eq}</p>
      ))}
    </div>
  );
}
