import { describe, expect, it } from "vitest";
import { getImportReplacementScope } from "./importReplacement";

describe("import replacement scope", () => {
  it("preserva eSB quando importa somente eSF no quadrimestral de qualidade", () => {
    expect(
      getImportReplacementScope("quadrimestral-qualidade", [
        { teamType: "eSF" },
        { teamType: "eSF" },
      ]),
    ).toEqual({
      mode: "teamTypes",
      teamTypes: ["eSF"],
    });
  });

  it("preserva eSF quando importa somente eSB no quadrimestral de qualidade", () => {
    expect(
      getImportReplacementScope("quadrimestral-qualidade", [
        { teamType: "eSB" },
        { teamType: "eSB" },
      ]),
    ).toEqual({
      mode: "teamTypes",
      teamTypes: ["eSB"],
    });
  });

  it("substitui o período completo quando o arquivo agregado contém eSF e eSB", () => {
    expect(
      getImportReplacementScope("quadrimestral-qualidade", [
        { teamType: "eSF" },
        { teamType: "eSB" },
      ]),
    ).toEqual({
      mode: "period",
    });
  });

  it("mantém a substituição integral para os demais painéis", () => {
    expect(
      getImportReplacementScope("acesso", [
        { teamType: "eSF" },
      ]),
    ).toEqual({
      mode: "period",
    });

    expect(
      getImportReplacementScope("b1", [
        { teamType: "eSB" },
      ]),
    ).toEqual({
      mode: "period",
    });

    expect(
      getImportReplacementScope("territorial", [
        { teamType: "eSF" },
      ]),
    ).toEqual({
      mode: "period",
    });
  });
});
