import { describe, expect, it } from "vitest";
import {
  aggregateRegionalComparison,
  mapApsIndicator,
  normalizeQuarter,
  parseRegionalComparisonCsv,
} from "./regionalComparison";

const sample = `Ministério da Saúde - MS
Secretaria de Atenção Primária à Saúde - Saps
Sistema de Informação para a Atenção Primária à Saúde – Siaps
Dado Preliminar

Quadrimestre/Ano;UF;Código IBGE;Município;Tipo de Equipe;Indicador por tipo de equipe;Total de equipe - REGULAR;Total de equipe - SUFICIENTE;Total de equipe - BOM;Total de equipe - ÓTIMO
"2025Q2 ";"SP   ";"355070       ";"SÃO SEBASTIÃO        ";"eSF  ";"Cuidado da Pessoa com Hipertensão";"0    ";"2    ";"24   ";"0    "
"2025Q2 ";"SP   ";"355070       ";"SÃO SEBASTIÃO        ";"eSF  ";"Mais Acesso à Atenção Primária à Saúde   ";"1    ";"8    ";"11   ";"6    "
"2025Q2 ";"SP   ";"355070       ";"SÃO SEBASTIÃO        ";"eSB  ";"1ª Consulta Odontológica programada na APS";"0    ";"0    ";"1    ";"23   "
`;

describe("regionalComparison", () => {
  it("normaliza o quadrimestre do formato SIAPS", () => {
    expect(normalizeQuarter("2025Q2 ")).toBe("Q2/25");
    expect(normalizeQuarter("2026Q1")).toBe("Q1/26");
  });

  it("mapeia os sete indicadores APS", () => {
    expect(mapApsIndicator("Mais Acesso à Atenção Primária à Saúde")).toBe("C1");
    expect(mapApsIndicator("Cuidado no Desenvolvimento Infantil")).toBe("C2");
    expect(mapApsIndicator("Cuidado da Gestante e da Puérpera")).toBe("C3");
    expect(mapApsIndicator("Cuidado da Pessoa com Diabetes Mellitus")).toBe("C4");
    expect(mapApsIndicator("Cuidado da Pessoa com Hipertensão")).toBe("C5");
    expect(mapApsIndicator("Cuidado da Pessoa Idosa")).toBe("C6");
    expect(mapApsIndicator("Cuidado Integral à Saúde da Mulher")).toBe("C7");
  });

  it("lê o relatório SIAPS e identifica equipes APS e Saúde Bucal", () => {
    const rows = parseRegionalComparisonCsv(sample);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      competence: "Q2/25",
      uf: "SP",
      ibge: "355070",
      municipality: "SÃO SEBASTIÃO",
      teamType: "eSF",
      indicator: "C5",
      counts: {
        regular: 0,
        sufficient: 2,
        good: 24,
        excellent: 0,
      },
    });
  });

  it("agrega B1 exclusivamente a partir das equipes eSB", () => {
    const rows = parseRegionalComparisonCsv(sample);
    const result = aggregateRegionalComparison(rows, "Q2/25", "B1");

    expect(rows[2]).toMatchObject({
      teamType: "eSB",
      indicator: "B1",
    });
    expect(result.totalTeams).toBe(24);
    expect(result.counts).toEqual({
      regular: 0,
      sufficient: 0,
      good: 1,
      excellent: 23,
    });
    expect(result.comparisonIndex).toBeCloseTo(98.958, 3);
  });

  it("calcula percentuais e índice comparativo ponderado", () => {
    const rows = parseRegionalComparisonCsv(sample);
    const result = aggregateRegionalComparison(rows, "Q2/25", "C1");

    expect(result.totalTeams).toBe(26);
    expect(result.counts).toEqual({
      regular: 1,
      sufficient: 8,
      good: 11,
      excellent: 6,
    });

    expect(result.percentages.regular).toBeCloseTo(3.846, 3);
    expect(result.percentages.sufficient).toBeCloseTo(30.769, 3);
    expect(result.percentages.good).toBeCloseTo(42.308, 3);
    expect(result.percentages.excellent).toBeCloseTo(23.077, 3);

    expect(result.comparisonIndex).toBeCloseTo(71.154, 3);
  });

  it("não inventa resultado quando não há equipes", () => {
    const rows = parseRegionalComparisonCsv(sample);
    const result = aggregateRegionalComparison(rows, "Q1/26", "C1");

    expect(result.totalTeams).toBe(0);
    expect(result.comparisonIndex).toBeNull();
  });
});

it("exclui eAP da agregação comparativa C1-C7", () => {
  const rows = [
    {
      competence: "Q1/26",
      uf: "SP",
      ibgeCode: "355070",
      municipality: "SÃO SEBASTIÃO",
      teamType: "eSF",
      indicator: "C1" as const,
      indicatorName: "Mais Acesso à Atenção Primária à Saúde",
      counts: { regular: 0, sufficient: 3, good: 20, excellent: 3 },
    },
    {
      competence: "Q1/26",
      uf: "SP",
      ibgeCode: "355070",
      municipality: "SÃO SEBASTIÃO",
      teamType: "eAP",
      indicator: "C1" as const,
      indicatorName: "Mais Acesso à Atenção Primária à Saúde",
      counts: { regular: 100, sufficient: 0, good: 0, excellent: 0 },
    },
  ];

  const result = aggregateRegionalComparison(rows, "Q1/26", "C1");

  expect(result.totalTeams).toBe(26);
  expect(result.counts).toEqual({
    regular: 0,
    sufficient: 3,
    good: 20,
    excellent: 3,
  });
});
