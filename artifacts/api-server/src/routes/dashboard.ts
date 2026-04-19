import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, fieldsTable, fieldUpdatesTable, usersTable } from "@workspace/db";
import {
  GetRecentActivityQueryParams,
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetStageBreakdownResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const user = req.dbUser!;
  const isAdmin = user.role === "admin";

  let allFields = await db.select().from(fieldsTable);

  if (!isAdmin) {
    allFields = allFields.filter((f) => f.assignedAgentId === user.id);
  }

  const totalFields = allFields.length;
  const activeFields = allFields.filter((f) => f.status === "active").length;
  const atRiskFields = allFields.filter((f) => f.status === "at_risk").length;
  const completedFields = allFields.filter((f) => f.status === "completed").length;
  const unassignedFields = allFields.filter((f) => !f.assignedAgentId).length;

  const agentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(eq(usersTable.role, "agent"));

  const recentUpdates = await db
    .select({ count: sql<number>`count(*)` })
    .from(fieldUpdatesTable)
    .where(sql`created_at > now() - interval '7 days'`);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalFields,
      activeFields,
      atRiskFields,
      completedFields,
      totalAgents: Number(agentCount[0]?.count ?? 0),
      unassignedFields,
      recentUpdatesCount: Number(recentUpdates[0]?.count ?? 0),
    })
  );
});

router.get("/dashboard/recent-activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 10;

  const user = req.dbUser!;
  const isAdmin = user.role === "admin";

  const updates = await db
    .select({
      id: fieldUpdatesTable.id,
      fieldId: fieldUpdatesTable.fieldId,
      fieldName: fieldsTable.name,
      agentName: usersTable.name,
      stage: fieldUpdatesTable.stage,
      note: fieldUpdatesTable.note,
      createdAt: fieldUpdatesTable.createdAt,
    })
    .from(fieldUpdatesTable)
    .leftJoin(fieldsTable, eq(fieldUpdatesTable.fieldId, fieldsTable.id))
    .leftJoin(usersTable, eq(fieldUpdatesTable.agentId, usersTable.id))
    .orderBy(desc(fieldUpdatesTable.createdAt))
    .limit(limit);

  let result = updates;

  if (!isAdmin) {
    const agentFieldIds = (
      await db
        .select({ id: fieldsTable.id })
        .from(fieldsTable)
        .where(eq(fieldsTable.assignedAgentId, user.id))
    ).map((f) => f.id);

    result = updates.filter((u) => agentFieldIds.includes(u.fieldId));
  }

  res.json(GetRecentActivityResponse.parse(result));
});

router.get("/dashboard/stage-breakdown", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const user = req.dbUser!;
  const isAdmin = user.role === "admin";

  let fields = await db
    .select({ currentStage: fieldsTable.currentStage, assignedAgentId: fieldsTable.assignedAgentId })
    .from(fieldsTable);

  if (!isAdmin) {
    fields = fields.filter((f) => f.assignedAgentId === user.id);
  }

  const stages = ["planted", "growing", "ready", "harvested"] as const;
  const breakdown = stages.map((stage) => ({
    stage,
    count: fields.filter((f) => f.currentStage === stage).length,
  }));

  res.json(GetStageBreakdownResponse.parse(breakdown));
});

export default router;
