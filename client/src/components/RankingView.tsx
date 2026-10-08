import ClassificationBadge from "@/components/ClassificationBadge";
import { formatUnitName } from "@/lib/unitName";
import {
  buildRankingPositions,
  rankingMovement,
  teamKey,
} from "@/lib/rankingEvolution";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface Row {
  ine: string;
  teamType?: string;
  name: string;
  value: number | null;
  classification: string;
}

export default function RankingView({
  rows,
  previousRows = [],
}: {
  rows: readonly Row[];
  previousRows?: readonly Row[];
}) {
  const currentPositions = buildRankingPositions(rows);
  const previousPositions = buildRankingPositions(previousRows);

  const ranked = [...rows]
    .filter((row) => row.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-800/70 bg-[#071c30] shadow-xl shadow-slate-950/20">
      {ranked.map((row, index) => (
        <div
          key={row.ine}
          className={`flex items-center gap-4 border-b border-sky-900/70 px-5 py-4 last:border-0 ${
            index % 2 ? "bg-[#061a2c]" : "bg-[#08223a]"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/15 font-bold text-sky-100">
            {currentPositions.get(teamKey(row)) ?? "—"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{formatUnitName(row.name)}</p>
            {(() => {
              const movement = rankingMovement(
                currentPositions.get(teamKey(row)),
                previousPositions.get(teamKey(row)),
              );
              return (
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
                  {movement == null ? (
                    <span className="text-slate-400">—</span>
                  ) : movement > 0 ? (
                    <span className="flex items-center text-emerald-400">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +{movement} posições
                    </span>
                  ) : movement < 0 ? (
                    <span className="flex items-center text-rose-400">
                      <ArrowDownRight className="h-3.5 w-3.5" /> {movement} posições
                    </span>
                  ) : (
                    <span className="flex items-center text-slate-400">
                      <Minus className="h-3.5 w-3.5" /> 0 posições
                    </span>
                  )}
                </div>
              );
            })()}
            <div className="mt-1">
              <ClassificationBadge text={row.classification} />
            </div>
          </div>
          <div className="text-lg font-bold text-white">{row.value?.toFixed(2)}%</div>
        </div>
      ))}
      {ranked.length === 0 && <p className="p-6 text-sm text-slate-300">Nenhum resultado numérico disponível para esta seleção.</p>}
    </div>
  );
}
