export type ImportReplacementScope =
  | { mode: "period" }
  | { mode: "teamTypes"; teamTypes: string[] };

type ImportRow = {
  teamType?: string | null;
};

export function getImportReplacementScope(
  panelId: string,
  rows: readonly ImportRow[],
): ImportReplacementScope {
  if (panelId !== "quadrimestral-qualidade") {
    return { mode: "period" };
  }

  const teamTypes = Array.from(
    new Set(
      rows
        .map(row => String(row.teamType ?? "").trim())
        .filter(Boolean),
    ),
  ).sort();

  // Um relatório agregado contendo mais de um tipo de equipe
  // representa o período completo e deve substituí-lo integralmente.
  if (teamTypes.length !== 1) {
    return { mode: "period" };
  }

  // Relatório específico de eSF ou eSB: substitui somente
  // o mesmo tipo de equipe, preservando o tipo complementar.
  return { mode: "teamTypes", teamTypes };
}
