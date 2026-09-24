import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import PanelCard from "@/components/PanelCard";
import IndicatorCard from "@/components/IndicatorCard";
import DataTable from "@/components/DataTable";
import RankingView from "@/components/RankingView";
import DataEditor from "@/components/DataEditor";
import { allPanels, panelsData as defaultPanelsData, PanelData } from "@/lib/mockData";
import { BarChart3, ChevronDown, Download, Info, LayoutDashboard, X } from "lucide-react";

type PanelsData = Record<string, PanelData>;
const STORAGE_KEY = "saosebastiao-health-panels";

function isPanelsData(value: unknown): value is PanelsData {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every((panel) => {
    if (!panel || typeof panel !== "object") return false;
    const p = panel as Partial<PanelData>;
    return typeof p.title === "string" && Array.isArray(p.teams) && Array.isArray(p.indicators);
  });
}

function loadPanelsData(): PanelsData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultPanelsData as PanelsData;
  try {
    const parsed = JSON.parse(stored);
    return isPanelsData(parsed) ? parsed : (defaultPanelsData as PanelsData);
  } catch {
    return defaultPanelsData as PanelsData;
  }
}

export default function Dashboard() {
  const [, params] = useRoute("/:panelId");
  const panelId = (params?.panelId as string) || "infantil";
  const [viewMode, setViewMode] = useState<"table" | "ranking">("table");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [showComparison, setShowComparison] = useState(false);
  const [data, setData] = useState<PanelsData>(() => loadPanelsData());

  const panelData = data[panelId];
  const selectedTeams = useMemo(() => {
    if (!panelData) return [];
    return selectedTeam === "all" ? panelData.teams : panelData.teams.filter((team) => team.id === selectedTeam);
  }, [panelData, selectedTeam]);

  if (!panelData) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl border p-8 max-w-md shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Painel não encontrado</h1>
          <p className="text-gray-600 mt-2">Selecione um dos painéis disponíveis no menu.</p>
          <a href="/infantil" className="inline-block mt-5 px-4 py-2 rounded-lg bg-blue-700 text-white">Voltar ao início</a>
        </div>
      </div>
    );
  }

  const handleDataSave = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!isPanelsData(parsed)) return false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setData(parsed);
      return true;
    } catch {
      return false;
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultPanelsData as PanelsData);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DataEditor initialData={JSON.stringify(data, null, 2)} onSave={handleDataSave} onReset={handleReset} />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <img src="/images/sao_sebastiao_logo.webp" alt="Prefeitura de São Sebastião" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-xs font-semibold tracking-wider text-blue-700 uppercase">Saúde • São Sebastião/SP</p>
              <h1 className="text-lg sm:text-xl font-bold text-gray-950">Painel de Indicadores da Atenção Primária</h1>
            </div>
          </div>
          <nav aria-label="Painéis de indicadores" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
            {allPanels.map((panel) => (
              <PanelCard key={panel.id} {...panel} isActive={panel.id === panelId} />
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2">
              <LayoutDashboard className="w-4 h-4" /> Indicadores São Sebastião - SP
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950">{panelData.title}</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">{panelData.description}. Visualização gerencial para acompanhamento dos resultados e metas.</p>
          </div>
          <button onClick={() => window.print()} className="no-print shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" /> Imprimir / Salvar PDF
          </button>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">Competência</p>
            <p className="text-lg font-bold mt-1 text-gray-950">{panelData.lastUpdate}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">Equipes</p>
            <p className="text-3xl font-bold mt-1 text-gray-950">{panelData.teams.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">Indicadores</p>
            <p className="text-3xl font-bold mt-1 text-gray-950">{panelData.indicators.length}</p>
          </div>
        </section>

        <section className="no-print bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-7">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-end">
            <div>
              <label htmlFor="team-filter" className="block text-sm font-semibold text-gray-800 mb-2">Equipe</label>
              <div className="relative max-w-xl">
                <select id="team-filter" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="all">Todas as equipes</option>
                  {panelData.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode("table")} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${viewMode === "table" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Equipes</button>
              <button onClick={() => setViewMode("ranking")} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${viewMode === "ranking" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Ranking</button>
            </div>
          </div>
        </section>

        <section className="no-print bg-gradient-to-r from-blue-800 to-blue-700 text-white p-6 rounded-xl shadow-sm mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold"><BarChart3 className="w-5 h-5" /> Visão comparativa dos painéis</div>
            <p className="text-blue-100 text-sm mt-1">Compare rapidamente o alcance médio das metas em todos os eixos monitorados.</p>
          </div>
          <button onClick={() => setShowComparison(true)} className="shrink-0 px-5 py-2.5 bg-white text-blue-800 rounded-lg font-bold hover:bg-blue-50 transition-colors">Abrir comparativo</button>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-gray-950">Indicadores de desempenho</h3>
            <span className="text-xs text-gray-500">Dados consolidados do município</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {panelData.indicators.map((indicator) => <IndicatorCard key={indicator.id} {...indicator} />)}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-950 mb-4">{viewMode === "table" ? "Equipes abrangidas" : "Ranking de equipes"}</h3>
          {viewMode === "table" ? <DataTable teams={selectedTeams} indicators={panelData.indicators} /> : <RankingView teams={selectedTeams} indicators={panelData.indicators} />}
        </section>

        <div className="mt-7 flex gap-2 items-start text-xs text-gray-500 no-print">
          <Info className="w-4 h-4 shrink-0" />
          <p>Este painel usa dados locais definidos no projeto. Para publicação oficial, recomenda-se conectar a uma fonte de dados validada e registrar a competência de atualização de cada indicador.</p>
        </div>
      </main>

      {showComparison && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Comparativo dos painéis">
          <div className="max-w-5xl mx-auto bg-slate-50 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold">Comparativo geral</h3>
                <p className="text-sm text-gray-500">Alcance médio das metas por painel</p>
              </div>
              <button onClick={() => setShowComparison(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fechar comparativo"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPanels.map((panel) => {
                const p = data[panel.id];
                if (!p) return null;
                const scores = p.indicators.map((i) => i.goalType === "min" ? (i.target / i.value) * 100 : (i.value / i.target) * 100);
                const average = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
                return (
                  <div key={panel.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex justify-between gap-4 items-start">
                      <div><p className="text-sm font-bold text-gray-900">{panel.title}</p><p className="text-xs text-gray-500 mt-1">{p.indicators.length} indicadores</p></div>
                      <span className="text-xl font-bold text-blue-800">{average}%</span>
                    </div>
                    <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-700 rounded-full" style={{ width: `${Math.min(average, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
