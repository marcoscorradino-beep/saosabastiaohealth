type ClassificationBadgeProps = {
  text?: string | null;
};

const styles: Record<string, string> = {
  "ÓTIMO": "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
  "BOM": "border-sky-400/50 bg-sky-500/15 text-sky-100",
  "SUFICIENTE": "border-amber-300/50 bg-amber-400/15 text-amber-100",
  "REGULAR": "border-rose-400/50 bg-rose-500/15 text-rose-100",
};

export function classificationKey(text?: string | null) {
  return (text || "").trim().toLocaleUpperCase("pt-BR");
}

export default function ClassificationBadge({ text }: ClassificationBadgeProps) {
  const label = text?.trim() || "Sem classificação";
  const key = classificationKey(text);
  const tone = styles[key] || "border-slate-500/60 bg-slate-500/15 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${tone}`}>
      {label}
    </span>
  );
}
