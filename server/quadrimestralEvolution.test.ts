import { describe, expect, it } from "vitest";
import { buildQuadrimestralEvolution } from "../client/src/lib/quadrimestralEvolution";
import type { QuadrimestralRow } from "../client/src/lib/quadrimestralGrouping";

function row(
  ine: string,
  teamType: string,
  value: number | null,
  finalValue: number | null,
  indicator?: string,
): QuadrimestralRow {
  return {
    ine,
    cnes: `CNES-${ine}`,
    establishment: `Unidade ${ine}`,
    name: `Equipe ${ine}`,
    teamType,
    value,
    classification: "",
    indicator,
    finalValue,
    finalClassification: "",
  };
}

describe("buildQuadrimestralEvolution", () => {
  const data: Record<string, QuadrimestralRow[]> = {
    "Q1/25": [
      row("ESF-1", "eSF", 40, 6, "C1 Mais Acesso à APS"),
      row("ESF-1", "eSF", 50, 6, "C2 Cuidado no desenvolvimento infantil"),
      row("ESF-2", "eSF", 60, 8, "C1 Mais Acesso à APS"),
      row("ESF-2", "eSF", 70, 8, "C2 Cuidado no desenvolvimento infantil"),
      row("ESB-1", "eSB", 2, 9, "B1 Primeira consulta odontológica programada"),
      row("ESB-1", "eSB", 80, 9, "B2 Tratamento Odontológico Concluído"),
    ],
    "Q2/25": [
      row("ESF-1", "eSF", 45, 7, "C1 Mais Acesso à APS"),
      row("ESF-2", "eSF", 65, 9, "C1 Mais Acesso à APS"),
      row("ESB-1", "eSB", 3, 8, "B1 Primeira consulta odontológica programada"),
    ],
  };

  it("calcula a média municipal pelas notas finais das equipes, não pelas linhas de indicadores", () => {
    expect(
      buildQuadrimestralEvolution(data, ["Q1/25", "Q2/25"]),
    ).toEqual([
      { competence: "Q1/25", value: (6 + 8 + 9) / 3 },
      { competence: "Q2/25", value: (7 + 9 + 8) / 3 },
    ]);
  });

  it("filtra somente eSF antes de agrupar", () => {
    expect(
      buildQuadrimestralEvolution(data, ["Q1/25", "Q2/25"], "all", "eSF"),
    ).toEqual([
      { competence: "Q1/25", value: 7 },
      { competence: "Q2/25", value: 8 },
    ]);
  });

  it("filtra somente eSB antes de agrupar", () => {
    expect(
      buildQuadrimestralEvolution(data, ["Q1/25", "Q2/25"], "all", "eSB"),
    ).toEqual([
      { competence: "Q1/25", value: 9 },
      { competence: "Q2/25", value: 8 },
    ]);
  });

  it("acompanha a nota final de uma equipe específica", () => {
    expect(
      buildQuadrimestralEvolution(data, ["Q1/25", "Q2/25"], "ESF-1", "eSF"),
    ).toEqual([
      { competence: "Q1/25", value: 6 },
      { competence: "Q2/25", value: 7 },
    ]);
  });

  it("retorna null quando a equipe não possui dado no período", () => {
    expect(
      buildQuadrimestralEvolution(
        {
          ...data,
          "Q3/25": [row("ESF-2", "eSF", 70, 9, "C1 Mais Acesso à APS")],
        },
        ["Q1/25", "Q2/25", "Q3/25"],
        "ESF-1",
        "eSF",
      ),
    ).toEqual([
      { competence: "Q1/25", value: 6 },
      { competence: "Q2/25", value: 7 },
      { competence: "Q3/25", value: null },
    ]);
  });
});
