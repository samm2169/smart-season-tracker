import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  dbUser?: typeof usersTable.$inferSelect;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    res.status(401).json({ error: "User not found in system. Please wait for account setup." });
    return;
  }

  req.dbUser = user;
  next();
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.dbUser?.role !== "admin") {
      res.status(403).json({ error: "Forbidden: admin access required" });
      return;
    }
    next();
  });
}
