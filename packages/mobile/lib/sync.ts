import { api } from "./api";
import {
  getPendingExpenses,
  updateLocalExpense,
  getLocalExpenses,
  insertLocalExpense,
  replaceCachedChantiers,
  replaceCachedCategories,
} from "./db";

async function uploadReceipt(localUri: string): Promise<string> {
  const filename = localUri.split("/").pop() ?? `receipt-${Date.now()}.jpg`;
  const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";

  const presignRes = await api.upload.presign.$post({ json: { filename, contentType } });
  if (!presignRes.ok) throw new Error("Échec de préparation de l'upload");
  const { url, key } = await presignRes.json();

  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();

  const putRes = await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
  if (!putRes.ok) throw new Error("Échec de l'envoi du justificatif");

  return key;
}

/** Push every pending/errored local expense to the server, uploading its receipt first if needed. */
export async function pushPendingExpenses() {
  const pending = await getPendingExpenses();
  let synced = 0;
  let failed = 0;

  for (const exp of pending) {
    try {
      let receiptKey = exp.receiptKey;
      if (exp.receiptLocalUri && !receiptKey) {
        receiptKey = await uploadReceipt(exp.receiptLocalUri);
        await updateLocalExpense(exp.clientUuid, { receiptKey });
      }

      const res = await api.expenses.$post({
        json: {
          clientUuid: exp.clientUuid,
          chantierId: exp.chantierId,
          categoryId: exp.categoryId,
          date: exp.date,
          amount: exp.amount,
          currency: exp.currency,
          description: exp.description ?? undefined,
          paymentMode: exp.paymentMode,
          receiptKey: receiptKey ?? undefined,
        },
      });

      if (!res.ok) throw new Error(`Serveur a répondu ${res.status}`);
      const { expense } = await res.json();

      await updateLocalExpense(exp.clientUuid, {
        serverId: expense.id,
        status: expense.status,
        syncStatus: "synced",
        syncError: null,
      });
      synced++;
    } catch (err: any) {
      await updateLocalExpense(exp.clientUuid, {
        syncStatus: "error",
        syncError: err?.message ?? "Erreur de synchronisation",
      });
      failed++;
    }
  }

  return { synced, failed };
}

/** Pull the latest state (status, rejection comments) for the user's own expenses from the server. */
export async function pullMyExpenses(userId: string) {
  const res = await api.expenses.mine.$get();
  if (!res.ok) return;
  const { expenses } = await res.json();
  const local = await getLocalExpenses(userId);
  const localByUuid = new Map(local.map((e) => [e.clientUuid, e]));

  for (const e of expenses) {
    const existing = localByUuid.get(e.clientUuid);
    if (existing) {
      await updateLocalExpense(e.clientUuid, {
        serverId: e.id,
        status: e.status,
        rejectionComment: e.rejectionComment,
        receiptKey: e.receiptKey,
        syncStatus: "synced",
        syncError: null,
      });
    } else {
      await insertLocalExpense({
        clientUuid: e.clientUuid,
        serverId: e.id,
        userId,
        chantierId: e.chantierId,
        chantierName: (e as any).chantierName ?? "",
        categoryId: e.categoryId,
        categoryName: (e as any).categoryName ?? "",
        date: e.date,
        amount: e.amount,
        currency: e.currency,
        description: e.description,
        paymentMode: e.paymentMode,
        status: e.status,
        syncStatus: "synced",
        syncError: null,
        receiptLocalUri: null,
        receiptKey: e.receiptKey,
        rejectionComment: e.rejectionComment,
        createdAt: new Date(e.createdAt).getTime(),
        updatedAt: new Date(e.updatedAt).getTime(),
      });
    }
  }
}

/** Full sync cycle: push local changes, then pull the server's view. Safe to call often. */
export async function runFullSync(userId: string) {
  const pushResult = await pushPendingExpenses();
  await pullMyExpenses(userId);
  return pushResult;
}

/** Refresh the offline cache of chantiers (assigned) and categories — call whenever online. */
export async function refreshReferenceData() {
  const [chantiersRes, categoriesRes] = await Promise.all([
    api.chantiers.me.assigned.$get(),
    api.categories.$get(),
  ]);
  if (chantiersRes.ok) {
    const { chantiers } = await chantiersRes.json();
    await replaceCachedChantiers(chantiers);
  }
  if (categoriesRes.ok) {
    const { categories } = await categoriesRes.json();
    await replaceCachedCategories(categories);
  }
}
