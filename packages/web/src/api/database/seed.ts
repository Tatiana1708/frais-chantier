import { db } from "./index";
import * as schema from "./schema";

async function seed() {
  const chantiers = [
    { code: "CH-001", name: "Chantier Douala - Route Bonabéri" },
    { code: "CH-002", name: "Chantier Yaoundé - Lot topographie Nsimalen" },
    { code: "CH-003", name: "Chantier Kribi - Extension port" },
    { code: "CH-004", name: "Chantier Bafoussam - Voirie centre-ville" },
  ];
  for (const ch of chantiers) {
    await db.insert(schema.chantiers).values(ch).onConflictDoNothing();
  }

  const categories = [
    "Carburant",
    "Transport",
    "Péage",
    "Hébergement",
    "Per diem",
    "Achats chantier",
    "Location d'outils",
    "Avance de caisse",
    "Frais de mission",
  ];
  for (const name of categories) {
    await db.insert(schema.categories).values({ name }).onConflictDoNothing();
  }

  console.log("Seed terminé.");
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
