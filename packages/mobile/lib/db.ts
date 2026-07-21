import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("frais-chantier.db");

export type LocalExpense = {
  clientUuid: string;
  serverId: number | null;
  userId: string;
  chantierId: number;
  chantierName: string;
  categoryId: number;
  categoryName: string;
  date: string;
  amount: number;
  currency: string;
  description: string | null;
  paymentMode: string;
  status: string; // submitted | approved | rejected (server status once known)
  syncStatus: "pending" | "synced" | "error";
  syncError: string | null;
  receiptLocalUri: string | null;
  receiptKey: string | null;
  rejectionComment: string | null;
  createdAt: number;
  updatedAt: number;
};

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS local_expenses (
      clientUuid TEXT PRIMARY KEY NOT NULL,
      serverId INTEGER,
      userId TEXT NOT NULL,
      chantierId INTEGER NOT NULL,
      chantierName TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      categoryName TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      description TEXT,
      paymentMode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      syncError TEXT,
      receiptLocalUri TEXT,
      receiptKey TEXT,
      rejectionComment TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_chantiers (
      id INTEGER PRIMARY KEY NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_categories (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
  `);
}

export async function insertLocalExpense(e: LocalExpense) {
  await db.runAsync(
    `INSERT INTO local_expenses
      (clientUuid, serverId, userId, chantierId, chantierName, categoryId, categoryName, date, amount, currency,
       description, paymentMode, status, syncStatus, syncError, receiptLocalUri, receiptKey, rejectionComment,
       createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      e.clientUuid,
      e.serverId,
      e.userId,
      e.chantierId,
      e.chantierName,
      e.categoryId,
      e.categoryName,
      e.date,
      e.amount,
      e.currency,
      e.description,
      e.paymentMode,
      e.status,
      e.syncStatus,
      e.syncError,
      e.receiptLocalUri,
      e.receiptKey,
      e.rejectionComment,
      e.createdAt,
      e.updatedAt,
    ]
  );
}

export async function updateLocalExpense(clientUuid: string, patch: Partial<LocalExpense>) {
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (patch as any)[k]);
  await db.runAsync(`UPDATE local_expenses SET ${setClause} WHERE clientUuid = ?`, [...values, clientUuid]);
}

export async function deleteLocalExpense(clientUuid: string) {
  await db.runAsync(`DELETE FROM local_expenses WHERE clientUuid = ?`, [clientUuid]);
}

export async function getLocalExpenses(userId: string): Promise<LocalExpense[]> {
  return db.getAllAsync<LocalExpense>(
    `SELECT * FROM local_expenses WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
}

export async function getLocalExpense(clientUuid: string): Promise<LocalExpense | null> {
  const row = await db.getFirstAsync<LocalExpense>(`SELECT * FROM local_expenses WHERE clientUuid = ?`, [
    clientUuid,
  ]);
  return row ?? null;
}

export async function getPendingExpenses(): Promise<LocalExpense[]> {
  return db.getAllAsync<LocalExpense>(`SELECT * FROM local_expenses WHERE syncStatus IN ('pending', 'error')`);
}

export async function replaceCachedChantiers(list: { id: number; code: string; name: string }[]) {
  await db.runAsync(`DELETE FROM cached_chantiers`);
  for (const c of list) {
    await db.runAsync(`INSERT INTO cached_chantiers (id, code, name) VALUES (?, ?, ?)`, [c.id, c.code, c.name]);
  }
}

export async function getCachedChantiers(): Promise<{ id: number; code: string; name: string }[]> {
  return db.getAllAsync(`SELECT * FROM cached_chantiers ORDER BY name`);
}

export async function replaceCachedCategories(list: { id: number; name: string }[]) {
  await db.runAsync(`DELETE FROM cached_categories`);
  for (const c of list) {
    await db.runAsync(`INSERT INTO cached_categories (id, name) VALUES (?, ?)`, [c.id, c.name]);
  }
}

export async function getCachedCategories(): Promise<{ id: number; name: string }[]> {
  return db.getAllAsync(`SELECT * FROM cached_categories ORDER BY name`);
}
