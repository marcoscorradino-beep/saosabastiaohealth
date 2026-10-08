import EvolutionIndicator from "@/components/EvolutionIndicator";
import { teamKey } from "@/lib/rankingEvolution";
import ClassificationBadge from "@/components/ClassificationBadge";
import { formatUnitName } from "@/lib/unitName";

interface Row {
  ine: string;
  cnes: string;
  establishment: string;
  name: string;
  teamType: string;
  value: number | null;
  classification: string;
  practices?: {
    label: string;
    value: number | null;
  }[];
}

export default function DataTable({
  rows,
  evolutionByTeam,
  previousCompetence,
}: {
  rows: readonly Row[];
  evolutionByTeam?: Map<string, {
    variation: number | null;
    movement: number | null;
  }>;
  previousCompetence?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-800/70 bg-[#071c30] shadow-xl shadow-slate-950/20">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-100">
          <caption className="sr-only">Resultados por equipe</caption>
          <thead className="bg-[#0b2943] text-left text-xs uppercase tracking-wider text-sky-100">
            <tr>
              {["Equipe", "INE", "Resultado", "Classificação"].map((heading) => (
                <th key={heading} scope="col" className="px-5 py-4 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.ine}
                className={`border-t border-sky-900/70 align-middle transition-colors hover:bg-sky-900/30 ${
                  index % 2 ? "bg-[#061a2c]" : "bg-[#08223a]"
                }`}
              >
                <td className="px-5 py-4 font-semibold text-white">
                  <div>
                    {formatUnitName(row.name)}
                    {row.cnes && (
                      <span className="ml-2 text-xs font-normal text-slate-300">
                        – CNES {row.cnes}
                      </span>
                    )}
                  </div>
                  {row.practices && row.practices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.practices.map((practice, index) => (
                        <span
                          key={`${index}-${practice.label}`}
                          className="rounded-md border border-sky-800/70 bg-[#0b2943] px-2 py-1 text-xs font-normal text-sky-100"
                        >
                          {practice.label}:{" "}
                          <b className="font-semibold text-white">
                            {practice.value == null
                              ? "—"
                              : practice.value.toLocaleString("pt-BR", {
                                  maximumFractionDigits: 2,
                                })}
                          </b>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-sky-200">{row.ine}</td>
                <td className="px-5 py-4 text-center text-base font-bold text-white">
                  <div>{row.value == null ? "—" : `${row.value.toFixed(2)}%`}</div>
                  <div className="mt-1">
                    <EvolutionIndicator
                      variation={evolutionByTeam?.get(teamKey(row))?.variation}
                      previousCompetence={previousCompetence}
                    />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ClassificationBadge text={row.classification} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
