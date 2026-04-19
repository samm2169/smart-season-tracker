import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMeResponse,
  ListUsersResponse,
  UpdateUserRoleParams,
  UpdateUserRoleBody,
  UpdateUserRoleResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/users/me", async (req: AuthenticatedRequest, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkEmail = (auth as any)?.sessionClaims?.email as string | undefined;
  const clerkName = (auth as any)?.sessionClaims?.fullName as string | undefined;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId,
        email: clerkEmail || `${clerkId}@unknown.com`,
        name: clerkName || null,
        role: "agent",
      })
      .returning();
    user = newUser;
  }

  res.json(GetMeResponse.parse(user));
});

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(users));
});

router.patch("/users/:id/role", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: body.data.role })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserRoleResponse.parse(user));
});

export default router;
