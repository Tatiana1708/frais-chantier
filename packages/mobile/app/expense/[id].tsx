import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Trash, PencilSimple, FloppyDisk } from "phosphor-react-native";
import { getLocalExpense, updateLocalExpense, deleteLocalExpense, LocalExpense } from "../../lib/db";
import { api } from "../../lib/api";
import { pushPendingExpenses } from "../../lib/sync";
import { useIsOnline } from "../../lib/network";
import { StatusBadge } from "../../components/StatusBadge";
import { colors, radius, spacing } from "../../lib/theme";

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  const [expense, setExpense] = useState<LocalExpense | null>(null);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const e = await getLocalExpense(id);
    setExpense(e);
    if (e) {
      setAmount(String(e.amount));
      setDescription(e.description ?? "");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!expense) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Text style={styles.hint}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const canEdit = expense.status !== "approved";

  const onSave = async () => {
    const amountNumber = Number(amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0) return Alert.alert("Montant invalide");

    setSaving(true);
    await updateLocalExpense(expense.clientUuid, {
      amount: amountNumber,
      description: description || null,
      syncStatus: "pending",
      status: "submitted",
      rejectionComment: null,
    });

    if (expense.serverId && isOnline) {
      try {
        const res = await api.expenses[":id"].$patch({
          param: { id: String(expense.serverId) },
          json: { amount: amountNumber, description },
        });
        if (res.ok) {
          await updateLocalExpense(expense.clientUuid, { syncStatus: "synced" });
        }
      } catch {}
    } else if (isOnline) {
      pushPendingExpenses();
    }

    queryClient.invalidateQueries({ queryKey: ["local-expenses"] });
    setSaving(false);
    setEditing(false);
    load();
  };

  const onDelete = () => {
    Alert.alert("Supprimer la dépense ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          if (expense.serverId && isOnline) {
            await api.expenses[":id"].$delete({ param: { id: String(expense.serverId) } }).catch(() => {});
          }
          await deleteLocalExpense(expense.clientUuid);
          queryClient.invalidateQueries({ queryKey: ["local-expenses"] });
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ title: "Détail de la dépense", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.amount}>
            {expense.amount.toLocaleString("fr-FR")} {expense.currency}
          </Text>
          <StatusBadge status={expense.status} syncStatus={expense.syncStatus} />
        </View>

        <Text style={styles.meta}>{expense.categoryName} · {expense.chantierName}</Text>
        <Text style={styles.meta}>{expense.date} · {expense.paymentMode}</Text>

        {expense.rejectionComment ? (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionTitle}>Motif du rejet</Text>
            <Text style={styles.rejectionText}>{expense.rejectionComment}</Text>
          </View>
        ) : null}

        {expense.receiptLocalUri ? (
          <Image source={{ uri: expense.receiptLocalUri }} style={styles.receipt} />
        ) : null}

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Montant</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
            <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <FloppyDisk size={18} color="#fff" weight="bold" />
                  <Text style={styles.saveText}>Enregistrer et resoumettre</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            {expense.description ? <Text style={styles.description}>{expense.description}</Text> : null}
            {canEdit ? (
              <View style={styles.actions}>
                <Pressable style={styles.editButton} onPress={() => setEditing(true)}>
                  <PencilSimple size={18} color={colors.primary} weight="bold" />
                  <Text style={styles.editText}>Modifier</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={onDelete}>
                  <Trash size={18} color={colors.danger} weight="bold" />
                  <Text style={styles.deleteText}>Supprimer</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.sm },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontFamily: "Poppins_700Bold", fontSize: 26, color: colors.text },
  meta: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.textSecondary },
  description: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text, marginTop: spacing.sm },
  rejectionBox: { backgroundColor: "#D0342C1A", borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, gap: 4 },
  rejectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.danger },
  rejectionText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text },
  receipt: { width: "100%", height: 260, borderRadius: radius.md, marginTop: spacing.md },
  actions: { flexDirection: "row", gap: 8, marginTop: spacing.lg },
  editButton: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 13 },
  editText: { fontFamily: "Poppins_600SemiBold", color: colors.primary },
  deleteButton: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.md, paddingVertical: 13 },
  deleteText: { fontFamily: "Poppins_600SemiBold", color: colors.danger },
  editForm: { gap: 4, marginTop: spacing.md },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, fontFamily: "Poppins_500Medium", fontSize: 16, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: "top", fontFamily: "Poppins_400Regular", fontSize: 14 },
  saveButton: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, marginTop: spacing.lg },
  saveText: { fontFamily: "Poppins_700Bold", color: "#fff", fontSize: 15 },
  hint: { fontFamily: "Poppins_400Regular", color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
