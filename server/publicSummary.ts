import { compareMonthlyCompetences, isMonthlyCompetence } from "@shared/competence";
import { StoredRow, StoredStore } from "./importStore";

export const APS_PANELS = ["acesso", "infantil", "gestante", "diabetes", "hipertensao", "idosa", "cancer"] as const;
export const ORAL_PANELS = ["b1", "b2", "b3", "b4", "b5", "b6"] as const;

const MONTH_LABELS: Record<string, string> = {
  JAN: "Janeiro", FEV: "Fevereiro", MAR: "Março", ABR: "Abril", MAI: "Maio", JUN: "Junho",
  JUL: "Julho", AGO: "Agosto", SET: "Setembro", OUT: "Outubro", NOV: "Novembro", DEZ: "Dezembro",
};
const CLASSIFICATION_RANK: Record<string, number> = { REGULAR: 1, SUFICIENTE: 2, BOM: 3, "ÓTIMO": 4 };

export type Highlight = {
  position: number;
  name: string;
  ine: string;
  value: number;
  classification: string;
  movement?: number | null;
};

export type PanelHighlight = {
  panelId: string;
  competence: string;
  totalRows: number;
  valueRows: number;
  rows: Highlight[];
};

export function formatMonthlyCompetence(competence: string): string {
  const [month, year] = competence.split("/");
  return `${MONTH_LABELS[month] || month} de 20${year}`;
}

export function latestMonthlyCompetence(datasets: StoredStore["datasets"]): string | null {
  const all = Object.values(datasets).flatMap(dataset => Object.keys(dataset)).filter(isMonthlyCompetence);
  return all.sort(compareMonthlyCompetences).at(-1) || null;
}

function rankMonthlyRows(rows: StoredRow[], panelId: string, competence: string): PanelHighlight {
  const eligible = rows.filter((row): row is StoredRow & { value: number } => typeof row.value === "number" && Number.isFinite(row.value));
  const sorted = [...eligible].sort((a, b) => {
    const classDelta = (CLASSIFICATION_RANK[b.classification] || 0) - (CLASSIFICATION_RANK[a.classification] || 0);
    if (classDelta) return classDelta;
    const valueDelta = b.value - a.value;
    if (valueDelta) return valueDelta;
    return a.ine.localeCompare(b.ine);
  });
  const rowsWithPositions: Highlight[] = [];
  let previousKey = "";
  let previousPosition = 0;
  sorted.forEach((row, index) => {
    const key = `${row.classification}|${row.value}`;
    const position = key === previousKey ? previousPosition : index + 1;
    rowsWithPositions.push({ position, name: row.name, ine: row.ine, value: row.value, classification: row.classification });
    previousKey = key;
    previousPosition = position;
  });
  return { panelId, competence, totalRows: rows.length, valueRows: eligible.length, rows: rowsWithPositions.filter(row => row.position <= 5) };
}

export function buildMonthlyHighlight(datasets: StoredStore["datasets"], panelId: string, competence: string): PanelHighlight {
  const current = rankMonthlyRows(datasets[panelId]?.[competence] || [], panelId, competence);
  const previousCompetence = Object.keys(datasets[panelId] || {})
    .filter(item => isMonthlyCompetence(item) && compareMonthlyCompetences(item, competence) < 0)
    .sort(compareMonthlyCompetences)
    .at(-1);

  if (!previousCompetence) {
    return { ...current, rows: current.rows.map(row => ({ ...row, movement: null })) };
  }

  // Recalcula todas as posições anteriores, não apenas os cinco destaques.
  const previousRows = datasets[panelId]?.[previousCompetence] || [];
  const eligible = previousRows.filter(
    (row): row is StoredRow & { value: number } =>
      typeof row.value === "number" && Number.isFinite(row.value),
  );
  const sorted = [...eligible].sort((a, b) => {
    const classDelta = (CLASSIFICATION_RANK[b.classification] || 0) -
      (CLASSIFICATION_RANK[a.classification] || 0);
    return classDelta || b.value - a.value || a.ine.localeCompare(b.ine);
  });

  const previousPositions = new Map<string, number>();
  let lastKey = "";
  let lastPosition = 0;

  sorted.forEach((row, index) => {
    const key = `${row.classification}|${row.value}`;
    const position = key === lastKey ? lastPosition : index + 1;
    previousPositions.set(row.ine, position);
    lastKey = key;
    lastPosition = position;
  });

  return {
    ...current,
    rows: current.rows.map(row => ({
      ...row,
      movement: previousPositions.has(row.ine)
        ? previousPositions.get(row.ine)! - row.position
        : null,
    })),
  };
}

export function latestQuadrimestre(datasets: StoredStore["datasets"], panelId: string) {
  const periods = Object.keys(datasets[panelId] || {}).filter(value => /^Q[1-3]\/\d{2}$/.test(value));
  return periods.sort((a, b) => {
    const [qa, ya] = a.slice(1).split("/").map(Number);
    const [qb, yb] = b.slice(1).split("/").map(Number);
    return ya - yb || qa - qb;
  }).at(-1) || null;
}

export function buildQuadrimestreHighlight(
  datasets: StoredStore["datasets"],
  panelId: string,
  teamType?: string,
) {
  const competence = latestQuadrimestre(datasets, panelId);

  const rankPeriod = (period: string | null) => {
    const allRows = period ? datasets[panelId]?.[period] || [] : [];
    const filteredRows = teamType
      ? allRows.filter(row => row.teamType === teamType)
      : allRows;

    const uniqueRows = Array.from(
      new Map(
        filteredRows.map(row => [`${row.teamType}|${row.ine}`, row] as const),
      ).values(),
    );

    const eligible = uniqueRows.filter(
      (row): row is StoredRow & { finalValue: number } =>
        typeof row.finalValue === "number" && Number.isFinite(row.finalValue),
    );

    const sorted = [...eligible].sort(
      (a, b) => b.finalValue - a.finalValue || a.ine.localeCompare(b.ine),
    );

    const output: Highlight[] = [];
    let previousValue: number | null = null;
    let previousPosition = 0;

    sorted.forEach((row, index) => {
      const position = row.finalValue === previousValue
        ? previousPosition
        : index + 1;

      output.push({
        position,
        name: row.name,
        ine: row.ine,
        value: row.finalValue,
        classification: row.finalClassification || row.classification,
      });

      previousValue = row.finalValue;
      previousPosition = position;
    });

    return { totalRows: uniqueRows.length, valueRows: eligible.length, output };
  };

  const current = rankPeriod(competence);

  const previousCompetence = Object.keys(datasets[panelId] || {})
    .filter(period =>
      /^Q[1-3]\/\d{2}$/.test(period) &&
      period !== competence &&
      period === latestQuadrimestre({
        [panelId]: Object.fromEntries(
          Object.entries(datasets[panelId] || {}).filter(([key]) =>
            /^Q[1-3]\/\d{2}$/.test(key) &&
            (Number(key.slice(3)) * 3 + Number(key[1])) <
            (Number((competence || "").slice(3)) * 3 + Number((competence || "")[1]))
          ),
        ),
      } as StoredStore["datasets"], panelId)
    )
    .at(0) || null;

  const previous = previousCompetence ? rankPeriod(previousCompetence) : null;
  const previousPositions = new Map(
    (previous?.output || []).map(row => [row.ine, row.position]),
  );

  return {
    panelId,
    competence,
    totalRows: current.totalRows,
    valueRows: current.valueRows,
    rows: current.output
      .filter(row => row.position <= 5)
      .map(row => ({
        ...row,
        movement: previousPositions.has(row.ine)
          ? previousPositions.get(row.ine)! - row.position
          : null,
      })),
  };
}

export function buildPublicSummary(datasets: StoredStore["datasets"]) {
  const monthlyCompetence = latestMonthlyCompetence(datasets);
  const monthly = monthlyCompetence ? {
    competence: monthlyCompetence,
    label: formatMonthlyCompetence(monthlyCompetence),
    aps: Object.fromEntries(APS_PANELS.map(panelId => [panelId, buildMonthlyHighlight(datasets, panelId, monthlyCompetence)])),
    oral: Object.fromEntries(ORAL_PANELS.map(panelId => [panelId, buildMonthlyHighlight(datasets, panelId, monthlyCompetence)])),
  } : null;
  const qualityAps = buildQuadrimestreHighlight(datasets, "quadrimestral-qualidade", "eSF");
  const qualityOral = buildQuadrimestreHighlight(datasets, "quadrimestral-qualidade", "eSB");
  return {
    monthly,
    quadrimestral: {
      competence: qualityAps.competence || qualityOral.competence,
      aps: qualityAps,
      oral: {
        ...qualityOral,
        available: qualityOral.valueRows > 0,
      },
    },
  };
}
