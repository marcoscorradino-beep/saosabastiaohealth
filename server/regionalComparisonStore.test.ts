import { describe, expect, it } from "vitest";
import { buildRegionalComparisonFromDirectory } from "./regionalComparisonStore";

describe("regionalComparisonStore", () => {
  it("consolida os seis territórios usando somente eSF", () => {
    const directory = process.env.LOCAL_DATA_DIR;

    if (!directory) {
      return;
    }

    const result = buildRegionalComparisonFromDirectory(directory);

    expect(result.territories).toHaveLength(6);
    expect(result.teamType).toBe("eSF");
    expect(result.periods).toEqual(["Q2/25", "Q3/25", "Q1/26"]);

    const saoSebastiao = result.territories.find(
      item => item.name === "São Sebastião",
    );

    const saoPaulo = result.territories.find(
      item => item.name === "Estado de São Paulo",
    );

    const brasil = result.territories.find(
      item => item.name === "Brasil",
    );

    expect(saoSebastiao?.data["Q1/26"].C1.totalTeams).toBe(26);
    expect(saoPaulo?.data["Q1/26"].C1.totalTeams).toBe(7198);
    expect(brasil?.data["Q1/26"].C1.totalTeams).toBe(54968);
  });
});
