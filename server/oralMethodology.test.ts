import { describe, expect, it } from "vitest";
import { classifyOralValue, findOralResultMetric, recoverOralValue } from "@shared/oralMethodology";

describe("Notas Metodológicas Saúde Bucal", () => {
  const cases = [
    ["b1", [[0.25, "REGULAR"], [0.2501, "SUFICIENTE"], [0.75, "SUFICIENTE"], [0.7501, "BOM"], [1.25, "BOM"], [1.2501, "ÓTIMO"]]],
    ["b2", [[25, "REGULAR"], [25.01, "SUFICIENTE"], [50, "SUFICIENTE"], [50.01, "BOM"], [75, "BOM"], [75.01, "ÓTIMO"], [100, "ÓTIMO"]]],
    ["b3", [[2.99, "REGULAR"], [3, "ÓTIMO"], [9.99, "ÓTIMO"], [10, "BOM"], [11.99, "BOM"], [12, "SUFICIENTE"], [13.99, "SUFICIENTE"], [14, "REGULAR"]]],
    ["b4", [[0.25, "REGULAR"], [0.2501, "SUFICIENTE"], [0.5, "SUFICIENTE"], [0.5001, "BOM"], [1, "BOM"], [1.01, "ÓTIMO"]]],
    ["b5", [[39.99, "REGULAR"], [40, "SUFICIENTE"], [54.99, "SUFICIENTE"], [55, "BOM"], [64.99, "BOM"], [65, "ÓTIMO"], [85, "ÓTIMO"], [85.01, "REGULAR"]]],
    ["b6", [[3, "REGULAR"], [3.01, "SUFICIENTE"], [6, "SUFICIENTE"], [6.01, "BOM"], [8, "BOM"], [8.01, "ÓTIMO"]]],
  ] as const;

  it.each(cases)("classifies %s at every methodological boundary", (panel, values) => {
    for (const [value, expected] of values) expect(classifyOralValue(panel, value)).toBe(expected);
  });

  it("recovers the result from the semantic metric label, not array position", () => {
    const metrics = [
      { label: "Numerador", value: 98 },
      { label: "Denominador", value: 273 },
      { label: "Nº total de procedimentos odontológicos individuais realizados", value: 35.9 },
    ];
    expect(findOralResultMetric("b5", metrics)?.value).toBe(35.9);
    expect(recoverOralValue("b5", metrics)).toBe(35.9);
  });
});
