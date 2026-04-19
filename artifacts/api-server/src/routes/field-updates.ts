import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fieldsTable, fieldUpdatesTable, usersTable } from "@workspace/db";
import {
  ListFieldUpdatesParams,
  ListFieldUpdatesResponse,
  CreateFieldUpdateParams,
  CreateFieldUpdateBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { computeStatus } from "../lib/statusLogic";

const router: IRouter = Router();

router.get("/fields/:id/updates", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ListFieldUpdatesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const updates = await db
    .select({
      id: fieldUpdatesTable.id,
      fieldId: fieldUpdatesTable.fieldId,
      agentId: fieldUpdatesTable.agentId,
      stage: fieldUpdatesTable.stage,
      note: fieldUpdatesTable.note,
      createdAt: fieldUpdatesTable.createdAt,
      agentName: usersTable.name,
    })
    .from(fieldUpdatesTable)
    .leftJoin(usersTable, eq(fieldUpdatesTable.agentId, usersTable.id))
    .where(eq(fieldUpdatesTable.fieldId, params.data.id))
    .orderBy(fieldUpdatesTable.createdAt);

  res.json(ListFieldUpdatesResponse.parse(updates));
});

router.post("/fields/:id/updates", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = CreateFieldUpdateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreateFieldUpdateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const user = req.dbUser!;

  const [field] = await db.select().from(fieldsTable).where(eq(fieldsTable.id, params.data.id));

  if (!field) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  if (user.role !== "admin" && field.assignedAgentId !== user.id) {
    res.status(403).json({ error: "Forbidden: you are not assigned to this field" });
    return;
  }

  const now = new Date();

  const [update] = await db
    .insert(fieldUpdatesTable)
    .values({
      fieldId: params.data.id,
      agentId: user.id,
      stage: body.data.stage ?? null,
      note: body.data.note ?? null,
    })
    .returning();

  if (body.data.stage && body.data.stage !== field.currentStage) {
    const newStatus = computeStatus(body.data.stage, field.plantingDate, now);
    await db
      .update(fieldsTable)
      .set({ currentStage: body.data.stage, lastUpdatedAt: now, status: newStatus })
      .where(eq(fieldsTable.id, params.data.id));
  } else {
    await db
      .update(fieldsTable)
      .set({ lastUpdatedAt: now })
      .where(eq(fieldsTable.id, params.data.id));
  }

  const [agent] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));

  res.status(201).json({
    ...update,
    agentName: agent?.name ?? null,
  });
});

export default router;
