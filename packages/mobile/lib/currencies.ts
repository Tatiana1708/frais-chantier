export const CURRENCIES = ["XAF", "XOF", "EUR", "USD", "GBP", "MAD"] as const;

export const PAYMENT_MODES = [
  { value: "especes", label: "Espèces" },
  { value: "carte", label: "Carte" },
  { value: "virement", label: "Virement" },
  { value: "avance_caisse", label: "Avance de caisse" },
];
