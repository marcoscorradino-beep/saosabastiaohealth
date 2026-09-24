import { ArrowDown, ArrowUp, CheckCircle2, Minus, Target } from "lucide-react";

interface IndicatorCardProps {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  goalType?: "min" | "max";
}

export default function IndicatorCard({
  name,
  value,
  target,
  unit,
  trend,
  goalType = "max",
}: IndicatorCardProps) {
  const rawProgress = goalType === "max" ? (value / target) * 100 : (target / value) * 100;
  const progress = Number.isFinite(rawProgress) ? Math.max(0, Math.round(rawProgress)) : 0;
  const isMetTarget = goalType === "max" ? value >= target : value <= target;

  const trendIcon = {
    up: <ArrowUp className="w-4 h-4" aria-label="Tendência de alta" />,
    down: <ArrowDown className="w-4 h-4" aria-label="Tendência de queda" />,
    stable: <Minus className="w-4 h-4" aria-label="Tendência estável" />,
  };

  return (
    <article className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 leading-snug flex-1">{name}</h4>
        <span className="text-gray-500">{trendIcon[trend]}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-gray-950">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Target className="w-3.5 h-3.5" />
          <span>Meta {goalType === "min" ? "máxima" : "mínima"}: {target} {unit}</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden" aria-label={`${progress}% da meta`}>
        <div
          className={`h-full rounded-full transition-all ${isMetTarget ? "bg-emerald-500" : "bg-blue-600"}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{progress}% da meta</span>
        <span className={`font-medium flex items-center gap-1 ${isMetTarget ? "text-emerald-700" : "text-amber-700"}`}>
          {isMetTarget && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isMetTarget ? "Meta atingida" : "Abaixo da meta"}
        </span>
      </div>
    </article>
  );
}
