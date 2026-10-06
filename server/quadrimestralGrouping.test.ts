import { describe, expect, it } from "vitest";
import { groupQuadrimestralRows } from "../client/src/lib/quadrimestralGrouping";

const row = (ine: string, teamType: string, indicator: string, value: number) => ({
  ine,
  cnes: "123",
  establishment: `USF ${ine}`,
  name: ine,
  teamType,
  value,
  classification: "BOM",
  indicator,
  finalValue: 7.25,
  finalClassification: "BOM",
});

describe("groupQuadrimestralRows", () => {
  it("agrupa os sete indicadores eSF em uma única equipe", () => {
    const grouped = groupQuadrimestralRows([
      row("0001", "eSF", "Mais Acesso à APS", 48.01),
      row("0001", "eSF", "Cuidado no desenvolvimento infantil", 52.5),
      row("0001", "eSF", "Cuidado na Gestação e Puerpério", 67.86),
      row("0001", "eSF", "Cuidado da pessoa com Diabetes", 67.23),
      row("0001", "eSF", "Cuidado da pessoa com Hipertensão", 76.17),
      row("0001", "eSF", "Cuidado da pessoa idosa", 61.85),
      row("0001", "eSF", "Cuidado da mulher na prevenção do câncer", 49.98),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].indicators).toHaveLength(7);
    expect(grouped[0].indicators.find((indicator) => indicator.key === "c7")?.value).toBe(49.98);
    expect(grouped[0].finalValue).toBe(7.25);
    expect(grouped[0].finalClassification).toBe("BOM");
  });

  it("mantém 26 eSF e 24 eSB como 50 equipes únicas a partir de 326 registros", () => {
    const aps = ["Mais Acesso à APS", "Cuidado no desenvolvimento infantil", "Cuidado na Gestação e Puerpério", "Cuidado da pessoa com Diabetes", "Cuidado da pessoa com Hipertensão", "Cuidado da pessoa idosa", "Cuidado da mulher na prevenção do câncer"];
    const oral = ["Primeira consulta odontológica programada", "Tratamento Odontológico Concluído", "Taxa de exodontias", "Escovação supervisionada", "Procedimentos odontológicos individuais preventivos", "Tratamento Restaurador Atraumático"];
    const rows = [
      ...Array.from({ length: 26 }, (_, index) => aps.map((indicator) => row(`sf-${index}`, "eSF", indicator, 40))).flat(),
      ...Array.from({ length: 24 }, (_, index) => oral.map((indicator) => row(`sb-${index}`, "eSB", indicator, 7.3))).flat(),
    ];
    const grouped = groupQuadrimestralRows(rows);

    expect(rows).toHaveLength(326);
    expect(grouped).toHaveLength(50);
    expect(grouped.filter((team) => team.teamType === "eSF")).toHaveLength(26);
    expect(grouped.filter((team) => team.teamType === "eSB")).toHaveLength(24);
    expect(grouped.every((team) => new Set(team.indicators.map((indicator) => indicator.key)).size === team.indicators.length)).toBe(true);
    expect(new Set(grouped.map((team) => team.ine)).size).toBe(50);
  });

  it("preserva indicadores com valor zero", () => {
    const grouped = groupQuadrimestralRows([row("0002", "eSB", "Escovação supervisionada", 0)]);
    expect(grouped[0].indicators[0].value).toBe(0);
  });
});
