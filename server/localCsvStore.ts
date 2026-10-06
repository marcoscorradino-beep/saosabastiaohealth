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

  return selectLocalCandidates(candidates);
}

export function selectLocalCandidates(candidates: Candidate[]): StoredStore {
  const selected = new Map<string, Candidate>();

  const qualityGroups = new Map<string, Candidate[]>();

  for (const candidate of candidates) {
    if (candidate.panelId === "quadrimestral-qualidade") {
      const key = `${candidate.panelId}|${candidate.competence}`;
      const items = qualityGroups.get(key) ?? [];
      items.push(candidate);
      qualityGroups.set(key, items);
      continue;
    }

    const key = `${candidate.panelId}|${candidate.competence}`;
    const current = selected.get(key);

    if (!current || priority(candidate) > priority(current)) {
      selected.set(key, candidate);
    }
  }

  for (const [groupKey, items] of Array.from(qualityGroups.entries())) {
    const mixed = items
      .filter((item) => {
        const types = new Set(
          item.rows.map((row) => row.teamType).filter(Boolean),
        );
        return types.size > 1;
      })
      .sort((a, b) => priority(b) - priority(a))[0];

    if (mixed) {
      selected.set(groupKey, mixed);
      continue;
    }

    const byTeamType = new Map<string, Candidate>();

    for (const item of items) {
      const types = Array.from(
        new Set(item.rows.map((row) => row.teamType).filter(Boolean)),
      );

      if (types.length !== 1) continue;

      const teamType = types[0];
      const current = byTeamType.get(teamType);

      if (!current || priority(item) > priority(current)) {
        byTeamType.set(teamType, item);
      }
    }

    for (const [teamType, item] of Array.from(byTeamType.entries())) {
      selected.set(`${groupKey}|${teamType}`, item);
    }
  }

  const datasets: StoredStore["datasets"] = {};
  const history: StoredStore["history"] = [];

  const grouped = new Map<string, Candidate[]>();

  for (const item of Array.from(selected.values())) {
    const key = `${item.panelId}|${item.competence}`;
    const items = grouped.get(key) ?? [];
    items.push(item);
    grouped.set(key, items);
  }

  for (const items of Array.from(grouped.values())) {
    const first = items[0];

    const combinedRows =
      first.panelId === "quadrimestral-qualidade" && items.length > 1
        ? items.flatMap((item) => item.rows)
        : first.rows;

    datasets[first.panelId] ??= {};
    datasets[first.panelId][first.competence] = combinedRows;

    for (const item of items) {
      history.push({
        id: `local:${item.panelId}:${item.competence}:${item.filename}`,
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
  }

  history.sort((a, b) => b.importedAt.localeCompare(a.importedAt));

  return { datasets, history };
}
