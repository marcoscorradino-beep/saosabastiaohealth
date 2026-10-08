export type ApsIndicatorCode =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7";

export type OralIndicatorCode =
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5"
  | "B6";

export type RegionalIndicatorCode = ApsIndicatorCode | OralIndicatorCode;

export type ConceptCounts = {
  regular: number;
  sufficient: number;
  good: number;
  excellent: number;
};

export type RegionalComparisonRow = {
  competence: string;
  uf: string;
  ibge: string;
  municipality: string;
  teamType: string;
  indicator: RegionalIndicatorCode;
  indicatorName: string;
  counts: ConceptCounts;
};

export type RegionalAggregate = {
  competence: string;
  indicator: RegionalIndicatorCode;
  counts: ConceptCounts;
  totalTeams: number;
  percentages: {
    regular: number;
    sufficient: number;
    good: number;
    excellent: number;
  };
  comparisonIndex: number | null;
};

const indicatorMap: Array<[string, ApsIndicatorCode]> = [
  ["mais acesso", "C1"],
  ["desenvolvimento infantil", "C2"],
  ["gestante", "C3"],
  ["diabetes", "C4"],
  ["hipertens", "C5"],
  ["pessoa idosa", "C6"],
  ["saúde da mulher", "C7"],
  ["saude da mulher", "C7"],
];

const oralIndicatorMap: Array<[string, OralIndicatorCode]> = [
  ["1ª consulta odontologica programada", "B1"],
  ["tratamento odontologico concluido", "B2"],
  ["taxa de exodontias", "B3"],
  ["escovacao supervisionada", "B4"],
  ["procedimentos odontologicos preventivos", "B5"],
  ["tratamento restaurador atraumatico", "B6"],
];

export function mapOralIndicator(value: string): OralIndicatorCode | null {
  const normalized = normalizeText(value);

  for (const [needle, code] of oralIndicatorMap) {
    if (normalized.includes(needle)) return code;
  }

  return null;
}

function clean(value: string): string {
  return value.replace(/^"+|"+$/g, "").trim();
}

function numberValue(value: string): number {
  const parsed = Number(clean(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: string): string {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeQuarter(value: string): string {
  const cleaned = clean(value);

  const match = cleaned.match(/^(\d{4})Q([1-4])$/i);
  if (!match) return cleaned;

  return `Q${match[2]}/${match[1].slice(-2)}`;
}

export function mapApsIndicator(value: string): ApsIndicatorCode | null {
  const normalized = normalizeText(value);

  for (const [needle, code] of indicatorMap) {
    if (normalized.includes(normalizeText(needle))) return code;
  }

  return null;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ";" && !quoted) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

export function parseRegionalComparisonCsv(
  content: string,
): RegionalComparisonRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);

  const headerIndex = lines.findIndex(line =>
    line.startsWith("Quadrimestre/Ano;"),
  );

  if (headerIndex < 0) {
    throw new Error(
      "Cabeçalho do relatório Qualidade – Conceito obtido por indicador não encontrado.",
    );
  }

  const rows: RegionalComparisonRow[] = [];

  for (const line of lines.slice(headerIndex + 1)) {
    const fields = parseCsvLine(line);
    if (fields.length < 10) continue;

    const [
      competenceRaw,
      ufRaw,
      ibgeRaw,
      municipalityRaw,
      teamTypeRaw,
      indicatorNameRaw,
      regularRaw,
      sufficientRaw,
      goodRaw,
      excellentRaw,
    ] = fields;

    const teamType = clean(teamTypeRaw);

    // Cada indicador deve corresponder ao tipo correto de equipe.
    if (!["eSF", "eAP", "eSB"].includes(teamType)) continue;

    const indicator =
      teamType === "eSB"
        ? mapOralIndicator(indicatorNameRaw)
        : mapApsIndicator(indicatorNameRaw);

    if (!indicator) continue;

    rows.push({
      competence: normalizeQuarter(competenceRaw),
      uf: clean(ufRaw),
      ibge: clean(ibgeRaw),
      municipality: clean(municipalityRaw),
      teamType,
      indicator,
      indicatorName: clean(indicatorNameRaw),
      counts: {
        regular: numberValue(regularRaw),
        sufficient: numberValue(sufficientRaw),
        good: numberValue(goodRaw),
        excellent: numberValue(excellentRaw),
      },
    });
  }

  return rows;
}

export function aggregateRegionalComparison(
  rows: RegionalComparisonRow[],
  competence: string,
  indicator: RegionalIndicatorCode,
): RegionalAggregate {
  const requiredTeamType = indicator.startsWith("B") ? "eSB" : "eSF";

  const selected = rows.filter(
    row =>
      row.competence === competence &&
      row.indicator === indicator &&
      row.teamType === requiredTeamType,
  );

  const counts = selected.reduce<ConceptCounts>(
    (acc, row) => ({
      regular: acc.regular + row.counts.regular,
      sufficient: acc.sufficient + row.counts.sufficient,
      good: acc.good + row.counts.good,
      excellent: acc.excellent + row.counts.excellent,
    }),
    {
      regular: 0,
      sufficient: 0,
      good: 0,
      excellent: 0,
    },
  );

  const totalTeams =
    counts.regular +
    counts.sufficient +
    counts.good +
    counts.excellent;

  const percent = (value: number) =>
    totalTeams > 0 ? (value / totalTeams) * 100 : 0;

  // Índice comparativo do dashboard.
  // Usa a equivalência oficial dos conceitos:
  // Regular=.25, Suficiente=.50, Bom=.75, Ótimo=1.00.
  // Não representa a Nota Final oficial do Componente III.
  const comparisonIndex =
    totalTeams > 0
      ? ((counts.regular * 0.25 +
          counts.sufficient * 0.5 +
          counts.good * 0.75 +
          counts.excellent) /
          totalTeams) *
        100
      : null;

  return {
    competence,
    indicator,
    counts,
    totalTeams,
    percentages: {
      regular: percent(counts.regular),
      sufficient: percent(counts.sufficient),
      good: percent(counts.good),
      excellent: percent(counts.excellent),
    },
    comparisonIndex,
  };
}
