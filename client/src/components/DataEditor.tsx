import { useEffect, useState } from "react";
import { AlertCircle, Database, Edit2, RotateCcw, Save, X } from "lucide-react";

interface DataEditorProps {
  initialData: string;
  onSave: (data: string) => boolean;
  onReset: () => void;
}

export default function DataEditor({ initialData, onSave, onReset }: DataEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState(initialData);
  const [error, setError] = useState("");

  useEffect(() => setEditData(initialData), [initialData]);

  const handleOpen = () => {
    setEditData(initialData);
    setError("");
    setIsOpen(true);
  };

  const handleSave = () => {
    try {
      JSON.parse(editData);
      const success = onSave(editData);
      if (!success) {
        setError("O JSON é válido, mas não possui a estrutura esperada para os painéis.");
        return;
      }
      setIsOpen(false);
    } catch {
      setError("JSON inválido. Revise vírgulas, aspas e chaves antes de salvar.");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="no-print fixed bottom-6 right-6 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors z-50"
        title="Editar dados locais"
        aria-label="Editar dados locais"
      >
        <Edit2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="no-print fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-slate-900">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Editar dados do painel</h2>
              <p className="text-xs text-slate-300">Alterações ficam salvas somente neste navegador.</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white" aria-label="Fechar editor">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <textarea
          value={editData}
          onChange={(e) => setEditData(e.target.value)}
          className="min-h-[430px] flex-1 p-4 font-mono text-xs border-none focus:outline-none resize-none"
          spellCheck={false}
          aria-label="Dados dos painéis em JSON"
        />

        <div className="flex flex-wrap gap-2 p-4 border-t bg-gray-50">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Save className="w-4 h-4" /> Salvar neste navegador
          </button>
          <button
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Restaurar padrão
          </button>
          <button onClick={() => setIsOpen(false)} className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
