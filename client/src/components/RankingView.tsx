import { Team, Indicator } from "@/lib/mockData";
import { BarChart3, Info } from "lucide-react";

interface RankingViewProps {
  teams: Team[];
  indicators: Indicator[];
}

export default function RankingView({ teams, indicators }: RankingViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-blue-700" />
      </div>
      <h4 className="text-lg font-bold text-gray-900">Ranking aguardando dados por equipe</h4>
      <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
        O projeto possui {teams.length} equipes e {indicators.length} indicadores, mas os valores atuais são consolidados para o município. Para gerar um ranking confiável, cada equipe precisa ter seus próprios valores por indicador.
      </p>
      <div className="mt-5 inline-flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-left text-sm text-amber-900">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>O ranking aleatório da versão anterior foi removido para evitar resultados sem base nos dados reais.</span>
      </div>
    </div>
  );
}
