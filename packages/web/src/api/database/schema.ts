import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

/**
 * Chantiers (worksites). Seeded/managed centrally; agents are assigned a subset via userChantiers.
 */
export const chantiers = sqliteTable("chantiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Expense categories adapted to BTP/topographie field work. */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

/** Which chantiers a user (agent/superviseur) is assigned to. */
export const userChantiers = sqliteTable("user_chantiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  chantierId: integer("chantier_id")
    .notNull()
    .references(() => chantiers.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Expenses. `clientUuid` is generated on-device at creation time (online or offline) and is the
 * idempotency key used during sync so retries never create duplicates.
 */
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientUuid: text("client_uuid").notNull().unique(),
  userId: text("user_id").notNull(),
  chantierId: integer("chantier_id")
    .notNull()
    .references(() => chantiers.id),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  date: text("date").notNull(), // YYYY-MM-DD
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("XAF"),
  description: text("description"),
  paymentMode: text("payment_mode").notNull().default("especes"), // especes | carte | virement | avance_caisse
  status: text("status").notNull().default("submitted"), // submitted | approved | rejected
  receiptKey: text("receipt_key"),
  rejectionComment: text("rejection_comment"),
  submittedAt: integer("submitted_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: text("reviewed_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Audit trail for every state transition (submission, approval, rejection). */
export const approvalLogs = sqliteTable("approval_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expenseId: integer("expense_id")
    .notNull()
    .references(() => expenses.id),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(), // submitted | approved | rejected
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
