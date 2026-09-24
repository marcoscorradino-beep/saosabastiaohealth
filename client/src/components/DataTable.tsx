import { Team, Indicator } from "@/lib/mockData";

interface DataTableProps {
  teams: Team[];
  indicators: Indicator[];
}

export default function DataTable({ teams, indicators }: DataTableProps) {
  return (
    <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          Os indicadores disponíveis nesta versão são consolidados do município. A lista abaixo mostra as equipes incluídas no painel; valores individualizados poderão ser exibidos quando forem importados.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Equipe</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Competência</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Indicadores cadastrados</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/70"} hover:bg-blue-50 transition-colors`}>
                <td className="px-6 py-4 font-medium text-gray-900">{team.name}</td>
                <td className="px-6 py-4 text-gray-600">{team.competency}</td>
                <td className="px-6 py-4 text-gray-600">{indicators.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
