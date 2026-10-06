export type EvolutionRow = {
  ine: string;
  value: number | null;
};

export type EvolutionPoint = {
  competence: string;
  value: number | null;
};

export function buildCompetenceEvolution(
  data: Record<string, EvolutionRow[]>,
  periods: string[],
  teamIne: string = "all",
): EvolutionPoint[] {
  return periods.map((competence) => {
    const rows = data[competence] || [];

    if (teamIne !== "all") {
      const row = rows.find((item) => item.ine === teamIne);
      return {
        competence,
        value:
          row && typeof row.value === "number" && Number.isFinite(row.value)
            ? row.value
            : null,
      };
    }

    const values = rows
      .map((row) => row.value)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value),
      );

    return {
      competence,
      value: values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null,
    };
  });
}
