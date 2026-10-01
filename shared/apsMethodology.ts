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
