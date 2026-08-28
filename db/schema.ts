import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  dataJson: text("data_json").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const ttsDailyUsage = sqliteTable("tts_daily_usage", {
  id: text("id").primaryKey(),
  requestCount: integer("request_count").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
