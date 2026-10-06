export type QuadrimestralRow = {
  ine: string;
  cnes: string;
  establishment: string;
  name: string;
  teamType: string;
  value: number | null;
  classification: string;
  dimension?: string;
  indicator?: string;
  finalValue?: number | null;
  finalClassification?: string;
};

export type IndicatorResult = {
  key: string;
  label: string;
  value: number | null;
};

export type QuadrimestralTeam = QuadrimestralRow & {
  indicators: IndicatorResult[];
};

const indicatorDefinitions = [
  ["c1", "C1 Mais Acesso à APS", ["mais acesso"]],
  ["c2", "C2 Cuidado no desenvolvimento infantil", ["desenvolvimento infantil"]],
  ["c3", "C3 Cuidado na Gestação e Puerpério", ["gestação", "gestacao"]],
  ["c4", "C4 Cuidado da pessoa com Diabetes", ["diabetes"]],
  ["c5", "C5 Cuidado da pessoa com Hipertensão", ["hipertensão", "hipertensao"]],
  ["c6", "C6 Cuidado da pessoa idosa", ["pessoa idosa"]],
  ["c7", "C7 Cuidado da mulher na prevenção do câncer", ["prevenção do câncer", "prevencao do cancer"]],
  ["b1", "B1 Primeira consulta odontológica programada", ["primeira consulta odontológica", "primeira consulta odontologica"]],
  ["b2", "B2 Tratamento Odontológico Concluído", ["tratamento odontológico concluído", "tratamento odontologico concluido"]],
  ["b3", "B3 Taxa de exodontias", ["taxa de exodontias"]],
  ["b4", "B4 Escovação supervisionada", ["escovação supervisionada", "escovacao supervisionada"]],
  ["b5", "B5 Procedimentos odontológicos individuais preventivos", ["procedimentos odontológicos individuais preventivos", "procedimentos odontologicos individuais preventivos"]],
  ["b6", "B6 Tratamento Restaurador Atraumático (TRA)", ["tratamento restaurador atraumático", "tratamento restaurador atraumatico"]],
] as const;

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR");

export function indicatorDefinition(label: string | undefined) {
  if (!label) return null;
  const normalized = normalize(label);
  return indicatorDefinitions.find(([, , aliases]) => aliases.some((alias) => normalized.includes(normalize(alias)))) ?? null;
}

export function groupQuadrimestralRows(rows: readonly QuadrimestralRow[]): QuadrimestralTeam[] {
  const groups = new Map<string, QuadrimestralTeam>();

  for (const row of rows) {
    const current = groups.get(row.ine) ?? {
      ...row,
      indicators: [],
    };
    const definition = indicatorDefinition(row.indicator || row.dimension);

    if (definition) {
      const [key, label] = definition;
      const existing = current.indicators.find((indicator) => indicator.key === key);
      if (!existing || (existing.value == null && row.value != null)) {
        const next = { key, label, value: row.value };
        current.indicators = existing
          ? current.indicators.map((indicator) => indicator.key === key ? next : indicator)
          : [...current.indicators, next];
      }
    } else if (row.finalValue != null || row.finalClassification || row.value != null) {
      current.value = row.value;
      current.classification = row.classification;
      current.finalValue = row.finalValue ?? row.value;
      current.finalClassification = row.finalClassification || row.classification;
    }

    groups.set(row.ine, current);
  }

  return Array.from(groups.values()).map((team) => ({
    ...team,
    indicators: [...team.indicators].sort((a, b) => a.key.localeCompare(b.key)),
  }));
}
