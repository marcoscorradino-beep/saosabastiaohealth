export type OralPanelId = "b1" | "b2" | "b3" | "b4" | "b5" | "b6";
export type OralClassification = "ÓTIMO" | "BOM" | "SUFICIENTE" | "REGULAR" | "";
export type OralMetric = { label: string; value: number | null; text?: string };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
}

const resultMetricMatchers: Record<OralPanelId, RegExp> = {
  b1: /pessoas vinculadas.*esb.*referencia/,
  b2: /primeira consulta odontologica programatica realizadas pela esb/,
  b3: /procedimentos individuais preventivos, curativos e exodontias realizadas/,
  b4: /criancas de 6 a 12 anos vinculadas.*referencia da esb/,
  b5: /procedimentos odontologicos individuais realizados/,
  b6: /procedimentos restauradores realizados pela esb/,
};

export function findOralResultMetric(panelId: OralPanelId, metrics: OralMetric[]) {
  return metrics.find(metric => resultMetricMatchers[panelId].test(normalize(metric.label))) ?? null;
}

export function recoverOralValue(panelId: OralPanelId, metrics: OralMetric[]) {
  const metric = findOralResultMetric(panelId, metrics);
  return metric && typeof metric.value === "number" && Number.isFinite(metric.value) ? metric.value : null;
}

export function classifyOralValue(panelId: OralPanelId, value: number | null | undefined): OralClassification {
  if (value == null || !Number.isFinite(value)) return "";
  switch (panelId) {
    case "b1": return value <= 0.25 ? "REGULAR" : value <= 0.75 ? "SUFICIENTE" : value <= 1.25 ? "BOM" : "ÓTIMO";
    case "b2": return value <= 25 ? "REGULAR" : value <= 50 ? "SUFICIENTE" : value <= 75 ? "BOM" : value <= 100 ? "ÓTIMO" : "";
    case "b3": return value < 3 || value >= 14 ? "REGULAR" : value < 10 ? "ÓTIMO" : value < 12 ? "BOM" : "SUFICIENTE";
    case "b4": return value <= 0.25 ? "REGULAR" : value <= 0.5 ? "SUFICIENTE" : value <= 1 ? "BOM" : "ÓTIMO";
    case "b5": return value < 40 || value > 85 ? "REGULAR" : value < 55 ? "SUFICIENTE" : value < 65 ? "BOM" : "ÓTIMO";
    case "b6": return value <= 3 ? "REGULAR" : value <= 6 ? "SUFICIENTE" : value <= 8 ? "BOM" : "ÓTIMO";
  }
}

export const oralScoreBands: Record<OralPanelId, { label: OralClassification; rule: string }[]> = {
  b1: [
    { label: "REGULAR", rule: "≤ 0,25" }, { label: "SUFICIENTE", rule: "> 0,25 até 0,75" },
    { label: "BOM", rule: "> 0,75 até 1,25" }, { label: "ÓTIMO", rule: "> 1,25" },
  ],
  b2: [
    { label: "REGULAR", rule: "≤ 25" }, { label: "SUFICIENTE", rule: "> 25 até 50" },
    { label: "BOM", rule: "> 50 até 75" }, { label: "ÓTIMO", rule: "> 75 até 100" },
  ],
  b3: [
    { label: "REGULAR", rule: "< 3 ou ≥ 14" }, { label: "ÓTIMO", rule: "≥ 3 e < 10" },
    { label: "BOM", rule: "≥ 10 e < 12" }, { label: "SUFICIENTE", rule: "≥ 12 e < 14" },
  ],
  b4: [
    { label: "REGULAR", rule: "≤ 0,25" }, { label: "SUFICIENTE", rule: "> 0,25 até 0,50" },
    { label: "BOM", rule: "> 0,50 até 1" }, { label: "ÓTIMO", rule: "> 1" },
  ],
  b5: [
    { label: "REGULAR", rule: "< 40 ou > 85" }, { label: "SUFICIENTE", rule: "≥ 40 e < 55" },
    { label: "BOM", rule: "≥ 55 e < 65" }, { label: "ÓTIMO", rule: "≥ 65 até 85" },
  ],
  b6: [
    { label: "REGULAR", rule: "≤ 3" }, { label: "SUFICIENTE", rule: "> 3 até 6" },
    { label: "BOM", rule: "> 6 até 8" }, { label: "ÓTIMO", rule: "> 8" },
  ],
};
