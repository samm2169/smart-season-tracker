import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, fieldsTable, usersTable, fieldUpdatesTable } from "@workspace/db";
import {
  ListFieldsQueryParams,
  ListFieldsResponse,
  CreateFieldBody,
  GetFieldParams,
  GetFieldResponse,
  UpdateFieldParams,
  UpdateFieldBody,
  UpdateFieldResponse,
  DeleteFieldParams,
  AssignFieldParams,
  AssignFieldBody,
  AssignFieldResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { computeStatus } from "../lib/statusLogic";

const router: IRouter = Router();

async function getFieldWithAgent(fieldId: number) {
  const [field] = await db
    .select({
      id: fieldsTable.id,
      name: fieldsTable.name,
      cropType: fieldsTable.cropType,
      plantingDate: fieldsTable.plantingDate,
      currentStage: fieldsTable.currentStage,
      status: fieldsTable.status,
      notes: fieldsTable.notes,
      assignedAgentId: fieldsTable.assignedAgentId,
      location: fieldsTable.location,
      areaHectares: fieldsTable.areaHectares,
      lastUpdatedAt: fieldsTable.lastUpdatedAt,
      createdAt: fieldsTable.createdAt,
      agentId: usersTable.id,
      agentName: usersTable.name,
      agentEmail: usersTable.email,
    })
    .from(fieldsTable)
    .leftJoin(usersTable, eq(fieldsTable.assignedAgentId, usersTable.id))
    .where(eq(fieldsTable.id, fieldId));

  if (!field) return null;

  return {
    ...field,
    assignedAgent: field.agentId
      ? { id: field.agentId, name: field.agentName, email: field.agentEmail }
      : null,
  };
}

router.get("/fields", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const query = ListFieldsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const user = req.dbUser!;
  const isAdmin = user.role === "admin";

  const allFields = await db
    .select({
      id: fieldsTable.id,
      name: fieldsTable.name,
      cropType: fieldsTable.cropType,
      plantingDate: fieldsTable.plantingDate,
      currentStage: fieldsTable.currentStage,
      status: fieldsTable.status,
      notes: fieldsTable.notes,
      assignedAgentId: fieldsTable.assignedAgentId,
      location: fieldsTable.location,
      areaHectares: fieldsTable.areaHectares,
      lastUpdatedAt: fieldsTable.lastUpdatedAt,
      createdAt: fieldsTable.createdAt,
      agentId: usersTable.id,
      agentName: usersTable.name,
      agentEmail: usersTable.email,
    })
    .from(fieldsTable)
    .leftJoin(usersTable, eq(fieldsTable.assignedAgentId, usersTable.id))
    .orderBy(fieldsTable.createdAt);

  let fields = allFields;

  if (!isAdmin) {
    fields = allFields.filter((f) => f.assignedAgentId === user.id);
  }

  if (query.data.agentId) {
    fields = fields.filter((f) => f.assignedAgentId === query.data.agentId);
  }

  if (query.data.stage) {
    fields = fields.filter((f) => f.currentStage === query.data.stage);
  }

  if (query.data.status) {
    fields = fields.filter((f) => f.status === query.data.status);
  }

  const result = fields.map((f) => ({
    ...f,
    assignedAgent: f.agentId
      ? { id: f.agentId, name: f.agentName, email: f.agentEmail }
      : null,
  }));

  res.json(ListFieldsResponse.parse(result));
});

router.post("/fields", requireAdmin, async (req, res): Promise<void> => {
  const body = CreateFieldBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { assignedAgentId, ...rest } = body.data;
  const plantingDate = new Date(rest.plantingDate as unknown as string);
  const status = computeStatus(rest.currentStage, plantingDate, null);

  const [field] = await db
    .insert(fieldsTable)
    .values({
      ...rest,
      plantingDate,
      status,
      assignedAgentId: assignedAgentId ?? null,
    })
    .returning();

  const fieldWithAgent = await getFieldWithAgent(field.id);
  res.status(201).json(GetFieldResponse.parse(fieldWithAgent));
});

router.get("/fields/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetFieldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const field = await getFieldWithAgent(params.data.id);

  if (!field) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  const user = req.dbUser!;
  if (user.role !== "admin" && field.assignedAgentId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(GetFieldResponse.parse(field));
});

router.patch("/fields/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateFieldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateFieldBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const existing = await getFieldWithAgent(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.plantingDate) {
    updateData.plantingDate = new Date(body.data.plantingDate as unknown as string);
  }

  const stage = (body.data.currentStage || existing.currentStage) as "planted" | "growing" | "ready" | "harvested";
  const plantingDate = updateData.plantingDate instanceof Date ? updateData.plantingDate : existing.plantingDate;
  updateData.status = computeStatus(stage, plantingDate, existing.lastUpdatedAt);

  const [updated] = await db
    .update(fieldsTable)
    .set(updateData as Parameters<typeof db.update>[0] extends infer T ? any : any)
    .where(eq(fieldsTable.id, params.data.id))
    .returning();

  const fieldWithAgent = await getFieldWithAgent(updated.id);
  res.json(UpdateFieldResponse.parse(fieldWithAgent));
});

router.delete("/fields/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteFieldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(fieldsTable)
    .where(eq(fieldsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/fields/:id/assign", requireAdmin, async (req, res): Promise<void> => {
  const params = AssignFieldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AssignFieldBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(fieldsTable)
    .set({ assignedAgentId: body.data.assignedAgentId ?? null })
    .where(eq(fieldsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  const fieldWithAgent = await getFieldWithAgent(updated.id);
  res.json(AssignFieldResponse.parse(fieldWithAgent));
});

export default router;
