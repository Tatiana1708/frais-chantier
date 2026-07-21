import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";
import { authMiddleware, requireAuth, AuthEnv } from "../middleware/auth";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "date,chantier,categorie,montant,devise,mode_paiement,statut,description\n";
  const header = "date,chantier,categorie,montant,devise,mode_paiement,statut,description";
  const lines = rows.map((r) =>
    [r.date, r.chantier, r.categorie, r.montant, r.devise, r.mode, r.statut, r.description]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export const exportRoutes = new Hono<AuthEnv>()
  .use("*", authMiddleware, requireAuth)
  .get("/csv", async (c) => {
    const user = c.get("user")!;
    const role = (user as any).role ?? "agent";

    let chantierIds: number[] = [];
    if (role === "superviseur") {
      const assigned = await db
        .select({ chantierId: schema.userChantiers.chantierId })
        .from(schema.userChantiers)
        .where(eq(schema.userChantiers.userId, user.id));
      chantierIds = assigned.map((a) => a.chantierId);
    }

    const rows = await db
      .select({
        date: schema.expenses.date,
        montant: schema.expenses.amount,
        devise: schema.expenses.currency,
        mode: schema.expenses.paymentMode,
        statut: schema.expenses.status,
        description: schema.expenses.description,
        chantier: schema.chantiers.name,
        categorie: schema.categories.name,
      })
      .from(schema.expenses)
      .innerJoin(schema.chantiers, eq(schema.chantiers.id, schema.expenses.chantierId))
      .innerJoin(schema.categories, eq(schema.categories.id, schema.expenses.categoryId))
      .where(
        role === "superviseur"
          ? chantierIds.length
            ? inArray(schema.expenses.chantierId, chantierIds)
            : eq(schema.expenses.id, -1)
          : eq(schema.expenses.userId, user.id)
      );

    const csv = toCsv(rows);
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="notes-de-frais.csv"');
    return c.body(csv, 200);
  });
