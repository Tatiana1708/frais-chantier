import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CaretDown, Check, X } from "phosphor-react-native";
import { colors, radius, spacing } from "../lib/theme";

export type SelectOption = { value: string | number; label: string; sublabel?: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Sélectionner...",
}: {
  label: string;
  value: string | number | null;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <CaretDown size={18} color={colors.textSecondary} weight="bold" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.closeButton}>
              <X size={20} color={colors.text} weight="bold" />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Aucune option disponible</Text>}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  style={[styles.option, isSelected && styles.optionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{item.label}</Text>
                    {item.sublabel ? <Text style={styles.optionSublabel}>{item.sublabel}</Text> : null}
                  </View>
                  {isSelected ? <Check size={18} color={colors.primary} weight="bold" /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text, marginTop: spacing.md, marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  fieldText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: colors.text, flex: 1, marginRight: 8 },
  placeholder: { fontFamily: "Poppins_400Regular", color: colors.textSecondary },
  backdrop: { flex: 1, backgroundColor: "#00000066" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: colors.text },
  closeButton: { padding: 4 },
  list: { padding: spacing.sm },
  empty: { fontFamily: "Poppins_400Regular", color: colors.textSecondary, textAlign: "center", padding: spacing.lg },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: "#F2600C14" },
  optionText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: colors.text },
  optionTextActive: { fontFamily: "Poppins_600SemiBold", color: colors.primary },
  optionSublabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
