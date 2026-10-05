import { describe, expect, it } from "vitest";
import { buildMonthlyHighlight, buildPublicSummary, buildQuadrimestreHighlight, formatMonthlyCompetence, latestMonthlyCompetence } from "./publicSummary";
import type { StoredStore } from "./importStore";

const row = (name: string, value: number | null, classification = "BOM", extra: Record<string, unknown> = {}) => ({
  ine: name, cnes: "1", establishment: "UBS", name, teamType: "eSF", value, classification, practices: [], ...extra,
});

describe("public summary", () => {
  it("selects the most recent valid monthly competence chronologically", () => {
    const datasets = { acesso: { "DEZ/25": [], "JAN/26": [], "AGO/26": [], "texto": [] } };
    expect(latestMonthlyCompetence(datasets)).toBe("AGO/26");
    expect(formatMonthlyCompetence("JUL/26")).toBe("Julho de 2026");
  });

  it("changes automatically when a later persisted competence exists", () => {
    const before = { acesso: { "JUL/26": [] } };
    const after = { acesso: { "JUL/26": [], "AGO/26": [] } };
    expect(buildPublicSummary(before).monthly?.competence).toBe("JUL/26");
    expect(buildPublicSummary(after).monthly?.competence).toBe("AGO/26");
  });

  it("ranks monthly highlights per indicator, excludes nulls, preserves coverage and ties", () => {
    const datasets = { acesso: { "JUL/26": [row("A", 80, "REGULAR"), row("B", 60, "ÓTIMO"), row("C", 60, "ÓTIMO"), row("D", null)] } };
    const result = buildMonthlyHighlight(datasets, "acesso", "JUL/26");
    expect(result.totalRows).toBe(4);
    expect(result.valueRows).toBe(3);
    expect(result.rows.map(item => [item.position, item.name])).toEqual([[1, "B"], [1, "C"], [3, "A"]]);
  });

  it("uses finalValue and finalClassification for the latest official quadrimestre", () => {
    const datasets = { "quadrimestral-qualidade": {
      "Q3/25": [row("old", 99, "ÓTIMO", { finalValue: 9, finalClassification: "ÓTIMO" })],
      "Q1/26": [row("A", 7.25, "BOM", { finalValue: 7.25, finalClassification: "BOM" }), row("B", 7.5, "BOM", { finalValue: 7.5, finalClassification: "BOM" }), row("C", 7.25, "BOM", { finalValue: 7.25, finalClassification: "BOM" })],
    } };
    const result = buildQuadrimestreHighlight(datasets, "quadrimestral-qualidade");
    expect(result.competence).toBe("Q1/26");
    expect(result.rows.map(item => [item.position, item.name])).toEqual([[1, "B"], [2, "A"], [2, "C"]]);
  });

  it("does not invent a quadrimestral oral ranking", () => {
    const summary = buildPublicSummary({ b1: { "JUL/26": [row("B1", 3)] } });
    expect(summary.quadrimestral.oral.available).toBe(false);
    expect(summary.quadrimestral.oral.rows).toEqual([]);
  });
});
