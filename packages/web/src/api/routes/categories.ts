import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";
import { authMiddleware, requireAuth, AuthEnv } from "../middleware/auth";

export const categories = new Hono<AuthEnv>()
  .use("*", authMiddleware, requireAuth)
  .get("/", async (c) => {
    const rows = await db
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(eq(schema.categories.isActive, true));
    return c.json({ categories: rows }, 200);
  });
