import ClassificationBadge from "@/components/ClassificationBadge";

interface Row {
  ine: string;
  name: string;
  value: number | null;
  classification: string;
}

export default function RankingView({ rows }: { rows: readonly Row[] }) {
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
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{row.name}</p>
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
