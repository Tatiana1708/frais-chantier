import { useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ClipboardText } from "phosphor-react-native";
import { api } from "../../lib/api";
import { colors, radius, spacing } from "../../lib/theme";

export default function Approvals() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const pending = useQuery({
    queryKey: ["pending-approval"],
    queryFn: async () => {
      const res = await api.expenses["pending-approval"].$get();
      return res.json();
    },
    refetchInterval: 8000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["pending-approval"] });

  const approve = async (id: number) => {
    const res = await api.expenses[":id"].approve.$post({ param: { id: String(id) } });
    if (res.ok) refresh();
    else Alert.alert("Erreur", "Impossible d'approuver (êtes-vous en ligne ?)");
  };

  const reject = async () => {
    if (!rejectTarget) return;
    const res = await api.expenses[":id"].reject.$post({ param: { id: String(rejectTarget) }, json: { comment } });
    setRejectTarget(null);
    setComment("");
    if (res.ok) refresh();
    else Alert.alert("Erreur", "Impossible de rejeter (êtes-vous en ligne ?)");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Approbations</Text>
        <Text style={styles.subtitle}>Dépenses en attente sur vos chantiers</Text>
      </View>
      <FlatList
        data={pending.data?.expenses ?? []}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        onRefresh={refresh}
        refreshing={pending.isFetching}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ClipboardText size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Aucune dépense en attente de validation.</Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.amount}>
                {item.amount.toLocaleString("fr-FR")} {item.currency}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.category}>{item.categoryName} · {item.chantierName}</Text>
            <Text style={styles.submitter}>Par {item.submitterName} ({item.submitterEmail})</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={[styles.actionButton, styles.approveButton]} onPress={() => approve(item.id)}>
                <CheckCircle size={18} color="#fff" weight="bold" />
                <Text style={styles.actionText}>Approuver</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.rejectButton]} onPress={() => setRejectTarget(item.id)}>
                <XCircle size={18} color="#fff" weight="bold" />
                <Text style={styles.actionText}>Rejeter</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={rejectTarget !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Motif du rejet</Text>
            <TextInput
              style={styles.modalInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Ex: justificatif illisible"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setRejectTarget(null)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={reject}>
                <Text style={styles.modalConfirmText}>Confirmer le rejet</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.text },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl * 2, gap: spacing.md },
  emptyText: { fontFamily: "Poppins_500Medium", color: colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.text },
  date: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary },
  category: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginTop: 4 },
  submitter: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  description: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.text, marginTop: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  actionButton: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingVertical: 11 },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.danger },
  actionText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: "#00000066", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: "100%" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.text, marginBottom: spacing.sm },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontFamily: "Poppins_400Regular", minHeight: 80, textAlignVertical: "top", color: colors.text },
  modalActions: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  modalCancelText: { fontFamily: "Poppins_600SemiBold", color: colors.text },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.danger },
  modalConfirmText: { fontFamily: "Poppins_600SemiBold", color: "#fff" },
});
