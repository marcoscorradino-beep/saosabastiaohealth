import fs from "node:fs";
import path from "node:path";
import {
  aggregateRegionalComparison,
  parseRegionalComparisonCsv,
  type RegionalIndicatorCode,
  type RegionalComparisonRow,
} from "./regionalComparison";

export const REGIONAL_PERIODS = ["Q2/25", "Q3/25", "Q1/26"] as const;

export const REGIONAL_INDICATORS: RegionalIndicatorCode[] = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
];

const TERRITORIES = [
  "São Sebastião",
  "Caraguatatuba",
  "Ilhabela",
  "Ubatuba",
  "Estado de São Paulo",
  "Brasil",
] as const;

type TerritoryName = (typeof TERRITORIES)[number];

type SourceFile = {
  filename: string;
  rows: RegionalComparisonRow[];
};

function findComparisonFiles(directory: string): SourceFile[] {
  if (!directory || !fs.existsSync(directory)) {
    throw new Error(
      `Diretório local de CSVs não encontrado: ${directory || "(não configurado)"}`,
    );
  }

  const files: SourceFile[] = [];

  for (const filename of fs.readdirSync(directory)) {
    if (!filename.toLowerCase().endsWith(".csv")) continue;

    const fullPath = path.join(directory, filename);

    try {
      const content = fs.readFileSync(fullPath, "utf8");

      if (
        !content.includes(
          "Relatorio Publico - Qualidade – Conceito obtido por indicador",
        )
      ) {
        continue;
      }

      const rows = parseRegionalComparisonCsv(content);

      if (rows.length > 0) {
        files.push({ filename, rows });
      }
    } catch {
      // CSVs de outros relatórios são ignorados.
    }
  }

  return files;
}

function municipalityCount(file: SourceFile): number {
  return new Set(file.rows.map(row => row.municipality)).size;
}

function selectMunicipalitySource(
  files: SourceFile[],
  municipality: string,
  preferSingleMunicipality = false,
): RegionalComparisonRow[] {
  const candidates = files
    .filter(file =>
      file.rows.some(row => row.municipality === municipality),
    )
    .sort((a, b) => {
      const aCount = municipalityCount(a);
      const bCount = municipalityCount(b);

      if (preferSingleMunicipality) {
        const aSingle = aCount === 1 ? 1 : 0;
        const bSingle = bCount === 1 ? 1 : 0;

        if (aSingle !== bSingle) return bSingle - aSingle;
      }

      return aCount - bCount;
    });

  const source = candidates[0];

  if (!source) return [];

  return source.rows.filter(
    row => row.municipality === municipality,
  );
}

function selectLargestSource(files: SourceFile[]): RegionalComparisonRow[] {
  return [...files].sort((a, b) => b.rows.length - a.rows.length)[0]?.rows ?? [];
}

export function buildRegionalComparisonFromDirectory(directory: string) {
  const files = findComparisonFiles(directory);

  if (files.length === 0) {
    throw new Error(
      "Nenhum relatório SIAPS de conceito por indicador foi encontrado.",
    );
  }

  const saoSebastiao = selectMunicipalitySource(
    files,
    "SÃO SEBASTIÃO",
    true,
  );

  const caraguatatuba = selectMunicipalitySource(
    files,
    "CARAGUATATUBA",
  );

  const ilhabela = selectMunicipalitySource(
    files,
    "ILHABELA",
  );

  const ubatuba = selectMunicipalitySource(
    files,
    "UBATUBA",
  );

  /*
   * Os arquivos estadual e nacional possuem muitas linhas.
   * Identificamos as fontes pelo universo geográfico:
   * - Brasil: maior quantidade de UFs distintas.
   * - SP: arquivo amplo contendo somente UF=SP.
   */
  const broadFiles = files.filter(file => {
    const municipalities = new Set(file.rows.map(row => row.municipality));
    return municipalities.size > 100;
  });

  const brazilCandidates = broadFiles.filter(file => {
    const ufs = new Set(file.rows.map(row => row.uf));
    return ufs.size > 1;
  });

  const spCandidates = broadFiles.filter(file => {
    const ufs = new Set(file.rows.map(row => row.uf));
    return ufs.size === 1 && ufs.has("SP");
  });

  const brasil = selectLargestSource(brazilCandidates);
  const saoPaulo = selectLargestSource(spCandidates);

  const territoryRows: Record<TerritoryName, RegionalComparisonRow[]> = {
    "São Sebastião": saoSebastiao,
    Caraguatatuba: caraguatatuba,
    Ilhabela: ilhabela,
    Ubatuba: ubatuba,
    "Estado de São Paulo": saoPaulo,
    Brasil: brasil,
  };

  return {
    source: "SIAPS - Ministério da Saúde",
    preliminary: true,
    teamType: "eSF",
    periods: [...REGIONAL_PERIODS],
    indicators: [...REGIONAL_INDICATORS],
    territories: TERRITORIES.map(name => ({
      name,
      data: Object.fromEntries(
        REGIONAL_PERIODS.map(period => [
          period,
          Object.fromEntries(
            REGIONAL_INDICATORS.map(indicator => [
              indicator,
              aggregateRegionalComparison(
                territoryRows[name],
                period,
                indicator,
              ),
            ]),
          ),
        ]),
      ),
    })),
  };
}
