import { describe, expect, it } from "vitest";
import { formatUnitName } from "../client/src/lib/unitName";

describe("formatUnitName", () => {
  it("remove prefixos institucionais usados apenas na apresentação", () => {
    expect(formatUnitName("USF CAMBURI II")).toBe("Camburi II");
    expect(formatUnitName("UBS CENTRO")).toBe("Centro");
    expect(formatUnitName("ESF MARESIAS II")).toBe("Maresias II");
    expect(formatUnitName("ESB BAREQUECABA")).toBe("Barequeçaba");
  });

  it("normaliza nomes municipais conhecidos", () => {
    expect(formatUnitName("BAREQUECABA")).toBe("Barequeçaba");
    expect(formatUnitName("BOICUCANGA II")).toBe("Boiçucanga II");
    expect(formatUnitName("JARAGUA")).toBe("Jaraguá");
    expect(formatUnitName("PAUBA")).toBe("Paúba");
    expect(formatUnitName("SAO FRANCISCO")).toBe("São Francisco");
  });

  it("formata nomes que não precisam de correção especial", () => {
    expect(formatUnitName("MARESIAS II")).toBe("Maresias II");
    expect(formatUnitName("PONTAL DA CRUZ")).toBe("Pontal da Cruz");
    expect(formatUnitName("MORRO DO ABRIGO")).toBe("Morro do Abrigo");
  });

  it("normaliza espaços sem alterar os dados de origem", () => {
    expect(formatUnitName("  USF   CAMBURI II  ")).toBe("Camburi II");
  });
});
