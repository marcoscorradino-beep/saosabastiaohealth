import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EvolutionPoint } from "@/lib/competenceEvolution";

const fmt = (value: number | null | undefined) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 2,
      }).format(value);

export default function CompetenceEvolutionChart({
  points,
  teamName,
}: {
  points: EvolutionPoint[];
  teamName?: string;
}) {
  const validPoints = points.filter(
    (point) => typeof point.value === "number" && Number.isFinite(point.value),
  );

  if (validPoints.length < 2) return null;

  const first = validPoints[0];
  const last = validPoints[validPoints.length - 1];
  const variation =
    first.value != null && last.value != null ? last.value - first.value : null;

  return (
    <section className="mt-5 rounded-2xl border border-sky-800/70 bg-[#071c30] p-5 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold text-white">
            Evolução por competência
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {teamName
              ? `Resultados da equipe ${teamName} nas competências disponíveis.`
              : "Média municipal dos resultados nas competências disponíveis."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-sky-800 bg-[#0b2943] px-3 py-2 text-sky-100">
            {first.competence}: <b>{fmt(first.value)}</b>
          </span>
          <span className="rounded-lg border border-sky-800 bg-[#0b2943] px-3 py-2 text-sky-100">
            {last.competence}: <b>{fmt(last.value)}</b>
          </span>
          <span className="rounded-lg border border-sky-800 bg-[#0b2943] px-3 py-2 text-sky-100">
            Variação:{" "}
            <b>
              {variation != null && variation > 0 ? "+" : ""}
              {fmt(variation)}
            </b>
          </span>
        </div>
      </div>

      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#164e63" opacity={0.45} />
            <XAxis
              dataKey="competence"
              tick={{ fill: "#bae6fd", fontSize: 12 }}
              axisLine={{ stroke: "#075985" }}
              tickLine={{ stroke: "#075985" }}
            />
            <YAxis
              tick={{ fill: "#bae6fd", fontSize: 12 }}
              axisLine={{ stroke: "#075985" }}
              tickLine={{ stroke: "#075985" }}
              width={55}
            />
            <Tooltip
              formatter={(value) => [fmt(Number(value)), teamName ? "Resultado" : "Média"]}
              contentStyle={{
                backgroundColor: "#071c30",
                border: "1px solid #075985",
                borderRadius: "10px",
                color: "#fff",
              }}
              labelStyle={{ color: "#bae6fd" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={teamName ? "Resultado" : "Média"}
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 4, fill: "#22d3ee" }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        São exibidas somente as competências disponíveis na base. Competências
        ausentes não são consideradas como resultado zero.
      </p>
    </section>
  );
}
