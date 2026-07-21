import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Receipt } from "phosphor-react-native";
import { colors, radius, spacing } from "../lib/theme";
import { StatusBadge } from "./StatusBadge";

export function ExpenseCard({
  amount,
  currency,
  categoryName,
  chantierName,
  date,
  status,
  syncStatus,
  receiptLocalUri,
  onPress,
  subtitle,
}: {
  amount: number;
  currency: string;
  categoryName: string;
  chantierName: string;
  date: string;
  status: string;
  syncStatus?: string;
  receiptLocalUri?: string | null;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumb}>
        {receiptLocalUri ? (
          <Image source={{ uri: receiptLocalUri }} style={styles.thumbImage} />
        ) : (
          <Receipt size={22} color={colors.textSecondary} />
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.amount}>
            {amount.toLocaleString("fr-FR")} {currency}
          </Text>
          <StatusBadge status={status} syncStatus={syncStatus} />
        </View>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.meta}>
          {chantierName} · {date}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  amount: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.text },
  category: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginTop: 2 },
  meta: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
