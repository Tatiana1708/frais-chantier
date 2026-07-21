import { View, Text, StyleSheet } from "react-native";
import { WifiSlash } from "phosphor-react-native";
import { colors } from "../lib/theme";
import { useIsOnline } from "../lib/network";

export function OfflineBanner({ pendingCount = 0 }: { pendingCount?: number }) {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <WifiSlash size={18} color="#1E1E1E" weight="bold" />
      <Text style={styles.text}>
        Hors ligne{pendingCount > 0 ? ` — ${pendingCount} dépense(s) en attente de synchronisation` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#1E1E1E", flexShrink: 1 },
});
