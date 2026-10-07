import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import DataTable from "@/components/DataTable";
import RankingView from "@/components/RankingView";
import CompetenceEvolutionChart from "@/components/CompetenceEvolutionChart";
import { buildCompetenceEvolution } from "@/lib/competenceEvolution";
import { formatUnitName } from "@/lib/unitName";
import { classificationKey } from "@/components/ClassificationBadge";
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
  const rows = (combined[competence] || []) as readonly any[];
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
  const vals = rows.map((row) => row.value).filter((value): value is number => typeof value === "number");
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const classes = rows.reduce((acc: Record<string, number>, row) => { const key = classificationKey(row.classification); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const practices = rows[0]?.practices?.map((practice: any, index: number) => ({ label: practice.label, avg: rows.reduce((sum: number, row: any) => sum + (row.practices[index]?.value || 0), 0) / Math.max(rows.length, 1) })) || [];

  return <div className="min-h-screen bg-[#03111f] text-slate-100">
    <header className="sticky top-0 z-40 border-b border-sky-900/60 bg-[#041525] no-print"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><a href="/"><img src="/images/logos_institucionais.png" className="h-14 w-auto object-contain sm:h-16" alt="Logos institucionais" /></a><a href="/" className="text-sm text-sky-300 hover:text-white">← Tela inicial</a></div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-300"><LayoutDashboard className="h-4 w-4" /> {panel.code} • Indicadores São Sebastião - SP</div><h1 className="text-2xl font-bold text-white sm:text-3xl">{panel.description}</h1><p className="mt-2 text-slate-300">Dados preliminares importados dos relatórios SIAPS fornecidos pelo município.</p></div><button onClick={() => window.print()} className="no-print flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-500"><Download className="h-4 w-4" /> Imprimir / Salvar PDF</button></section>
      <section className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4"><Card label="Competência" value={competence} /><Card label="Equipes" value={String(rows.length)} /><Card label="Média das equipes" value={`${avg.toFixed(2)}%`} /><Card label="Classificações" value={String(Object.keys(classes).length)} /></section>
      <section className="no-print mb-7 rounded-2xl border border-sky-800/70 bg-[#071c30] p-5 shadow-lg shadow-slate-950/20"><div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto]">
        <Select label="Competência" value={competence} onChange={(value) => { setCompetence(value); setTeam("all"); }} options={comps.map((item) => [item, item])} />
        <Select label="Equipe" value={team} onChange={setTeam} options={[["all", "Todas as equipes"], ...rows.map((row: any) => [row.ine, formatUnitName(row.name)])]} />
        <label className="block text-sm font-semibold text-slate-200">Buscar equipe, estabelecimento ou INE<div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-sky-300" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite para filtrar..." className="w-full rounded-lg border border-sky-800 bg-[#03111f] py-2.5 pl-9 pr-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" /></div></label>
        <div className="flex gap-2"><button onClick={() => setView("table")} className={`rounded-lg px-4 py-2.5 font-semibold ${view === "table" ? "bg-sky-600 text-white" : "border border-sky-700 bg-[#0b2943] text-sky-100"}`}>Equipes</button><button onClick={() => setView("ranking")} className={`rounded-lg px-4 py-2.5 font-semibold ${view === "ranking" ? "bg-sky-600 text-white" : "border border-sky-700 bg-[#0b2943] text-sky-100"}`}>Ranking</button></div>
      </div></section>
      <CompetenceEvolutionChart
        points={evolutionPoints}
        teamName={selectedTeamName}
      />
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">{classCards.map(([label, tone]) => { const count = classes[label] || 0; const pct = rows.length ? (count / rows.length) * 100 : 0; return <div key={label} className={`rounded-xl border p-4 ${tone}`}><p className="text-xs font-bold uppercase tracking-wider">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><p className="text-2xl font-black text-white">{count}</p><p className="text-sm font-semibold">{pct.toFixed(1)}%</p></div><div className="mt-3 h-1.5 rounded-full bg-slate-950/30"><div className="h-1.5 rounded-full bg-current opacity-80" style={{ width: `${pct}%` }} /></div></div>; })}</section>
      {practices.length > 0 && <section className="mb-7"><div className="mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-cyan-300" /><h2 className="text-lg font-bold text-white">Boas práticas registradas</h2></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{practices.map((practice: any, index: number) => <div key={index} className="rounded-xl border border-sky-800/70 bg-[#071c30] p-4"><p className="text-sm font-medium text-slate-100">{practice.label}</p><p className="mt-2 text-xs text-slate-300">Média de registros por equipe: <b className="text-white">{practice.avg.toFixed(1)}</b></p></div>)}</div></section>}
      <section><div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold text-white">Resultados por equipe</h2><p className="mt-1 text-sm text-slate-300">{filtered.length} de {rows.length} equipe(s) exibida(s) • valores conforme o arquivo SIAPS.</p></div><span className="text-xs font-semibold uppercase tracking-wider text-sky-300">{view === "table" ? "Visão em tabela" : "Visão em ranking"}</span></div>{view === "table" ? <DataTable rows={filtered} /> : <RankingView rows={filtered} />}</section>
      <div className="mt-7 flex gap-2 text-xs text-slate-300 no-print"><Info className="h-4 w-4 shrink-0 text-sky-300" /><p>Fonte: arquivos CSV exportados do SIAPS. Os arquivos recebidos estão identificados como “Dado Preliminar”. A média municipal exibida nesta versão é a média simples dos resultados das equipes na competência selecionada.</p></div>
    </main>
  </div>;
}
function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-sky-800/70 bg-[#071c30] p-5 shadow-lg shadow-slate-950/15"><p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div><label className="block text-sm font-semibold text-slate-200">{label}</label><div className="relative mt-2"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-sky-800 bg-[#03111f] px-4 py-2.5 pr-10 text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" /></div></div>; }
