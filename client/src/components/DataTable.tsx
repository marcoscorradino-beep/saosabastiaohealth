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
}

export default function DataTable({ rows }: { rows: readonly Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-800/70 bg-[#071c30] shadow-xl shadow-slate-950/20">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-100">
          <caption className="sr-only">Resultados por equipe</caption>
          <thead className="bg-[#0b2943] text-left text-xs uppercase tracking-wider text-sky-100">
            <tr>
              {["Equipe", "INE", "Estabelecimento", "Resultado", "Classificação"].map((heading) => (
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
                <td className="px-5 py-4 font-semibold text-white">{formatUnitName(row.name)}</td>
                <td className="px-5 py-4 font-mono text-xs text-sky-200">{row.ine}</td>
                <td className="px-5 py-4 text-slate-200">
                  <div>{row.establishment}</div>
                  {row.cnes && <div className="mt-1 text-xs text-slate-400">CNES {row.cnes}</div>}
                </td>
                <td className="px-5 py-4 text-right text-base font-bold text-white">
                  {row.value == null ? "—" : `${row.value.toFixed(2)}%`}
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
