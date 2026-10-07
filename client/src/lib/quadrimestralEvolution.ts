import type { EvolutionPoint } from "./competenceEvolution";
import {
  groupQuadrimestralRows,
  type QuadrimestralRow,
} from "./quadrimestralGrouping";

export function buildQuadrimestralEvolution(
  data: Record<string, QuadrimestralRow[]>,
  periods: string[],
  teamIne: string = "all",
  teamType: string = "all",
): EvolutionPoint[] {
  return periods.map((competence) => {
    const periodRows = data[competence] || [];

    const filteredRows =
      teamType === "all"
        ? periodRows
        : periodRows.filter((row) => row.teamType === teamType);

    const teams = groupQuadrimestralRows(filteredRows);

    if (teamIne !== "all") {
      const team = teams.find((item) => item.ine === teamIne);
      const value = team?.finalValue;

      return {
        competence,
        value:
          typeof value === "number" && Number.isFinite(value)
            ? value
            : null,
      };
    }

    const values = teams
      .map((team) => team.finalValue)
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
