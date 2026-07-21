export const colors = {
  primary: "#F2600C",
  primaryDark: "#C94E09",
  background: "#F7F5F1",
  surface: "#FFFFFF",
  text: "#1E1E1E",
  textSecondary: "#6B6B6B",
  border: "#E5E1D8",
  success: "#1E8E3E",
  warning: "#D9A400",
  danger: "#D0342C",
  conflict: "#8E5CD9",
  submitted: "#2F6FED",
  draft: "#9B9B9B",
};

export const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente de sync", color: colors.warning },
  error: { label: "Erreur de sync", color: colors.danger },
  submitted: { label: "En validation", color: colors.submitted },
  approved: { label: "Approuvée", color: colors.success },
  rejected: { label: "Rejetée", color: colors.danger },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 16 };
