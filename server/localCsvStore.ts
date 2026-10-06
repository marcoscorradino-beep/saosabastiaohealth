import fs from "node:fs";
import path from "node:path";
import { parseSiaps } from "./siapsParser";
import type { StoredStore } from "./importStore";

const ALLOWED_PANELS = new Set([
  "acesso",
  "infantil",
  "gestante",
  "diabetes",
  "hipertensao",
  "idosa",
  "cancer",
  "b1",
  "b2",
  "b3",
  "b4",
  "b5",
  "b6",
  "territorial",
  "quadrimestral-cvat",
  "quadrimestral-qualidade",
]);

type Candidate = {
  panelId: string;
  datasetType: string;
  competence: string;
  rows: any[];
  filename: string;
  mtime: number;
};

function priority(item: Candidate) {
  let value = 0;

  if (
    /^relatorio-visao-competencia \((5[8-9]|6[0-9]|70)\)\.csv$/i.test(
      item.filename,
    )
  ) {
    value += 1000;
  }

  if (
    /^relatorio-cvat-visao-competencia \(5\) \(1\)\.csv$/i.test(
      item.filename,
    )
  ) {
    value += 1000;
  }

  if (
    /^Dado_Agregado_Quadrimestre_(Qualidade|Cvat)\.csv$/i.test(
      item.filename,
    )
  ) {
    value += 1000;
  }

  if (item.panelId.startsWith("quadrimestral-")) {
    value += item.rows.length;
  }

  value += item.mtime / 1e13;

  return value;
}

export function readLocalCsvStore(directory: string): StoredStore {
  if (!directory || !fs.existsSync(directory)) {
    throw new Error(
      `Diretório local de CSVs não encontrado: ${directory || "(não configurado)"}`,
    );
  }

  const candidates: Candidate[] = [];

  for (const filename of fs.readdirSync(directory)) {
    if (!filename.toLowerCase().endsWith(".csv")) continue;

    const fullPath = path.join(directory, filename);

    try {
      const content = fs.readFileSync(fullPath, "utf8");
      const parsed = parseSiaps(filename, content);

      if (!ALLOWED_PANELS.has(parsed.panelId)) continue;

      const mtime = fs.statSync(fullPath).mtimeMs;

      for (const period of parsed.periods) {
        candidates.push({
          panelId: parsed.panelId,
          datasetType: parsed.datasetType,
          competence: period.competence,
          rows: period.rows,
          filename,
          mtime,
        });
      }
    } catch {
      // Arquivos não reconhecidos pelo parser SIAPS são ignorados.
    }
  }

  const selected = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const key = `${candidate.panelId}|${candidate.competence}`;
    const current = selected.get(key);

    if (!current || priority(candidate) > priority(current)) {
      selected.set(key, candidate);
    }
  }

  const datasets: StoredStore["datasets"] = {};
  const history: StoredStore["history"] = [];

  for (const item of Array.from(selected.values())) {
    datasets[item.panelId] ??= {};
    datasets[item.panelId][item.competence] = item.rows;

    history.push({
      id: `local:${item.panelId}:${item.competence}`,
      filename: item.filename,
      panelId: item.panelId,
      datasetType: item.datasetType,
      competence: item.competence,
      rows: item.rows.length,
      importedAt: new Date(item.mtime).toISOString(),
      user: "local-csv",
      replaced: false,
    });
  }

  history.sort((a, b) => b.importedAt.localeCompare(a.importedAt));

  return { datasets, history };
}
