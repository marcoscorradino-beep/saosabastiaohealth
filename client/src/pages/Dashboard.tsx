import { apsScoreBands } from "../../../shared/apsMethodology";
import {
  buildRankingPositions,
  rankingMovement,
  resultVariation,
  teamKey,
} from "@/lib/rankingEvolution";
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import DataTable from "@/components/DataTable";
import RankingView from "@/components/RankingView";
import CompetenceEvolutionChart from "@/components/CompetenceEvolutionChart";
import { buildCompetenceEvolution } from "@/lib/competenceEvolution";
import { formatUnitName } from "@/lib/unitName";
import ClassificationBadge, { classificationKey } from "@/components/ClassificationBadge";
import { allPanels } from "@/lib/mockData";
import { siapsData, SiapsPanelId } from "@/lib/siapsData";
import { BarChart3, ChevronDown, Download, Info, LayoutDashboard, Search } from "lucide-react";

const monthOrder: Record<string, number> = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12 };
const sortComp = (a: string, b: string) => { const [ma, ya] = a.split("/"), [mb, yb] = b.split("/"); return (+yb - +ya) || (monthOrder[mb] - monthOrder[ma]); };
const classCards = [
  ["ÓTIMO", "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"],
  ["BOM", "border-sky-400/40 bg-sky-500/10 text-sky-100"],
  ["SUFICIENTE", "border-amber-300/40 bg-amber-400/10 text-amber-100"],
  ["REGULAR", "border-rose-400/40 bg-rose-500/10 text-rose-100"],
] as const;

export default function Dashboard() {
  const [, params] = useRoute("/:panelId");
  const raw = (params?.panelId as string) || "infantil";
  const panelId = (raw in siapsData ? raw : "infantil") as SiapsPanelId;
  const panel = allPanels.find((item) => item.id === panelId)!;
  const [remote, setRemote] = useState<Record<string, any[]>>({});
  const [query, setQuery] = useState("");
  useEffect(() => { fetch(`/api/data/${panelId}`).then((response) => response.ok ? response.json() : {}).then(setRemote).catch(() => setRemote({})); }, [panelId]);
  const combined = { ...(siapsData[panelId] as any), ...remote };
  const comps = Object.keys(combined).sort(sortComp);
  const [competence, setCompetence] = useState(comps[0]);
  useEffect(() => { if (comps.length && !comps.includes(competence)) setCompetence(comps[0]); }, [panelId, remote]);
  const [team, setTeam] = useState("all");
  const [view, setView] = useState<"table" | "ranking">("table");
  const [sortOrder, setSortOrder] = useState<"alphabetical" | "highest" | "lowest">("alphabetical");
  const rows = (combined[competence] || []) as readonly any[];
  const previousCompetenceIndex = comps.indexOf(competence) + 1;
  const previousCompetence =
    previousCompetenceIndex < comps.length
      ? comps[previousCompetenceIndex]
      : undefined;

  const previousRows = (
    previousCompetence ? combined[previousCompetence] || [] : []
  ) as readonly any[];

  const previousByTeam = new Map(
    previousRows.map(row => [teamKey(row), row]),
  );

  const currentPositions = buildRankingPositions(rows);
  const previousPositions = buildRankingPositions(previousRows);

  const evolutionByTeam = new Map(
    rows.map(row => {
      const key = teamKey(row);
      const previous = previousByTeam.get(key);

      return [
        key,
        {
          variation: resultVariation(
            row.value,
            previous?.value ?? null,
          ),
          movement: rankingMovement(
            currentPositions.get(key),
            previousPositions.get(key),
          ),
        },
      ] as const;
    }),
  );

  const teamOptions = useMemo(
    () =>
      Array.from(new Map(rows.map((row: any) => [row.ine, row])).values())
        .sort((a: any, b: any) => formatUnitName(a.name).localeCompare(formatUnitName(b.name), "pt-BR"))
        .map((row: any) => [row.ine, formatUnitName(row.name)]),
    [rows],
  );
  const evolutionPeriods = useMemo(
    () => Object.keys(combined).sort((a, b) => -sortComp(a, b)),
    [combined],
  );
  const evolutionPoints = useMemo(
    () => buildCompetenceEvolution(combined, evolutionPeriods, team),
    [combined, evolutionPeriods, team],
  );
  const selectedTeamName = team === "all"
    ? undefined
    : formatUnitName(
        (Object.values(combined).flat() as any[])
          .find((row) => row.ine === team)?.name,
      );
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return rows.filter((row) => (team === "all" || row.ine === team) && (!needle || `${row.name} ${row.establishment} ${row.ine} ${row.cnes}`.toLocaleLowerCase("pt-BR").includes(needle)));
  }, [rows, team, query]);
  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aValue = typeof a.value === "number" && Number.isFinite(a.value) ? a.value : null;
      const bValue = typeof b.value === "number" && Number.isFinite(b.value) ? b.value : null;

      if (sortOrder !== "alphabetical") {
        if (aValue === null && bValue !== null) return 1;
        if (bValue === null && aValue !== null) return -1;
        if (aValue !== null && bValue !== null && aValue !== bValue) {
          return sortOrder === "highest" ? bValue - aValue : aValue - bValue;
        }
      }

      return formatUnitName(a.name).localeCompare(formatUnitName(b.name), "pt-BR") ||
        String(a.ine).localeCompare(String(b.ine));
    });
  }, [filtered, sortOrder]);

  const vals = rows.map((row) => row.value).filter((value): value is number => typeof value === "number");
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const classes = rows.reduce((acc: Record<string, number>, row) => { const key = classificationKey(row.classification); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const practices = rows[0]?.practices?.map((practice: any, index: number) => ({ label: practice.label, avg: rows.reduce((sum: number, row: any) => sum + (row.practices[index]?.value || 0), 0) / Math.max(rows.length, 1) })) || [];

  return <div className="min-h-screen bg-[#03111f] text-slate-100">
    <header className="sticky top-0 z-40 border-b border-sky-900/60 bg-[#041525] no-print"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><a href="/"><img src="/images/logos_institucionais.png" className="h-14 w-auto object-contain sm:h-16" alt="Logos institucionais" /></a><a href="/" className="text-sm text-sky-300 hover:text-white">← Tela inicial</a></div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-300"><LayoutDashboard className="h-4 w-4" /> Indicadores Atenção Básica</div><h1 className="text-2xl font-bold text-white sm:text-3xl">{panel.code} • {panel.description}</h1><p className="mt-2 text-slate-300">Dados preliminares importados dos relatórios SIAPS fornecidos pelo município.</p></div><button onClick={() => window.print()} className="no-print flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-500"><Download className="h-4 w-4" /> Imprimir / Salvar PDF</button></section>
      <section className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4"><Card label="Competência" value={competence} /><Card label="Equipes" value={String(rows.length)} /><Card label="Média das equipes" value={`${avg.toFixed(2)}%`} /><Card label="Classificações" value={String(Object.keys(classes).length)} /></section>
      <nav className="no-print mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7" aria-label="Indicadores da Atenção Básica">
        {allPanels.map((item) => <Link
          key={item.id}
          href={`/${item.id}`}
          aria-current={panelId === item.id ? "page" : undefined}
          className={`group flex min-h-36 flex-col rounded-xl border p-4 transition ${panelId === item.id ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/20" : "border-sky-800/80 bg-[#071c30] hover:-translate-y-0.5 hover:border-sky-500 hover:bg-[#0a2138]"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <b className={`text-2xl ${panelId === item.id ? "text-cyan-200" : "text-sky-300"}`}>{item.code}</b>
            {panelId === item.id && <span className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Selecionado</span>}
          </div>
          <h3 className="mt-3 text-sm font-bold leading-tight text-white">{item.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
        </Link>)}
      </nav>
      <section className="mb-7 rounded-2xl border border-sky-800/70 bg-[#071c30] p-5">
        <h2 className="text-xl font-bold text-white">Pontuação</h2>
        <p className="mt-1 text-sm text-slate-300">
          Faixas de classificação e distribuição das equipes.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {apsScoreBands[panelId].map((band) => {
            const count = classes[band.label] || 0;
            const pct = rows.length ? (count / rows.length) * 100 : 0;

            return (
              <div key={band.label} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-sky-800/70 bg-[#0b2943] p-3">
                <div className="min-w-0 flex-1">
                  <ClassificationBadge text={band.label} />
                  <p className="mt-2 text-xs leading-snug text-sky-200">{band.rule}</p>
                </div>
                <div className="flex min-h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-sky-700 bg-[#173c57] px-2 py-1">
                  <span className="text-lg font-black leading-tight text-white">{count}</span>
                  <span className="text-[11px] font-semibold text-sky-200">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="no-print mb-7 rounded-2xl border border-sky-800/70 bg-[#071c30] p-5 shadow-lg shadow-slate-950/20"><div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto]">
        <Select label="Competência" value={competence} onChange={(value) => { setCompetence(value); setTeam("all"); }} options={comps.map((item) => [item, item])} />
        <Select label="Equipe" value={team} onChange={setTeam} options={[["all", "Todas as equipes"], ...teamOptions]} />
        <label className="block text-sm font-semibold text-slate-200">Buscar equipe, estabelecimento ou INE<div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-sky-300" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite para filtrar..." className="w-full rounded-lg border border-sky-800 bg-[#03111f] py-2.5 pl-9 pr-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" /></div></label>
        <div className="flex flex-col gap-2">

          <div className="flex gap-2"><button onClick={() => setView("table")} className={`rounded-lg px-4 py-2.5 font-semibold ${view === "table" ? "bg-sky-600 text-white" : "border border-sky-700 bg-[#0b2943] text-sky-100"}`}>Equipes</button><button onClick={() => setView("ranking")} className={`rounded-lg px-4 py-2.5 font-semibold ${view === "ranking" ? "bg-sky-600 text-white" : "border border-sky-700 bg-[#0b2943] text-sky-100"}`}>Ranking</button></div></div>
      </div></section>
      <CompetenceEvolutionChart
        points={evolutionPoints}
        teamName={selectedTeamName}
      />


      <section className="mt-5 overflow-hidden rounded-2xl border border-sky-800/70 bg-[#071c30] shadow-lg shadow-slate-950/20"><div className="border-b border-sky-800/70 p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold text-white">Resultados por equipe</h2><p className="mt-1 text-sm text-slate-300">{filtered.length} de {rows.length} equipe(s) exibida(s) • valores conforme o arquivo SIAPS.</p></div>{view === "table" && (          <label className="text-xs font-semibold text-slate-200">
            Ordenar equipes
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
              className="mt-2 w-full rounded-lg border border-sky-800 bg-[#03111f] px-3 py-2.5 text-slate-100"
            >
              <option value="alphabetical">Ordem alfabética (A–Z)</option>
              <option value="highest">Maior resultado primeiro</option>
              <option value="lowest">Menor resultado primeiro</option>
            </select>
          </label>)}</div></div><div className="overflow-x-auto">{view === "table" ? <DataTable
  rows={sortedFiltered}
  evolutionByTeam={evolutionByTeam}
  previousCompetence={previousCompetence}
/> : <RankingView rows={filtered} />}</div></section>
      <div className="mt-7 flex gap-2 text-xs text-slate-300 no-print"><Info className="h-4 w-4 shrink-0 text-sky-300" /><p>Fonte: arquivos CSV exportados do SIAPS. Os arquivos recebidos estão identificados como “Dado Preliminar”. A média municipal exibida nesta versão é a média simples dos resultados das equipes na competência selecionada.</p></div>
    </main>
  </div>;
}
function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-sky-800/70 bg-[#071c30] p-5 shadow-lg shadow-slate-950/15"><p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div><label className="block text-sm font-semibold text-slate-200">{label}</label><div className="relative mt-2"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-sky-800 bg-[#03111f] px-4 py-2.5 pr-10 text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" /></div></div>; }
