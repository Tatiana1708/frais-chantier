import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";
import { authMiddleware, requireAuth, AuthEnv } from "../middleware/auth";

const assignSchema = z.object({ chantierIds: z.array(z.number()) });

export const chantiers = new Hono<AuthEnv>()
  // Public: used to populate the worksite picker during sign-up, before a session exists.
  .get("/", async (c) => {
    const rows = await db
      .select({ id: schema.chantiers.id, code: schema.chantiers.code, name: schema.chantiers.name })
      .from(schema.chantiers)
      .where(eq(schema.chantiers.isActive, true));
    return c.json({ chantiers: rows }, 200);
  })
  .use("/me/*", authMiddleware, requireAuth)
  .get("/me/assigned", async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select({ id: schema.chantiers.id, code: schema.chantiers.code, name: schema.chantiers.name })
      .from(schema.userChantiers)
      .innerJoin(schema.chantiers, eq(schema.chantiers.id, schema.userChantiers.chantierId))
      .where(eq(schema.userChantiers.userId, user.id));
    return c.json({ chantiers: rows }, 200);
  })
  .post("/me/assigned", zValidator("json", assignSchema), async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");
    await db.delete(schema.userChantiers).where(eq(schema.userChantiers.userId, user.id));
    if (body.chantierIds?.length) {
      await db.insert(schema.userChantiers).values(
        body.chantierIds.map((chantierId) => ({ userId: user.id, chantierId }))
      );
    }
    return c.json({ ok: true }, 200);
  });
