import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";
import { authMiddleware, requireAuth, AuthEnv } from "../middleware/auth";

const createSchema = z.object({
  clientUuid: z.string(),
  chantierId: z.number(),
  categoryId: z.number(),
  date: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  paymentMode: z.string(),
  receiptKey: z.string().optional(),
});

const patchSchema = z.object({
  chantierId: z.number().optional(),
  categoryId: z.number().optional(),
  date: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  paymentMode: z.string().optional(),
  receiptKey: z.string().optional(),
});

const rejectSchema = z.object({ comment: z.string().optional() });

export const expenses = new Hono<AuthEnv>()
  .use("*", authMiddleware, requireAuth)

  // Create or idempotently re-sync an expense (clientUuid is generated on-device).
  .post("/", zValidator("json", createSchema), async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    const existing = await db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.clientUuid, body.clientUuid));
    if (existing.length) {
      return c.json({ expense: existing[0], duplicate: false }, 200);
    }

    // Simple duplicate signal: same user, chantier, category, date and amount already exists.
    const possibleDup = await db
      .select({ id: schema.expenses.id })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.userId, user.id),
          eq(schema.expenses.chantierId, body.chantierId),
          eq(schema.expenses.categoryId, body.categoryId),
          eq(schema.expenses.date, body.date),
          eq(schema.expenses.amount, body.amount)
        )
      );

    const [expense] = await db
      .insert(schema.expenses)
      .values({
        clientUuid: body.clientUuid,
        userId: user.id,
        chantierId: body.chantierId,
        categoryId: body.categoryId,
        date: body.date,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        paymentMode: body.paymentMode,
        receiptKey: body.receiptKey,
        status: "submitted",
      })
      .returning();

    await db.insert(schema.approvalLogs).values({
      expenseId: expense.id,
      actorId: user.id,
      action: "submitted",
    });

    return c.json({ expense, duplicate: possibleDup.length > 0 }, 201);
  })

  // List the current user's own expenses (with chantier/category names for offline display).
  .get("/mine", async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select({
        expense: schema.expenses,
        chantierName: schema.chantiers.name,
        categoryName: schema.categories.name,
      })
      .from(schema.expenses)
      .innerJoin(schema.chantiers, eq(schema.chantiers.id, schema.expenses.chantierId))
      .innerJoin(schema.categories, eq(schema.categories.id, schema.expenses.categoryId))
      .where(eq(schema.expenses.userId, user.id))
      .orderBy(schema.expenses.createdAt);
    const result = rows.map((r) => ({ ...r.expense, chantierName: r.chantierName, categoryName: r.categoryName }));
    return c.json({ expenses: result.reverse() }, 200);
  })

  // List expenses awaiting approval on chantiers the current user (supervisor) is assigned to.
  .get("/pending-approval", async (c) => {
    const user = c.get("user")!;
    const assigned = await db
      .select({ chantierId: schema.userChantiers.chantierId })
      .from(schema.userChantiers)
      .where(eq(schema.userChantiers.userId, user.id));
    const chantierIds = assigned.map((a) => a.chantierId);
    if (!chantierIds.length) return c.json({ expenses: [] }, 200);

    const rows = await db
      .select({
        expense: schema.expenses,
        chantierName: schema.chantiers.name,
        categoryName: schema.categories.name,
        submitterName: schema.user.name,
        submitterEmail: schema.user.email,
      })
      .from(schema.expenses)
      .innerJoin(schema.chantiers, eq(schema.chantiers.id, schema.expenses.chantierId))
      .innerJoin(schema.categories, eq(schema.categories.id, schema.expenses.categoryId))
      .innerJoin(schema.user, eq(schema.user.id, schema.expenses.userId))
      .where(and(inArray(schema.expenses.chantierId, chantierIds), eq(schema.expenses.status, "submitted")))
      .orderBy(schema.expenses.createdAt);
    const result = rows.map((r) => ({
      ...r.expense,
      chantierName: r.chantierName,
      categoryName: r.categoryName,
      submitterName: r.submitterName,
      submitterEmail: r.submitterEmail,
    }));
    return c.json({ expenses: result }, 200);
  })

  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [expense] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    if (!expense) return c.json({ message: "Not found" }, 404);
    return c.json({ expense }, 200);
  })

  // Edit own expense — only while submitted or rejected (re-submits after edit).
  .patch("/:id", zValidator("json", patchSchema), async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const [expense] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    if (!expense) return c.json({ message: "Not found" }, 404);
    if (expense.userId !== user.id) return c.json({ message: "Forbidden" }, 403);
    if (expense.status === "approved") return c.json({ message: "Dépense déjà approuvée, non modifiable" }, 409);

    const [updated] = await db
      .update(schema.expenses)
      .set({ ...body, status: "submitted", rejectionComment: null, updatedAt: new Date() })
      .where(eq(schema.expenses.id, id))
      .returning();

    await db.insert(schema.approvalLogs).values({ expenseId: id, actorId: user.id, action: "submitted" });
    return c.json({ expense: updated }, 200);
  })

  .delete("/:id", async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const [expense] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    if (!expense) return c.json({ message: "Not found" }, 404);
    if (expense.userId !== user.id) return c.json({ message: "Forbidden" }, 403);
    if (expense.status === "approved") return c.json({ message: "Dépense déjà approuvée, non supprimable" }, 409);
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    return c.json({ ok: true }, 200);
  })

  .post("/:id/approve", async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const [expense] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    if (!expense) return c.json({ message: "Not found" }, 404);

    const [updated] = await db
      .update(schema.expenses)
      .set({ status: "approved", reviewedAt: new Date(), reviewedBy: user.id, updatedAt: new Date() })
      .where(eq(schema.expenses.id, id))
      .returning();

    await db.insert(schema.approvalLogs).values({ expenseId: id, actorId: user.id, action: "approved" });
    return c.json({ expense: updated }, 200);
  })

  .post("/:id/reject", zValidator("json", rejectSchema), async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const { comment } = c.req.valid("json");
    const [expense] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    if (!expense) return c.json({ message: "Not found" }, 404);

    const [updated] = await db
      .update(schema.expenses)
      .set({
        status: "rejected",
        rejectionComment: comment ?? null,
        reviewedAt: new Date(),
        reviewedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.expenses.id, id))
      .returning();

    await db.insert(schema.approvalLogs).values({
      expenseId: id,
      actorId: user.id,
      action: "rejected",
      comment,
    });
    return c.json({ expense: updated }, 200);
  });
