import { View, Text, StyleSheet } from "react-native";
import { statusMeta } from "../lib/theme";

export function StatusBadge({ syncStatus, status }: { syncStatus?: string; status: string }) {
  const key = syncStatus === "pending" || syncStatus === "error" ? syncStatus : status;
  const meta = statusMeta[key] ?? { label: key, color: "#9B9B9B" };

  return (
    <View style={[styles.badge, { backgroundColor: `${meta.color}1A`, borderColor: meta.color }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
});
