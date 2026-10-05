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

  it("deduplicates quadrimestral indicator rows by team before ranking", () => {
    const datasets = { "quadrimestral-qualidade": {
      "Q1/26": [
        row("A", 1, "BOM", { ine: "INE-A", indicator: "C1", finalValue: 9, finalClassification: "ÓTIMO" }),
        row("A", 2, "BOM", { ine: "INE-A", indicator: "C2", finalValue: 9, finalClassification: "ÓTIMO" }),
        row("B", 3, "BOM", { ine: "INE-B", indicator: "C1", finalValue: 8, finalClassification: "BOM" }),
      ],
    } };

    const result = buildQuadrimestreHighlight(datasets, "quadrimestral-qualidade", "eSF");

    expect(result.totalRows).toBe(2);
    expect(result.valueRows).toBe(2);
    expect(result.rows.map(item => [item.position, item.name])).toEqual([[1, "A"], [2, "B"]]);
  });

  it("builds separate quadrimestral rankings for eSF and eSB", () => {
    const datasets = { "quadrimestral-qualidade": {
      "Q1/26": [
        row("APS A", 1, "BOM", { ine: "SF-A", teamType: "eSF", finalValue: 7.5, finalClassification: "BOM" }),
        row("APS B", 1, "BOM", { ine: "SF-B", teamType: "eSF", finalValue: 7.25, finalClassification: "BOM" }),
        row("ESB A", 1, "ÓTIMO", { ine: "SB-A", teamType: "eSB", finalValue: 9.25, finalClassification: "ÓTIMO" }),
        row("ESB A", 2, "ÓTIMO", { ine: "SB-A", teamType: "eSB", indicator: "B2", finalValue: 9.25, finalClassification: "ÓTIMO" }),
        row("ESB B", 1, "BOM", { ine: "SB-B", teamType: "eSB", finalValue: 8.5, finalClassification: "BOM" }),
      ],
    } };

    const summary = buildPublicSummary(datasets);

    expect(summary.quadrimestral.aps.totalRows).toBe(2);
    expect(summary.quadrimestral.aps.rows.map(item => item.name)).toEqual(["APS A", "APS B"]);

    expect(summary.quadrimestral.oral.available).toBe(true);
    expect(summary.quadrimestral.oral.totalRows).toBe(2);
    expect(summary.quadrimestral.oral.rows.map(item => item.name)).toEqual(["ESB A", "ESB B"]);
  });

  it("keeps oral quadrimestral unavailable when no official eSB rows exist", () => {
    const datasets = { "quadrimestral-qualidade": {
      "Q1/26": [
        row("APS A", 1, "BOM", { teamType: "eSF", finalValue: 7.5, finalClassification: "BOM" }),
      ],
    } };

    const summary = buildPublicSummary(datasets);

    expect(summary.quadrimestral.oral.available).toBe(false);
    expect(summary.quadrimestral.oral.rows).toEqual([]);
  });
});
