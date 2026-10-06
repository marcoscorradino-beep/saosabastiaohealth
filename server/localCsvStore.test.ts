import { describe, expect, it } from "vitest";
import { selectLocalCandidates } from "./localCsvStore";

function candidate(
  filename: string,
  teamType: string,
  count: number,
  mtime = 1,
) {
  return {
    panelId: "quadrimestral-qualidade",
    datasetType: "Componente Qualidade",
    competence: "Q1/25",
    filename,
    mtime,
    rows: Array.from({ length: count }, (_, index) => ({
      ine: `${teamType}-${index + 1}`,
      cnes: `CNES-${index + 1}`,
      establishment: `UBS ${index + 1}`,
      name: `${teamType} ${index + 1}`,
      teamType,
      value: 7,
      classification: "BOM",
      practices: [],
      finalValue: 7,
      finalClassification: "BOM",
    })),
  };
}

describe("localCsvStore candidate selection", () => {
  it("combines complementary eSF and eSB quality files while rejecting a partial duplicate", () => {
    const esf = candidate("qualidade-esf.csv", "eSF", 26, 100);
    const esb = candidate("qualidade-esb.csv", "eSB", 24, 100);
    const partial = candidate("qualidade-esf-parcial.csv", "eSF", 5, 200);

    const selected = selectLocalCandidates([esf, esb, partial]);
    const rows =
      selected.datasets["quadrimestral-qualidade"]?.["Q1/25"] ?? [];

    expect(rows).toHaveLength(50);
    expect(rows.filter(row => row.teamType === "eSF")).toHaveLength(26);
    expect(rows.filter(row => row.teamType === "eSB")).toHaveLength(24);
  });

  it("preserves a complete mixed eSF/eSB aggregate without collapsing indicator rows", () => {
    const mixed = {
      ...candidate("Dado_Agregado_Quadrimestre_Qualidade.csv", "eSF", 0, 300),
      competence: "Q1/26",
      rows: [
        ...Array.from({ length: 182 }, (_, index) => ({
          ine: `eSF-${(index % 26) + 1}`,
          cnes: `CNES-eSF-${(index % 26) + 1}`,
          establishment: "UBS",
          name: `eSF ${(index % 26) + 1}`,
          teamType: "eSF",
          value: 7,
          classification: "BOM",
          practices: [],
          indicator: `C${(index % 7) + 1}`,
          finalValue: 7,
          finalClassification: "BOM",
        })),
        ...Array.from({ length: 144 }, (_, index) => ({
          ine: `eSB-${(index % 24) + 1}`,
          cnes: `CNES-eSB-${(index % 24) + 1}`,
          establishment: "UBS",
          name: `eSB ${(index % 24) + 1}`,
          teamType: "eSB",
          value: 8,
          classification: "ÓTIMO",
          practices: [],
          indicator: `B${(index % 6) + 1}`,
          finalValue: 8,
          finalClassification: "ÓTIMO",
        })),
      ],
    };

    const separateEsf = {
      ...candidate("qualidade-esf.csv", "eSF", 26, 400),
      competence: "Q1/26",
    };
    const separateEsb = {
      ...candidate("qualidade-esb.csv", "eSB", 24, 400),
      competence: "Q1/26",
    };

    const selected = selectLocalCandidates([
      mixed,
      separateEsf,
      separateEsb,
    ]);

    const rows =
      selected.datasets["quadrimestral-qualidade"]?.["Q1/26"] ?? [];

    expect(rows).toHaveLength(326);
    expect(new Set(rows.map(row => `${row.teamType}|${row.ine}`))).toHaveLength(50);
    expect(rows.filter(row => row.teamType === "eSF")).toHaveLength(182);
    expect(rows.filter(row => row.teamType === "eSB")).toHaveLength(144);
  });

  it("keeps the existing winner-takes-one behavior for non-quality panels", () => {
    const candidates = [
      {
        ...candidate("territorial-menor.csv", "eSF", 5, 100),
        panelId: "territorial",
      },
      {
        ...candidate("territorial-maior.csv", "eSF", 26, 200),
        panelId: "territorial",
      },
    ];

    const selected = selectLocalCandidates(candidates);
    const rows = selected.datasets["territorial"]?.["Q1/25"] ?? [];

    expect(rows).toHaveLength(26);
  });
});
