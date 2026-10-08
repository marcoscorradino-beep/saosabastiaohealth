import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Building2,
  Flag,
  MapPinned,
} from "lucide-react";

const indicators = [
  ["C1", "Mais Acesso à APS"],
  ["C2", "Desenvolvimento Infantil"],
  ["C3", "Gestação e Puerpério"],
  ["C4", "Pessoa com Diabetes"],
  ["C5", "Pessoa com Hipertensão"],
  ["C6", "Pessoa Idosa"],
  ["C7", "Prevenção do Câncer"],
] as const;

const oralIndicators = [
  ["B1", "Primeira Consulta Odontológica Programada"],
  ["B2", "Tratamento Odontológico Concluído"],
  ["B3", "Taxa de Exodontias"],
  ["B4", "Escovação Supervisionada"],
  ["B5", "Procedimentos Odontológicos Preventivos"],
  ["B6", "Tratamento Restaurador Atraumático (TRA)"],
] as const;

const territories = [
  ["São Sebastião", "Município de referência"],
  ["Ilhabela", "Litoral Norte"],
  ["Caraguatatuba", "Litoral Norte"],
  ["Ubatuba", "Litoral Norte"],
  ["Estado de São Paulo", "Referência estadual"],
  ["Brasil", "Referência nacional"],
] as const;

type IndicatorCode =
  | (typeof indicators)[number][0]
  | (typeof oralIndicators)[number][0];

type ComparisonAggregate = {
  competence: string;
  indicator: IndicatorCode;
  counts: {
    regular: number;
    sufficient: number;
    good: number;
    excellent: number;
  };
  totalTeams: number;
  percentages: {
    regular: number;
    sufficient: number;
    good: number;
    excellent: number;
  };
  comparisonIndex: number | null;
};

type ComparisonResponse = {
  source: string;
  preliminary: boolean;
  teamType: string;
  periods: string[];
  indicators: IndicatorCode[];
  territories: Array<{
    name: string;
    data: Record<string, Record<IndicatorCode, ComparisonAggregate>>;
  }>;
};

export default function Comparativo() {
  const [selectedArea, setSelectedArea] = useState<"aps" | "oral">("aps");
  const visibleIndicators = selectedArea === "aps" ? indicators : oralIndicators;

  const [selectedIndicator, setSelectedIndicator] =
    useState<IndicatorCode>("C1");
  const [selectedPeriod, setSelectedPeriod] = useState("Q1/26");
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/public/comparativo")
      .then(async response => {
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body?.error || "Comparativo regional indisponível.");
        }

        return body as ComparisonResponse;
      })
      .then(body => {
        if (!active) return;
        setComparison(body);

        if (body.periods.length && !body.periods.includes(selectedPeriod)) {
          setSelectedPeriod(body.periods[body.periods.length - 1]);
        }
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
      });

    return () => {
      active = false;
    };
  }, []);

  const previousPeriodIndex =
    comparison?.periods.indexOf(selectedPeriod) ?? -1;

  const previousPeriod =
    previousPeriodIndex > 0
      ? comparison?.periods[previousPeriodIndex - 1]
      : undefined;

  const selectedTerritories = (
    comparison?.territories.map(territory => {
      const result = territory.data[selectedPeriod]?.[selectedIndicator];
      const previousResult = previousPeriod
        ? territory.data[previousPeriod]?.[selectedIndicator]
        : undefined;

      const currentIndex = result?.comparisonIndex;
      const previousIndex = previousResult?.comparisonIndex;

      return {
        name: territory.name,
        result,
        variation:
          currentIndex != null && previousIndex != null
            ? currentIndex - previousIndex
            : null,
      };
    }) ?? []
  ).sort((a, b) => {
    const aValue = a.result?.comparisonIndex;
    const bValue = b.result?.comparisonIndex;
    if (aValue == null) return bValue == null ? 0 : 1;
    if (bValue == null) return -1;
    return bValue - aValue;
  });

  const evolutionData = (comparison?.periods ?? []).map(period => ({
    period,
    ...Object.fromEntries(
      (comparison?.territories ?? []).map(territory => [
        territory.name,
        territory.data[period]?.[selectedIndicator]?.comparisonIndex ?? null,
      ]),
    ),
  }));

  const chartColors: Record<string, string> = {
    "São Sebastião": "#22d3ee",
    Caraguatatuba: "#fbbf24",
    Ilhabela: "#a78bfa",
    Ubatuba: "#34d399",
    "Estado de São Paulo": "#fb7185",
    Brasil: "#60a5fa",
  };

  return (
    <div className="min-h-screen bg-[#03111f] text-slate-100">
      <header className="border-b border-sky-900/60 bg-[#041525]/95">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-400">
              Dashboard de Indicadores de Saúde
            </p>
            <p className="mt-1 font-semibold text-white">São Sebastião – SP</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-800 px-4 py-2 text-sm font-semibold text-sky-200 hover:border-sky-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Página inicial
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        <section className="rounded-2xl border border-sky-800/70 bg-[#071c30] p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-sky-300">
                Análise territorial
              </p>
              <div className="mt-2 flex items-center gap-3">
                <BarChart3 className="h-9 w-9 text-cyan-300" />
                <h1 className="text-3xl font-black text-white">
                  Comparativo Regional
                </h1>
              </div>
              <p className="mt-3 max-w-3xl text-slate-300">
                Comparação dos indicadores da Atenção Primária à Saúde de São
                Sebastião com municípios do Litoral Norte, Estado de São Paulo
                e Brasil.
              </p>
            </div>

            <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200">
              Dados oficiais SIAPS · Preliminares
            </span>
          </div>
        </section>

        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">
            Indicadores
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Selecione o indicador para comparação
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {([
              ["aps", "Atenção Primária · C1–C7", "C1"],
              ["oral", "Saúde Bucal · B1–B6", "B1"],
            ] as const).map(([area, label, firstIndicator]) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  setSelectedArea(area);
                  setSelectedIndicator(firstIndicator);
                }}
                className={`rounded-xl border px-5 py-3 text-sm font-bold transition ${
                  selectedArea === area
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-200"
                    : "border-sky-800 bg-[#071c30] text-slate-300 hover:border-sky-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {visibleIndicators.map(([code, title]) => {
              const selected = selectedIndicator === code;

              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => setSelectedIndicator(code)}
                  className={`min-h-32 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-950/40"
                      : "border-sky-800/80 bg-[#071c30] hover:border-sky-500"
                  }`}
                >
                  <b
                    className={
                      selected
                        ? "text-2xl text-cyan-200"
                        : "text-2xl text-sky-300"
                    }
                  >
                    {code}
                  </b>
                  <p className="mt-3 text-sm font-bold leading-tight text-white">
                    {title}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-sky-800/70 bg-[#071c30] p-5">
            <div className="flex items-center gap-3">
              <MapPinned className="h-6 w-6 text-cyan-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Territórios
                </p>
                <h2 className="text-xl font-bold text-white">
                  Referências da comparação
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {territories.map(([name, description], index) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-sky-900/70 bg-[#081d31] px-4 py-3"
                >
                  {index < 4 ? (
                    <Building2 className="h-5 w-5 shrink-0 text-sky-300" />
                  ) : (
                    <Flag className="h-5 w-5 shrink-0 text-sky-300" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                  </div>
                  {index === 0 && (
                    <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase text-cyan-200">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-96 rounded-2xl border border-sky-800/70 bg-[#061829] p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Dados oficiais
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {selectedIndicator} · {visibleIndicators.find(([code]) => code === selectedIndicator)?.[1]}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {(comparison?.periods ?? ["Q2/25", "Q3/25", "Q1/26"]).map(period => (
                  <button
                    type="button"
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                      selectedPeriod === period
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                        : "border-sky-800 text-slate-300 hover:border-sky-500"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : !comparison ? (
              <div className="mt-8 text-sm text-slate-400">
                Carregando dados oficiais do comparativo...
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {selectedTerritories.map(({ name, result, variation }, index) => (
                  <div
                    key={name}
                    className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      name === "São Sebastião"
                        ? "border-cyan-500/70 bg-cyan-950/30"
                        : "border-sky-900/70 bg-[#041525]"
                    }`}
                  >
                    <span className="font-semibold text-white">
                      <span className="mr-3 text-cyan-300">
                        {result?.comparisonIndex != null ? `${index + 1}º` : "—"}
                      </span>
                      {name}
                      <span className="ml-3 inline-flex items-center gap-1 align-middle text-xs font-semibold">
                        {variation == null ? (
                          <span className="text-slate-500" title="Sem quadrimestre anterior disponível">
                            —
                          </span>
                        ) : Math.abs(variation) < 0.005 ? (
                          <span className="inline-flex items-center gap-1 text-slate-400" title="Índice estável">
                            <Minus className="h-4 w-4" />
                            0,00
                          </span>
                        ) : variation > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400" title={`Aumento em relação a ${previousPeriod}`}>
                            <ArrowUpRight className="h-4 w-4" />
                            +{variation.toFixed(2).replace(".", ",")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400" title={`Redução em relação a ${previousPeriod}`}>
                            <ArrowDownRight className="h-4 w-4" />
                            {variation.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </span>
                    </span>
                    {result && result.totalTeams > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                        <span className="text-slate-300">
                          {result.totalTeams.toLocaleString("pt-BR")} {selectedArea === "oral" ? "eSB" : "eSF"}
                        </span>
                        <span className="font-bold text-cyan-200">
                          Índice {result.comparisonIndex?.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Indisponível</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-xl border border-sky-900 bg-[#041525] px-4 py-3 text-xs leading-relaxed text-slate-400">
              Fonte: {comparison?.source ?? "SIAPS - Ministério da Saúde"}.
              {selectedArea === "oral" ? "Comparação B1–B6 restrita às equipes eSB." : "Comparação C1–C7 restrita às equipes eSF."} O índice apresentado é
              calculado pelo dashboard a partir da distribuição dos conceitos
              Regular, Suficiente, Bom e Ótimo; não representa classificação
              territorial oficial do SIAPS.
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-sky-800/70 bg-[#071c30] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Evolução quadrimestral
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Evolução do índice comparativo — {selectedIndicator}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Todos os quadrimestres disponíveis, com comparação entre os seis
              territórios. Índice calculado pelo dashboard, não uma nota
              territorial oficial do SIAPS.
            </p>
          </div>

          {comparison ? (
            <div className="mt-6 h-[390px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolutionData}
                  margin={{ top: 10, right: 18, left: 0, bottom: 12 }}
                >
                  <CartesianGrid stroke="#1e3a52" strokeDasharray="3 3" />
                  <XAxis dataKey="period" stroke="#94a3b8" />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    tickFormatter={value => String(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#071c30",
                      border: "1px solid #155e75",
                      borderRadius: 10,
                      color: "#f8fafc",
                    }}
                    formatter={(value: number | string, name: string) => [
                      Number(value).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }),
                      name,
                    ]}
                  />
                  <Legend />
                  {Object.entries(chartColors).map(([name, color]) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stroke={color}
                      strokeWidth={name === "São Sebastião" ? 4 : 2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">
              {error || "Carregando evolução quadrimestral..."}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Fonte: SIAPS — Ministério da Saúde. Dados preliminares.
            Comparação exclusiva de equipes {selectedArea === "oral" ? "eSB" : "eSF"}. Valores ausentes não são estimados.
          </p>
        </section>
      </main>
    </div>
  );
}
