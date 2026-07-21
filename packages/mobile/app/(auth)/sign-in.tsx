import { useState } from "react";
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
import { HardHat } from "phosphor-react-native";
import { authClient, captureToken } from "../../lib/auth";
import { colors, radius, spacing } from "../../lib/theme";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }
    setLoading(true);
    const res = await authClient.signIn.email(
      { email, password },
      { onSuccess: captureToken }
    );
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Connexion impossible");
      return;
    }
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
          <View style={styles.logo}>
            <HardHat size={40} color={colors.primary} weight="fill" />
          </View>
          <Text style={styles.title}>FraisChantier</Text>
          <Text style={styles.subtitle}>Notes de frais terrain, même sans réseau</Text>

          <View style={styles.form}>
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
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
            </Pressable>

            <Link href="/(auth)/sign-up" asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkText}>Pas encore de compte ? Créer un compte</Text>
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
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: "center" },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: "#F2600C1A",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.xs },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginBottom: 4, marginTop: 8 },
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
  error: {
    color: colors.danger,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16 },
  linkButton: { alignItems: "center", marginTop: spacing.md, paddingVertical: 8 },
  linkText: { color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 },
});
