import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { fieldsTable } from "./fields";
import { usersTable } from "./users";

export const updateStageEnum = pgEnum("update_stage", ["planted", "growing", "ready", "harvested"]);

export const fieldUpdatesTable = pgTable("field_updates", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").notNull().references(() => fieldsTable.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").notNull().references(() => usersTable.id),
  stage: updateStageEnum("stage"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFieldUpdateSchema = createInsertSchema(fieldUpdatesTable).omit({ id: true, createdAt: true });
export type InsertFieldUpdate = z.infer<typeof insertFieldUpdateSchema>;
export type FieldUpdate = typeof fieldUpdatesTable.$inferSelect;
