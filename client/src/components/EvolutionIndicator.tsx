import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type Props = {
  variation: number | null | undefined;
  previousCompetence?: string;
  unit?: string;
};

export default function EvolutionIndicator({
  variation,
  previousCompetence,
  unit = "p.p.",
}: Props) {
  if (variation == null || !Number.isFinite(variation)) {
    return (
      <span
        className="text-xs text-slate-500"
        title="Sem resultado anterior comparável"
      >
        —
      </span>
    );
  }

  const stable = Math.abs(variation) < 0.005;

  const label = `${variation > 0 ? "+" : ""}${variation
    .toFixed(2)
    .replace(".", ",")} ${unit}`;

  const title = previousCompetence
    ? `Variação em relação a ${previousCompetence}`
    : "Variação em relação à competência anterior";

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold ${
        stable
          ? "text-slate-400"
          : variation > 0
            ? "text-emerald-400"
            : "text-rose-400"
      }`}
    >
      {stable ? (
        <Minus className="h-4 w-4" />
      ) : variation > 0 ? (
        <ArrowUpRight className="h-4 w-4" />
      ) : (
        <ArrowDownRight className="h-4 w-4" />
      )}
      {stable ? `0,00 ${unit}` : label}
    </span>
  );
}
