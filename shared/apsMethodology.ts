export type ApsPanelId = "acesso" | "infantil" | "gestante" | "diabetes" | "hipertensao" | "idosa" | "cancer";
export type ApsClassification = "ÓTIMO" | "BOM" | "SUFICIENTE" | "REGULAR" | "";

export function isApsPanelId(panelId: string): panelId is ApsPanelId {
  return ["acesso", "infantil", "gestante", "diabetes", "hipertensao", "idosa", "cancer"].includes(panelId);
}

/** Classificação oficial baseada exclusivamente no resultado SIAPS já preservado. */
export function classifyApsValue(panelId: string, value: number | null | undefined): ApsClassification {
  if (!isApsPanelId(panelId) || value == null || !Number.isFinite(value)) return "";
  if (panelId === "acesso") {
    if (value <= 10 || value > 70) return "REGULAR";
    if (value <= 30) return "SUFICIENTE";
    if (value <= 50) return "BOM";
    if (value <= 70) return "ÓTIMO";
    return "REGULAR";
  }
  if (value <= 25) return "REGULAR";
  if (value <= 50) return "SUFICIENTE";
  if (value <= 75) return "BOM";
  if (value <= 100) return "ÓTIMO";
  return "";
}

/** Faixas implementadas; validação com notas metodológicas pendente. */
export const apsScoreBands: Record<ApsPanelId, { label: string; rule: string }[]> = {
  acesso: [
    { label: "REGULAR", rule: "Até 10% ou acima de 70%" },
    { label: "SUFICIENTE", rule: "Acima de 10% até 30%" },
    { label: "BOM", rule: "Acima de 30% até 50%" },
    { label: "ÓTIMO", rule: "Acima de 50% até 70%" },
  ],
  infantil: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
  gestante: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
  diabetes: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
  hipertensao: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
  idosa: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
  cancer: [
    { label: "REGULAR", rule: "Até 25%" },
    { label: "SUFICIENTE", rule: "Acima de 25% até 50%" },
    { label: "BOM", rule: "Acima de 50% até 75%" },
    { label: "ÓTIMO", rule: "Acima de 75% até 100%" },
  ],
};
