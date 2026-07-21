# Design System — FraisChantier

## Contexte d'usage
App terrain BTP/topographie, utilisée en extérieur, souvent en plein soleil, parfois avec des gants,
et fréquemment sans réseau. Priorité absolue : lisibilité, gros boutons, saisie rapide, feedback visuel
immédiat sur l'état de synchronisation.

## Typographie
- Police: **Poppins** (Bold/SemiBold pour titres, Regular/Medium pour le corps)
- Tailles généreuses: titres 22-28px, corps 16px minimum, jamais en dessous de 14px
- Line-height confortable (1.4+) pour lecture rapide en extérieur

## Couleurs
- Primaire (accent action / marque chantier): **Safety Orange `#F2600C`** — rappel des EPI/signalisation chantier
- Fond principal: **Off-white `#F7F5F1`** (contraste élevé au soleil, pas de blanc pur qui éblouit)
- Surface carte: `#FFFFFF` avec ombre légère
- Texte principal: **Charcoal `#1E1E1E`**
- Texte secondaire: `#6B6B6B`
- Succès / Approuvé: **`#1E8E3E`**
- Attente / En file: **`#D9A400`** (ambre)
- Rejeté / Erreur: **`#D0342C`**
- Conflit: **`#8E5CD9`** (violet, rare)
- Bordures: `#E5E1D8`
- Dark mode non prioritaire pour le MVP (usage diurne extérieur)

## Statuts visuels (badges)
- Brouillon: gris `#9B9B9B`
- En attente de sync (hors ligne): ambre `#D9A400` + icône horloge/wifi barré
- Soumis / en validation: bleu `#2F6FED`
- Approuvé: vert `#1E8E3E` + icône check
- Rejeté: rouge `#D0342C` + icône croix, commentaire visible
- Conflit: violet `#8E5CD9`

## Layout & composants
- Boutons: hauteur min 52px, coins arrondis 12px, texte 16-18px bold, couleur orange pleine pour action
  primaire (Enregistrer, Soumettre), contour pour actions secondaires
- Cartes de dépense: montant en gros (bold, 20px), catégorie + chantier en sous-titre, badge de statut
  en haut à droite, miniature du reçu à gauche
- Formulaire de création: champs larges, un champ par ligne, sélection chantier/catégorie via liste
  déroulante native ou bottom-sheet (gros items tactiles), bouton photo très visible (icône appareil photo
  + libellé)
- Navigation: tabs en bas (Dépenses, Créer, Approbations [superviseur], Profil), icônes Phosphor
- Bannière offline: bandeau ambre fixe en haut quand hors ligne ("Hors ligne — X dépense(s) en attente
  de synchronisation")
- Feedback: toasts courts, pas de blocage modal sauf confirmation destructive

## Icônes
`@expo/vector-icons` (Phosphor si besoin de duotone) — jamais d'emoji.

## Ton / Voix
Interface en français, phrases courtes et directes, orientées action ("Soumettre la dépense",
"Ajouter un justificatif"). Messages d'erreur clairs et concrets ("Le montant est requis avant de
soumettre").
