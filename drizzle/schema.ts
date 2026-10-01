import { boolean, double, index, int, longtext, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const healthDatasetRows = mysqlTable("health_dataset_rows", {
  id: int("id").autoincrement().primaryKey(),
  panelId: varchar("panelId", { length: 64 }).notNull(),
  competence: varchar("competence", { length: 32 }).notNull(),
  rowKey: varchar("rowKey", { length: 160 }).notNull(),
  ine: varchar("ine", { length: 64 }).notNull(),
  cnes: varchar("cnes", { length: 64 }).notNull(),
  establishment: text("establishment").notNull(),
  name: text("name").notNull(),
  teamType: varchar("teamType", { length: 255 }).notNull(),
  value: double("value"),
  classification: text("classification").notNull(),
  practicesJson: longtext("practicesJson").notNull(),
  metricsJson: longtext("metricsJson"),
  dimension: text("dimension"),
  indicator: text("indicator"),
  finalValue: double("finalValue"),
  finalClassification: text("finalClassification"),
  rowJson: longtext("rowJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  panelCompetenceRow: uniqueIndex("health_dataset_rows_panel_competence_row").on(table.panelId, table.competence, table.rowKey),
  panelCompetence: index("health_dataset_rows_panel_competence").on(table.panelId, table.competence),
}));

export const importHistory = mysqlTable("import_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: text("filename").notNull(),
  adminUser: varchar("adminUser", { length: 255 }).notNull(),
  importedAt: timestamp("importedAt").notNull(),
  panelId: varchar("panelId", { length: 64 }).notNull(),
  datasetType: text("datasetType").notNull(),
  competence: varchar("competence", { length: 32 }).notNull(),
  rows: int("rows").notNull(),
  replaced: boolean("replaced").notNull().default(false),
}, table => ({
  importedAtIndex: index("import_history_imported_at").on(table.importedAt),
  panelCompetenceIndex: index("import_history_panel_competence").on(table.panelId, table.competence),
}));

export type HealthDatasetRow = typeof healthDatasetRows.$inferSelect;
export type ImportHistory = typeof importHistory.$inferSelect;
