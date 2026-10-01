import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { detectPanel, parseSiaps } from "./index";
import { compareMonthlyCompetences, parseMonthlyCompetence } from "@shared/competence";
import { classifyApsValue } from "@shared/apsMethodology";

function realOralCsv(fileNumber:number){return fs.readFileSync(new URL(`./fixtures/relatorio-visao-competencia (${fileNumber}).csv`, import.meta.url), "utf8")}

describe("SIAPS importer", () => {
  it("accepts every month of any two-digit year without hardcoded years", () => {
    const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    for (const year of ["25", "26", "27", "30"]) {
      for (const month of months) expect(parseMonthlyCompetence(`${month}/${year}`)).toBe(`${month}/${year}`);
    }
    expect(parseMonthlyCompetence("JAX/26")).toBeNull();
  });

  it("prioritizes Competência selecionada and keeps panel detection independent", () => {
    const csv = (competence: string) => [
      "Indicador: Tratamento Odontológico Concluído",
      `Competência selecionada: ${competence}`,
      "CNES;Estabelecimento;INE;Tipo de Equipe;NOME DA EQUIPE;Competência/Ano;RAZÃO ENTRE O NUMERADOR E DENOMINADOR;Classificação",
      `1234567;UBS Centro;INE-01;eSB;Equipe Centro;${competence};64,10;`,
    ].join("\n");
    for (const competence of ["JAN/25", "DEZ/25", "JAN/26", "JUL/26", "DEZ/26", "JAN/27", "DEZ/27", "JAN/30"]) {
      const parsed = parseSiaps("relatorio.csv", csv(competence));
      expect(parsed.panelId).toBe("b2");
      expect(parsed.periods[0]?.competence).toBe(competence);
    }
  });

  it("orders monthly competencies chronologically across years", () => {
    expect(["JAN/26", "DEZ/25", "JAN/30", "NOV/25", "DEZ/26"].sort(compareMonthlyCompetences)).toEqual(["NOV/25", "DEZ/25", "JAN/26", "DEZ/26", "JAN/30"]);
  });

	  it.each([
	    ["Mais Acesso à APS", "acesso", "APS acesso"],
	    ["Cuidado no desenvolvimento infantil", "infantil", "APS infantil"],
	    ["Cuidado na Gestação e Puerpério", "gestante", "APS gestante"],
	    ["Cuidado da pessoa com Diabetes", "diabetes", "APS diabetes"],
	    ["Cuidado da pessoa com Hipertensão", "hipertensao", "APS hipertensao"],
	    ["Cuidado da pessoa idosa", "idosa", "APS idosa"],
	    ["Cuidado da mulher na prevenção do câncer", "cancer", "APS cancer"],
	  ] as const)("detects C1–C7 by Indicator: %s even with a generic filename", (indicator, panelId, datasetType) => {
    const csv = [
      `Indicador: ${indicator}`,
      "Competência selecionada: JUL/26",
      "CNES;Estabelecimento;INE;Tipo de Equipe;NOME DA EQUIPE;Competência/Ano;Métrica;RAZÃO ENTRE O NUMERADOR E DENOMINADOR;Classificação",
      "1234567;UBS Centro;INE-01;eSF;Equipe Centro;JUL/26;1;87,5;BOM",
    ].join("\n");
	    expect(detectPanel("relatorio-visao-competencia.csv", csv)).toBe(panelId);
	    const parsed = parseSiaps("relatorio-visao-competencia.csv", csv);
	    expect(parsed.datasetType).toBe(datasetType);
	    expect(parsed.panelId).toBe(panelId);
	    expect(parsed.periods[0]?.competence).toBe("JUL/26");
  });

  it("applies the non-monotonic C1 methodological bands", () => {
    for (const [value, expected] of [[10, "REGULAR"], [10.01, "SUFICIENTE"], [30, "SUFICIENTE"], [30.01, "BOM"], [50, "BOM"], [50.01, "ÓTIMO"], [70, "ÓTIMO"], [70.01, "REGULAR"]] as const) {
      expect(classifyApsValue("acesso", value)).toBe(expected);
    }
  });

  it.each(["infantil", "gestante", "diabetes", "hipertensao", "idosa", "cancer"] as const)("applies the C2–C7 methodological bands for %s", (panelId) => {
    for (const [value, expected] of [[25, "REGULAR"], [25.01, "SUFICIENTE"], [50, "SUFICIENTE"], [50.01, "BOM"], [75, "BOM"], [75.01, "ÓTIMO"], [100, "ÓTIMO"]] as const) {
      expect(classifyApsValue(panelId, value)).toBe(expected);
    }
  });

  it("derives C6 classification while preserving the SIAPS value", () => {
    const csv = [
      "Indicador: Cuidado da pessoa idosa",
      "Competência selecionada: JUL/26",
      "CNES;Estabelecimento;INE;Tipo de Equipe;NOME DA EQUIPE;Competência/Ano;RAZÃO ENTRE O NUMERADOR E DENOMINADOR",
      "1234567;UBS Centro;INE-01;eSF;Equipe Centro;JUL/26;57,41",
    ].join("\n");
    expect(parseSiaps("relatorio-visao-competencia.csv", csv).periods[0]?.rows[0]).toMatchObject({ value: 57.41, classification: "BOM" });
  });

  it("preserves standard team identity and metric fields", () => {
    const csv = [
      "Competência selecionada: JUN/26",
      "CNES;Estabelecimento;INE;Tipo de Equipe;NOME DA EQUIPE;Competência/Ano;RAZÃO ENTRE O NUMERADOR E DENOMINADOR;Classificação;Métrica extra",
      "1234567;UBS Centro;INE-01;eSF;Equipe Centro;JUN/26;87,5;A;9",
    ].join("\n");
    const parsed = parseSiaps("Mais_Acesso.csv", csv);
    expect(parsed.panelId).toBe("acesso");
    expect(parsed.periods).toHaveLength(1);
    expect(parsed.periods[0]?.competence).toBe("JUN/26");
    expect(parsed.periods[0]?.rows[0]).toMatchObject({
      cnes: "1234567",
      establishment: "UBS Centro",
      ine: "INE-01",
      teamType: "eSF",
      name: "Equipe Centro",
      value: 87.5,
      classification: "REGULAR",
    });
  });

  it("maps the real C1 aggregated export with compact data rows", () => {
    const csv = [
      "Competência selecionada: JUN/26",
      "Competência/Ano;UF;IBGE Município;Nome Município;Condição de Equipe;CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;Ter atendimentos por demanda programada (consulta agendada programada;Número total de atendimentos por demanda programada;Número total de atendimentos por todos os tipos de demandas (espontâneas e programadas);RAZÃO ENTRE O NUMERADOR E DENOMINADOR;Classificação",
      '"JUN/26\t";"SP\t";"355070\t";"SÃO SEBASTIÃO\t";"Válida\t";"2765799\t";"USF ITATINGA I\t";"02\t";"0000369942\t";"ITATINGA I\t";"eSF\t";"169\t";"557\t";"30,34\t";"BOM\t"',
    ].join("\n");
    const parsed = parseSiaps("Dado_Agregado_Mais_Acesso_a_APS.csv", csv);
    expect(parsed.periods[0]?.rows[0]).toMatchObject({
      ine: "0000369942",
      cnes: "2765799",
      establishment: "USF ITATINGA I",
      name: "ITATINGA I",
      teamType: "eSF",
      value: 30.34,
      classification: "BOM",
    });
    expect(parsed.periods[0]?.rows[0]?.metrics).toEqual([
      { label: "Ter atendimentos por demanda programada (consulta agendada programada", value: 169 },
      { label: "Número total de atendimentos por demanda programada", value: 557 },
      { label: "Número total de atendimentos por todos os tipos de demandas (espontâneas e programadas)", value: 30.34 },
    ]);
  });

	  it.each([
    ["B1", 58, "b1", 4.49],
    ["B2", 59, "b2", 64.10],
    ["B3", 60, "b3", 1.63],
    ["B4", 61, "b4", 0],
    ["B5", 62, "b5", 9.47],
    ["B6", 63, "b6", 22.22],
	  ] as const)("maps real %s JUL/26 export without inventing classification", (_label, fileNumber, panelId, expectedValue) => {
    const filename = `relatorio-visao-competencia (${fileNumber}).csv`;
    const content = realOralCsv(fileNumber);
    const parsed = parseSiaps(filename, content);
    const row = parsed.periods[0]?.rows.find(item => item.name === "ESB BARRA DO UNA");
    expect(detectPanel(filename, content)).toBe(panelId);
	    expect(parsed.panelId).toBe(panelId);
	    expect(parsed.datasetType).toBe(`Saúde Bucal ${_label}`);
    expect(parsed.periods[0]?.competence).toBe("JUL/26");
    expect(parsed.periods[0]?.rows).toHaveLength(24);
    expect(row).toMatchObject({ value: expectedValue, classification: "", teamType: "eSB", ine: "0001839357" });
  });

  it("never classifies a Visão Geral quality report as B4", () => {
    const content = [
      "Visão Geral - Componente Qualidade",
      "Indicador: Escovação supervisionada",
      "Competência selecionada: JUL/26",
      "CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;Resultado",
      "1;UBS;UBS;INE;Equipe;eSB;0",
    ].join("\n");
    expect(detectPanel("Visão Geral - Componente Qualidade.csv", content)).toBeNull();
    expect(() => parseSiaps("Visão Geral - Componente Qualidade.csv", content)).toThrow("Tipo de relatório não reconhecido");
  });


  it("maps the real CVAT competence layout and preserves population-limit evidence", () => {
    const csv = [
      "Relatório CVAT - Visão por Competência",
      "Competência selecionada: JUL/26",
      "CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;PARÂMETRO POPULACIONAL;PESSOAS SOMENTE COM CADASTRO INDIVIDUAL;PESSOAS COM CADASTRO INDIVIDUAL E CADASTRO DOMICILIAR E TERRITORIAL;TOTAL DE PESSOAS COM CADASTRO (C = A + B);PESSOAS SEM CRITÉRIO;CRIANÇAS + PESSOAS IDOSAS;PESSOAS BENEFICIARIAS DO BPC OU PBF;PESSOAS IDOSAS OU CRIANÇAS + BPC OU PBF;TOTAL DE PESSOAS ACOMPANHADAS;ATENDIMENTOS SUJEITOS À AVALIAÇÃO DE SATISFAÇÃO;ATENDIMENTOS COM AVALIAÇÃO DE SATISFAÇÃO ;N DE PESSOAS VINCULADAS A EQUIPE;PONTUAÇÃO",
      "2766132;USF BARRA DO SAI;CENTRO DE SAUDE/UNIDADE BASICA;0000370029;BARRA DO SAI;eSF;2750;178;3958;4136;1979;493;704;106;3282;2743;-;3282;10,00",
      "3425274;USF CANTO DO MAR;CENTRO DE SAUDE/UNIDADE BASICA;0000370037;CANTO DO MAR;eSF;2750;104;4593;4697;2007;729;717;153;3606;2384;-;3606;10,00",
      "4037669;USF PAUBA;CENTRO DE SAUDE/UNIDADE BASICA;0002295253;PAUBA;eSF;2750;4;1383;1387;549;189;152;28;918;872;-;918;4,00",
    ].join("\n");
    expect(detectPanel("relatorio-cvat-visao-competencia.csv", csv)).toBe("territorial");
    const parsed = parseSiaps("relatorio-cvat-visao-competencia.csv", csv);
    expect(parsed.datasetType).toBe("Vínculo e Acompanhamento Territorial — visão por competência");
    expect(parsed.periods[0]?.competence).toBe("JUL/26");
    expect(parsed.periods[0]?.rows).toHaveLength(3);
    const barra = parsed.periods[0]?.rows.find(row => row.name === "BARRA DO SAI");
    expect(barra).toMatchObject({ ine: "0000370029", cnes: "2766132", teamType: "eSF", value: 10, classification: "" });
    expect(barra?.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Parâmetro populacional", value: 2750 }),
      expect.objectContaining({ label: "Pessoas vinculadas", value: 3282 }),
    ]));
    const pauba = parsed.periods[0]?.rows.find(row => row.name === "PAUBA");
    expect(pauba).toMatchObject({ value: 4 });
    expect(pauba?.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Parâmetro populacional", value: 2750 }),
      expect.objectContaining({ label: "Pessoas vinculadas", value: 918 }),
    ]));
  });

  it("splits Q1, Q2 and Q3 from one quadrimestral CSV and keeps dimensions", () => {
    const csv = [
      "Quadrimestre;CNES;Estabelecimento;INE;Tipo de Equipe;Nome da Equipe;Dimensão;Indicador;Resultado do Quadrimestre Média dos meses;Dimensão Cadastro;Dimensão Acompanhamento;Nota Final;Classificação Final",
      "Q2/25;1234567;UBS Centro;INE-01;eSF;Equipe Centro;Cadastro;Indicador A;8,5;9;8;8,5;B",
      "Q1/25;1234567;UBS Centro;INE-01;eSF;Equipe Centro;Cadastro;Indicador A;7,5;8;7;7,5;C",
      "Q3/25;1234567;UBS Centro;INE-01;eSF;Equipe Centro;Cadastro;Indicador A;9,5;10;9;9,5;A",
    ].join("\n");
    const parsed = parseSiaps("Desempenho Quadrimestral - Componente Qualidade.csv", csv);
    expect(parsed.panelId).toBe("quadrimestral-qualidade");
    expect(parsed.periods.map(period => period.competence)).toEqual(["Q1/25", "Q2/25", "Q3/25"]);
    expect(parsed.periods.map(period => period.rows.length)).toEqual([1, 1, 1]);
    expect(parsed.periods[0]?.rows[0]).toMatchObject({
      establishment: "UBS Centro",
      ine: "INE-01",
      dimension: "Cadastro",
      indicator: "Indicador A",
      finalValue: 7.5,
      finalClassification: "C",
    });
  });
});
