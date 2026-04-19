import { pgTable, text, serial, timestamp, pgEnum, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const fieldStageEnum = pgEnum("field_stage", ["planted", "growing", "ready", "harvested"]);
export const fieldStatusEnum = pgEnum("field_status", ["active", "at_risk", "completed"]);

export const fieldsTable = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cropType: text("crop_type").notNull(),
  plantingDate: timestamp("planting_date", { withTimezone: true }).notNull(),
  currentStage: fieldStageEnum("current_stage").notNull().default("planted"),
  status: fieldStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  assignedAgentId: integer("assigned_agent_id").references(() => usersTable.id),
  location: text("location"),
  areaHectares: doublePrecision("area_hectares"),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFieldSchema = createInsertSchema(fieldsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertField = z.infer<typeof insertFieldSchema>;
export type Field = typeof fieldsTable.$inferSelect;
