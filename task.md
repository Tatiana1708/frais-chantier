# Task: FraisChantier — App notes de frais offline BTP

## Scope (confirmed)
- Mobile only (Expo), MVP strict: auth, création dépense, photo justificatif, offline, sync, validation superviseur simple, export CSV basique.
- Rôles: agent (terrain), superviseur. Choisi à l'inscription (pas d'admin UI complet).
- Multi-devises. Email+mdp auth.

## Done (all MVP items delivered)
- [x] app_init, design.md, deps, app.json
- [x] auth.ts (role additionalField) + schema generated + business schema (chantiers, categories,
      userChantiers, expenses, approvalLogs) + db:push + seed (4 chantiers, 9 catégories BTP)
- [x] API: auth mount, chantiers (public list + me/assigned), categories, expenses (create/mine/
      pending-approval/detail/patch/delete/approve/reject with zod validation), upload (presign+view),
      export csv, users/me
- [x] mobile: sign-in/sign-up (role + chantiers picker), lib/auth.ts, lib/api.ts, lib/db.ts (SQLite
      offline store), lib/sync.ts (push pending + pull mine + full sync), lib/network.ts (NetInfo)
- [x] mobile: tabs (Dépenses, Créer, Approbations[superviseur only via href], Profil), expense detail/edit/delete
- [x] offline banner, status badges, expense cards
- [x] bun run build clean, tsc --noEmit clean (web + mobile), API smoke-tested, Metro running on 4300
- [x] delivered

## Notes for next round
- Admin UI (gestion chantiers/catégories/utilisateurs) volontairement hors MVP — géré via seed script.
- V2 backlog déjà identifié: OCR reçus, multi-entités, notifications avancées, intégration comptable,
  dashboard direction consolidé.
