import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "phosphor-react-native";
import { authClient } from "../../lib/auth";
import { getLocalExpenses } from "../../lib/db";
import { runFullSync } from "../../lib/sync";
import { OfflineBanner } from "../../components/OfflineBanner";
import { ExpenseCard } from "../../components/ExpenseCard";
import { colors, spacing } from "../../lib/theme";

export default function ExpensesList() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["local-expenses", userId],
    queryFn: () => getLocalExpenses(userId!),
    enabled: !!userId,
    refetchInterval: 4000,
  });

  const pendingCount = (expensesQuery.data ?? []).filter((e) => e.syncStatus !== "synced").length;

  const onRefresh = async () => {
    if (!userId) return;
    await runFullSync(userId);
    queryClient.invalidateQueries({ queryKey: ["local-expenses", userId] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <OfflineBanner pendingCount={pendingCount} />
      <View style={styles.header}>
        <Text style={styles.title}>Mes dépenses</Text>
      </View>
      <FlatList
        data={expensesQuery.data ?? []}
        keyExtractor={(item) => item.clientUuid}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Receipt size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Aucune dépense pour l'instant.{"\n"}Créez-en une depuis l'onglet Créer.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            amount={item.amount}
            currency={item.currency}
            categoryName={item.categoryName}
            chantierName={item.chantierName}
            date={item.date}
            status={item.status}
            syncStatus={item.syncStatus}
            receiptLocalUri={item.receiptLocalUri}
            subtitle={item.status === "rejected" && item.rejectionComment ? `Rejetée : ${item.rejectionComment}` : undefined}
            onPress={() => router.push(`/expense/${item.clientUuid}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.text },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl * 2, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { fontFamily: "Poppins_500Medium", color: colors.textSecondary, textAlign: "center", fontSize: 14 },
});
