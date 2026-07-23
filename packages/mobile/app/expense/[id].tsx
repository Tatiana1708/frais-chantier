import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Trash,
  PencilSimple,
  FloppyDisk,
  MapPin,
  Tag,
  CalendarBlank,
  CreditCard,
  NotePencil,
  Receipt,
  WarningCircle,
  X,
} from "phosphor-react-native";
import { getLocalExpense, updateLocalExpense, deleteLocalExpense, LocalExpense } from "../../lib/db";
import { api } from "../../lib/api";
import { pushPendingExpenses } from "../../lib/sync";
import { useIsOnline } from "../../lib/network";
import { StatusBadge } from "../../components/StatusBadge";
import { colors, radius, spacing } from "../../lib/theme";
import { PAYMENT_MODES } from "../../lib/currencies";

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
  const [zoomVisible, setZoomVisible] = useState(false);

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
        <Stack.Screen options={{ title: "Détail de la dépense", headerShown: true }} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const canEdit = expense.status !== "approved";
  const paymentLabel = PAYMENT_MODES.find((p) => p.value === expense.paymentMode)?.label ?? expense.paymentMode;

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

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ title: "Détail de la dépense", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <StatusBadge status={expense.status} syncStatus={expense.syncStatus} />
          <Text style={styles.amount}>
            {expense.amount.toLocaleString("fr-FR")} <Text style={styles.currency}>{expense.currency}</Text>
          </Text>
          <Text style={styles.category}>{expense.categoryName}</Text>
        </View>

        {expense.status === "rejected" && expense.rejectionComment ? (
          <View style={styles.rejectionBox}>
            <WarningCircle size={20} color={colors.danger} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectionTitle}>Motif du rejet</Text>
              <Text style={styles.rejectionText}>{expense.rejectionComment}</Text>
            </View>
          </View>
        ) : null}

        {expense.syncStatus === "error" && expense.syncError ? (
          <View style={styles.rejectionBox}>
            <WarningCircle size={20} color={colors.warning} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rejectionTitle, { color: colors.warning }]}>Erreur de synchronisation</Text>
              <Text style={styles.rejectionText}>{expense.syncError}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <InfoRow icon={<MapPin size={18} color={colors.primary} weight="bold" />} label="Chantier" value={expense.chantierName} />
          <View style={styles.divider} />
          <InfoRow icon={<Tag size={18} color={colors.primary} weight="bold" />} label="Catégorie" value={expense.categoryName} />
          <View style={styles.divider} />
          <InfoRow icon={<CalendarBlank size={18} color={colors.primary} weight="bold" />} label="Date" value={expense.date} />
          <View style={styles.divider} />
          <InfoRow icon={<CreditCard size={18} color={colors.primary} weight="bold" />} label="Mode de paiement" value={paymentLabel} />
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Montant</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
            <View style={styles.editActions}>
              <Pressable style={styles.cancelEditButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelEditText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FloppyDisk size={18} color="#fff" weight="bold" />
                    <Text style={styles.saveText}>Resoumettre</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {expense.description ? (
              <View style={styles.infoCard}>
                <View style={styles.descRow}>
                  <NotePencil size={18} color={colors.primary} weight="bold" />
                  <Text style={styles.descText}>{expense.description}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Justificatif</Text>
            {expense.receiptLocalUri ? (
              <Pressable onPress={() => setZoomVisible(true)}>
                <Image source={{ uri: expense.receiptLocalUri }} style={styles.receipt} />
              </Pressable>
            ) : (
              <View style={styles.noReceipt}>
                <Receipt size={28} color={colors.textSecondary} />
                <Text style={styles.noReceiptText}>Aucun justificatif attaché</Text>
              </View>
            )}

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

      {zoomVisible && expense.receiptLocalUri ? (
        <Pressable style={styles.zoomBackdrop} onPress={() => setZoomVisible(false)}>
          <Pressable style={styles.zoomClose} onPress={() => setZoomVisible(false)}>
            <X size={22} color="#fff" weight="bold" />
          </Pressable>
          <Image source={{ uri: expense.receiptLocalUri }} style={styles.zoomImage} resizeMode="contain" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amount: { fontFamily: "Poppins_700Bold", fontSize: 32, color: colors.text, marginTop: 4 },
  currency: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: colors.textSecondary },
  category: { fontFamily: "Poppins_500Medium", fontSize: 14, color: colors.textSecondary },
  rejectionBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#D0342C14",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rejectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.danger },
  rejectionText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text, marginTop: 2 },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 13 },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: "#F2600C14",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textSecondary },
  infoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: colors.text, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border },
  descRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm, alignItems: "flex-start" },
  descText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginTop: spacing.xs },
  receipt: { width: "100%", height: 240, borderRadius: radius.md },
  noReceipt: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noReceiptText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  editButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  editText: { fontFamily: "Poppins_600SemiBold", color: colors.primary },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  deleteText: { fontFamily: "Poppins_600SemiBold", color: colors.danger },
  editForm: {
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: colors.text, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: "top", fontFamily: "Poppins_400Regular", fontSize: 14 },
  editActions: { flexDirection: "row", gap: 8, marginTop: spacing.lg },
  cancelEditButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  cancelEditText: { fontFamily: "Poppins_600SemiBold", color: colors.text },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  saveText: { fontFamily: "Poppins_700Bold", color: "#fff", fontSize: 15 },
  zoomBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000E6",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomClose: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: "#FFFFFF33",
    borderRadius: 999,
    padding: 8,
    zIndex: 1,
  },
  zoomImage: { width: "100%", height: "80%" },
});
