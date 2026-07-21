import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Check } from "phosphor-react-native";
import { authClient, captureToken } from "../../lib/auth";
import { api } from "../../lib/api";
import { colors, radius, spacing } from "../../lib/theme";

type Chantier = { id: number; code: string; name: string };

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"agent" | "superviseur">("agent");
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.chantiers.$get().then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setChantiers(data.chantiers);
      }
    });
  }, []);

  const toggleChantier = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const onSubmit = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("Tous les champs sont requis");
      return;
    }
    if (!selected.length) {
      setError("Sélectionnez au moins un chantier");
      return;
    }
    setLoading(true);
    const res = await authClient.signUp.email(
      { name, email, password, role } as any,
      { onSuccess: captureToken }
    );
    if (res.error) {
      setLoading(false);
      setError(res.error.message ?? "Inscription impossible");
      return;
    }

    await api.chantiers.me.assigned.$post({ json: { chantierIds: selected } });
    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Renseignez vos informations et votre affectation chantier</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jean Mballa" placeholderTextColor={colors.textSecondary} />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="prenom.nom@entreprise.com"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="8 caractères minimum"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleRow}>
              {(["agent", "superviseur"] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                    {r === "agent" ? "Agent terrain" : "Superviseur"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Chantiers affectés</Text>
            <View style={styles.chantierList}>
              {chantiers.map((c) => {
                const isSelected = selected.includes(c.id);
                return (
                  <Pressable key={c.id} style={styles.chantierRow} onPress={() => toggleChantier(c.id)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected ? <Check size={14} color="#fff" weight="bold" /> : null}
                    </View>
                    <View>
                      <Text style={styles.chantierName}>{c.name}</Text>
                      <Text style={styles.chantierCode}>{c.code}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
            </Pressable>

            <Link href="/(auth)/sign-in" asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.text },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  form: { gap: 2 },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.text,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontFamily: "Poppins_600SemiBold", color: colors.text, fontSize: 14 },
  roleChipTextActive: { color: "#fff" },
  chantierList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  chantierRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, paddingHorizontal: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chantierName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text },
  chantierCode: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textSecondary },
  error: { color: colors.danger, fontFamily: "Poppins_500Medium", fontSize: 13, marginTop: spacing.sm },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  buttonText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16 },
  linkButton: { alignItems: "center", marginTop: spacing.md, paddingVertical: 8, marginBottom: spacing.lg },
  linkText: { color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 },
});
