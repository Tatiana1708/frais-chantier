import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { UserCircle, ArrowsClockwise, DownloadSimple, SignOut, MapPin } from "phosphor-react-native";
import { authClient, getToken, clearToken } from "../../lib/auth";
import { getCachedChantiers } from "../../lib/db";
import { runFullSync, refreshReferenceData } from "../../lib/sync";
import { useIsOnline } from "../../lib/network";
import { colors, radius, spacing } from "../../lib/theme";

export default function Profile() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isOnline = useIsOnline();
  const [chantiers, setChantiers] = useState<{ id: number; name: string }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const role = (session?.user as any)?.role ?? "agent";

  useEffect(() => {
    getCachedChantiers().then(setChantiers);
  }, []);

  const onSync = async () => {
    if (!session) return;
    setSyncing(true);
    await refreshReferenceData().catch(() => {});
    const result = await runFullSync(session.user.id);
    setSyncing(false);
    getCachedChantiers().then(setChantiers);
    Alert.alert("Synchronisation", `${result.synced} dépense(s) synchronisée(s)${result.failed ? `, ${result.failed} en erreur` : ""}.`);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
      const token = getToken();
      const res = await fetch(`${baseUrl}api/export/csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export impossible");
      const csv = await res.text();
      const path = `${FileSystem.cacheDirectory}notes-de-frais.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Exporter les notes de frais" });
      }
    } catch (e) {
      Alert.alert("Erreur", "Export impossible. Vérifiez votre connexion.");
    } finally {
      setExporting(false);
    }
  };

  const onSignOut = async () => {
    await authClient.signOut();
    await clearToken();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <UserCircle size={56} color={colors.primary} weight="fill" />
          <Text style={styles.name}>{session?.user.name}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role === "superviseur" ? "Superviseur" : "Agent terrain"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chantiers affectés</Text>
          {chantiers.length ? (
            chantiers.map((c) => (
              <View key={c.id} style={styles.chantierRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={styles.chantierText}>{c.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.hint}>Aucun chantier en cache — synchronisez en ligne.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut réseau</Text>
          <Text style={[styles.hint, { color: isOnline ? colors.success : colors.warning }]}>
            {isOnline ? "En ligne" : "Hors ligne"}
          </Text>
        </View>

        <Pressable style={styles.actionButton} onPress={onSync} disabled={syncing}>
          {syncing ? <ActivityIndicator color="#fff" /> : (
            <>
              <ArrowsClockwise size={18} color="#fff" weight="bold" />
              <Text style={styles.actionText}>Synchroniser maintenant</Text>
            </>
          )}
        </Pressable>

        <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onExport} disabled={exporting}>
          {exporting ? <ActivityIndicator color={colors.primary} /> : (
            <>
              <DownloadSimple size={18} color={colors.primary} weight="bold" />
              <Text style={[styles.actionText, { color: colors.primary }]}>Exporter (CSV)</Text>
            </>
          )}
        </Pressable>

        <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={onSignOut}>
          <SignOut size={18} color={colors.danger} weight="bold" />
          <Text style={[styles.actionText, { color: colors.danger }]}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  profileHeader: { alignItems: "center", gap: 4, marginBottom: spacing.md },
  name: { fontFamily: "Poppins_700Bold", fontSize: 20, color: colors.text, marginTop: spacing.sm },
  email: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary },
  roleBadge: { backgroundColor: "#F2600C1A", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  roleText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.primary },
  section: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginBottom: 4 },
  chantierRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chantierText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.text },
  hint: { fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.textSecondary },
  actionButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
  },
  secondaryButton: { backgroundColor: "#F2600C0D", borderWidth: 1.5, borderColor: colors.primary },
  dangerButton: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.danger, marginTop: spacing.md },
  actionText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
