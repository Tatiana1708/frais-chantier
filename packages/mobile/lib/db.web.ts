/**
 * Web preview stub. expo-sqlite's web (wasm) backend fails to bundle inside this project's
 * Metro/Vite web preview, and offline/local storage is a native-only concern for this app anyway
 * (field agents use Android/iOS, not the web preview). This in-memory shim keeps the web bundle
 * from crashing while native builds use the real SQLite-backed implementation in `db.ts`.
 */

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
  status: string;
  syncStatus: "pending" | "synced" | "error";
  syncError: string | null;
  receiptLocalUri: string | null;
  receiptKey: string | null;
  rejectionComment: string | null;
  createdAt: number;
  updatedAt: number;
};

let expenses: LocalExpense[] = [];
let cachedChantiers: { id: number; code: string; name: string }[] = [];
let cachedCategories: { id: number; name: string }[] = [];

export function initDb() {}

export async function insertLocalExpense(e: LocalExpense) {
  expenses = [e, ...expenses];
}

export async function updateLocalExpense(clientUuid: string, patch: Partial<LocalExpense>) {
  expenses = expenses.map((e) => (e.clientUuid === clientUuid ? { ...e, ...patch } : e));
}

export async function deleteLocalExpense(clientUuid: string) {
  expenses = expenses.filter((e) => e.clientUuid !== clientUuid);
}

export async function getLocalExpenses(userId: string): Promise<LocalExpense[]> {
  return expenses.filter((e) => e.userId === userId);
}

export async function getLocalExpense(clientUuid: string): Promise<LocalExpense | null> {
  return expenses.find((e) => e.clientUuid === clientUuid) ?? null;
}

export async function getPendingExpenses(): Promise<LocalExpense[]> {
  return expenses.filter((e) => e.syncStatus === "pending" || e.syncStatus === "error");
}

export async function replaceCachedChantiers(list: { id: number; code: string; name: string }[]) {
  cachedChantiers = list;
}

export async function getCachedChantiers() {
  return cachedChantiers;
}

export async function replaceCachedCategories(list: { id: number; name: string }[]) {
  cachedCategories = list;
}

export async function getCachedCategories() {
  return cachedCategories;
}
