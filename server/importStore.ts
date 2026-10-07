import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { healthDatasetRows, importHistory } from "../drizzle/schema";
import { classifyApsValue } from "@shared/apsMethodology";
import { getImportReplacementScope } from "./importReplacement";

export type StoredMetric = {
  label: string;
  value: number | null;
  text?: string;
};

export type StoredRow = {
  ine: string;
  cnes: string;
  establishment: string;
  name: string;
  teamType: string;
  value: number | null;
  classification: string;
  practices: { label: string; value: number | null }[];
  metrics?: StoredMetric[];
  dimension?: string;
  indicator?: string;
  finalValue?: number | null;
  finalClassification?: string;
};

export type StoredHistory = {
  id: string;
  filename: string;
  panelId: string;
  datasetType: string;
  competence: string;
  rows: number;
  importedAt: string;
  user: string;
  replaced: boolean;
};

export type StoredStore = {
  datasets: Record<string, Record<string, StoredRow[]>>;
  history: StoredHistory[];
};

type ImportPeriod = { competence: string; rows: StoredRow[] };

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Banco persistente indisponível: DATABASE_URL não configurada.");
  return db;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function readStore(): Promise<StoredStore> {
  const db = await requireDb();
  const [rowRecords, historyRecords] = await Promise.all([
    db.select().from(healthDatasetRows),
    db.select().from(importHistory).orderBy(desc(importHistory.importedAt)),
  ]);
  const datasets: StoredStore["datasets"] = {};
  for (const record of rowRecords) {
    datasets[record.panelId] ??= {};
    datasets[record.panelId][record.competence] ??= [];
    datasets[record.panelId][record.competence].push({
      ine: record.ine,
      cnes: record.cnes,
      establishment: record.establishment,
      name: record.name,
      teamType: record.teamType,
      value: record.value,
      classification: classifyApsValue(record.panelId, record.value) || record.classification,
      practices: parseJson(record.practicesJson, []),
      metrics: parseJson(record.metricsJson, undefined),
      dimension: record.dimension ?? undefined,
      indicator: record.indicator ?? undefined,
      finalValue: record.finalValue,
      finalClassification: record.finalClassification ?? undefined,
    });
  }
  return {
    datasets,
    history: historyRecords.map(record => ({
      id: record.id,
      filename: record.filename,
      panelId: record.panelId,
      datasetType: record.datasetType,
      competence: record.competence,
      rows: record.rows,
      importedAt: record.importedAt.toISOString(),
      user: record.adminUser,
      replaced: Boolean(record.replaced),
    })),
  };
}

export async function saveImport(params: {
  filename: string;
  panelId: string;
  datasetType: string;
  periods: ImportPeriod[];
  user: string;
  replacedPeriods: Set<string>;
}) {
  const db = await requireDb();
  await db.transaction(async tx => {
    for (const period of params.periods) {
      const replacementScope = getImportReplacementScope(
        params.panelId,
        period.rows,
      );

      const replacementConditions = [
        eq(healthDatasetRows.panelId, params.panelId),
        eq(healthDatasetRows.competence, period.competence),
      ];

      if (replacementScope.mode === "teamTypes") {
        replacementConditions.push(
          inArray(healthDatasetRows.teamType, replacementScope.teamTypes),
        );
      }

      await tx.delete(healthDatasetRows).where(
        and(...replacementConditions),
      );
      if (period.rows.length) {
        await tx.insert(healthDatasetRows).values(
          period.rows.map((row, index) => ({
            panelId: params.panelId,
            competence: period.competence,
            rowKey: `${row.ine}:${index}`,
            ine: row.ine,
            cnes: row.cnes,
            establishment: row.establishment,
            name: row.name,
            teamType: row.teamType,
            value: row.value,
            classification: row.classification,
            practicesJson: JSON.stringify(row.practices ?? []),
            metricsJson: row.metrics ? JSON.stringify(row.metrics) : null,
            dimension: row.dimension ?? null,
            indicator: row.indicator ?? null,
            finalValue: row.finalValue ?? null,
            finalClassification: row.finalClassification ?? null,
            rowJson: JSON.stringify(row),
          })),
        );
      }
      await tx.insert(importHistory).values({
        id: crypto.randomUUID(),
        filename: params.filename,
        adminUser: params.user,
        importedAt: new Date(),
        panelId: params.panelId,
        datasetType: params.datasetType,
        competence: period.competence,
        rows: period.rows.length,
        replaced: params.replacedPeriods.has(period.competence),
      });
    }
  });
}
