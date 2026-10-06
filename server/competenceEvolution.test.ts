import { describe, expect, it } from "vitest";
import { buildCompetenceEvolution } from "../client/src/lib/competenceEvolution";

describe("buildCompetenceEvolution", () => {
  const data = {
    "JAN/26": [
      { ine: "A", value: 10 },
      { ine: "B", value: 20 },
    ],
    "FEV/26": [
      { ine: "A", value: 30 },
      { ine: "B", value: null },
    ],
    "MAR/26": [
      { ine: "A", value: 0 },
      { ine: "B", value: 40 },
    ],
  };

  const periods = ["JAN/26", "FEV/26", "MAR/26"];

  it("calcula a média municipal por competência", () => {
    expect(buildCompetenceEvolution(data, periods)).toEqual([
      { competence: "JAN/26", value: 15 },
      { competence: "FEV/26", value: 30 },
      { competence: "MAR/26", value: 20 },
    ]);
  });

  it("mantém zero como resultado válido", () => {
    expect(buildCompetenceEvolution(data, periods, "A")).toEqual([
      { competence: "JAN/26", value: 10 },
      { competence: "FEV/26", value: 30 },
      { competence: "MAR/26", value: 0 },
    ]);
  });

  it("retorna nulo quando a equipe não possui resultado na competência", () => {
    expect(buildCompetenceEvolution(data, periods, "B")).toEqual([
      { competence: "JAN/26", value: 20 },
      { competence: "FEV/26", value: null },
      { competence: "MAR/26", value: 40 },
    ]);
  });

  it("preserva a ordem das competências recebidas", () => {
    const reversed = ["MAR/26", "JAN/26"];

    expect(buildCompetenceEvolution(data, reversed).map(point => point.competence))
      .toEqual(["MAR/26", "JAN/26"]);
  });
});
