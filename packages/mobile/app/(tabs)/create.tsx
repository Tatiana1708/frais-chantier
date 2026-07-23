import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Camera, Image as ImageIcon, CalendarBlank } from "phosphor-react-native";
import { authClient } from "../../lib/auth";
import { api } from "../../lib/api";
import { uuid } from "../../lib/uuid";
import { insertLocalExpense, getCachedChantiers, getCachedCategories } from "../../lib/db";
import { pushPendingExpenses } from "../../lib/sync";
import { useIsOnline } from "../../lib/network";
import { CURRENCIES, PAYMENT_MODES } from "../../lib/currencies";
import { colors, radius, spacing } from "../../lib/theme";
import { SelectField } from "../../components/SelectField";

type Option = { id: number; name: string; code?: string };

export default function CreateExpense() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isOnline = useIsOnline();

  const [chantiers, setChantiers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [chantierId, setChantierId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [paymentMode, setPaymentMode] = useState("especes");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCachedChantiers().then(setChantiers);
    getCachedCategories().then(setCategories);
  }, []);

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission requise", "Autorisez l'accès à la caméra pour photographier un reçu.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission requise", "Autorisez l'accès à la galerie.");
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ["images"] });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const resetForm = () => {
    setChantierId(null);
    setCategoryId(null);
    setDate(new Date());
    setAmount("");
    setDescription("");
    setPhotoUri(null);
    setPaymentMode("especes");
  };

  const onSubmit = async () => {
    setError("");
    if (!chantierId || !categoryId || !amount) {
      setError("Chantier, catégorie et montant sont requis");
      return;
    }
    const amountNumber = Number(amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0) {
      setError("Montant invalide");
      return;
    }

    setSaving(true);
    try {
      const clientUuid = uuid();
      let receiptLocalUri: string | null = null;

      if (photoUri) {
        const dir = `${FileSystem.documentDirectory}receipts/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const ext = photoUri.split(".").pop() ?? "jpg";
        const dest = `${dir}${clientUuid}.${ext}`;
        await FileSystem.copyAsync({ from: photoUri, to: dest });
        receiptLocalUri = dest;
      }

      const chantier = chantiers.find((c) => c.id === chantierId)!;
      const category = categories.find((c) => c.id === categoryId)!;
      const now = Date.now();

      await insertLocalExpense({
        clientUuid,
        serverId: null,
        userId: session!.user.id,
        chantierId,
        chantierName: chantier.name,
        categoryId,
        categoryName: category.name,
        date: date.toISOString().slice(0, 10),
        amount: amountNumber,
        currency,
        description: description || null,
        paymentMode,
        status: "submitted",
        syncStatus: "pending",
        syncError: null,
        receiptLocalUri,
        receiptKey: null,
        rejectionComment: null,
        createdAt: now,
        updatedAt: now,
      });

      queryClient.invalidateQueries({ queryKey: ["local-expenses"] });

      if (isOnline) {
        pushPendingExpenses().then(() =>
          queryClient.invalidateQueries({ queryKey: ["local-expenses"] })
        );
      }

      resetForm();
      Alert.alert(
        isOnline ? "Dépense soumise" : "Dépense enregistrée hors ligne",
        isOnline
          ? "La dépense a été enregistrée et est en cours de synchronisation."
          : "Elle sera synchronisée automatiquement dès que le réseau reviendra.",
        [{ text: "OK", onPress: () => router.push("/(tabs)") }]
      );
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const chantierOptions = chantiers.map((c) => ({ value: c.id, label: c.name, sublabel: c.code }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const paymentModeOptions = PAYMENT_MODES.map((p) => ({ value: p.value, label: p.label }));
  const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Nouvelle dépense</Text>

          <SelectField
            label="Chantier"
            value={chantierId}
            options={chantierOptions}
            onChange={(v) => setChantierId(Number(v))}
            placeholder={chantiers.length ? "Choisir un chantier" : "Aucun chantier en cache"}
          />

          <SelectField
            label="Catégorie"
            value={categoryId}
            options={categoryOptions}
            onChange={(v) => setCategoryId(Number(v))}
            placeholder="Choisir une catégorie"
          />

          <Text style={styles.label}>Date</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <CalendarBlank size={18} color={colors.text} />
            <Text style={styles.dateText}>{date.toLocaleDateString("fr-FR")}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          <Text style={styles.label}>Montant</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, { flex: 1.4 }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <SelectField label="" value={currency} options={currencyOptions} onChange={(v) => setCurrency(String(v))} />
            </View>
          </View>

          <SelectField
            label="Mode de paiement"
            value={paymentMode}
            options={paymentModeOptions}
            onChange={(v) => setPaymentMode(String(v))}
          />

          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Détail de la dépense..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <Text style={styles.label}>Justificatif</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
          <View style={styles.photoRow}>
            <Pressable style={styles.photoButton} onPress={pickFromCamera}>
              <Camera size={20} color={colors.primary} weight="bold" />
              <Text style={styles.photoButtonText}>Photo</Text>
            </Pressable>
            <Pressable style={styles.photoButton} onPress={pickFromGallery}>
              <ImageIcon size={20} color={colors.primary} weight="bold" />
              <Text style={styles.photoButtonText}>Galerie</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.submitButton} onPress={onSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enregistrer / Soumettre</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: colors.text, marginBottom: spacing.md },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginTop: spacing.md, marginBottom: 6 },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dateText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: colors.text },
  amountRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: colors.text,
  },
  textArea: { fontFamily: "Poppins_400Regular", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  preview: { width: "100%", height: 180, borderRadius: radius.md, marginBottom: spacing.sm },
  photoRow: { flexDirection: "row", gap: spacing.sm },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    backgroundColor: "#F2600C0D",
  },
  photoButtonText: { fontFamily: "Poppins_600SemiBold", color: colors.primary, fontSize: 14 },
  error: { color: colors.danger, fontFamily: "Poppins_500Medium", fontSize: 13, marginTop: spacing.md },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  submitText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16 },
});
