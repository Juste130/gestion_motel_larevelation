# Gestion Motel La Révélation

Application web moderne de gestion opérationnelle et financière du motel **La Révélation**.

## 🚀 Technologies

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
- **Base de données** : PostgreSQL via [Prisma ORM](https://www.prisma.io/)
- **Authentification** : NextAuth.js (OTP par Email + Google OAuth)
- **Validation** : [Zod](https://zod.dev/)
- **Tests** : [Vitest](https://vitest.dev/)
- **Hébergement** : Netlify (Fonctions Cron programmées)

---

## 🛠️ Configuration & Installation

### 1. Variables d'environnement
Copiez `.env.example` vers `.env` et complétez les informations de connexion :
```bash
cp .env.example .env
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Génération du client Prisma & Migration DB
```bash
npx prisma generate
npx prisma db push
```

### 4. Lancement en développement
```bash
npm run dev
```

---

## 🧪 Tests Unitaires

Pour lancer la suite de tests avec Vitest :
```bash
npm run test
```

---

## 🛡️ Sécurité & Audits

Les points d'audit suivants ont été traités et sécurisés :
- 🔴 **Point 2** : Vérification stricte des stocks avant décrémentation (bloque le stock négatif).
- 🔴 **Point 3** : Système de récupération de mot de passe sécurisé par jetons à durée limitée.
- 🔴 **Point 4** : Limitation des tentatives d'OTP (max 5 essais puis invalidation).
- 🔴 **Point 5** : Protection du compte administrateur contre l'auto-suppression et l'orphelinat d'administrateurs.
- 🟠 **Point 6** : Suppression du fichier SQLite `dev.db` du contrôle de version.
- 🟠 **Point 7** : Déploiement et tâches cron consolidées sur Netlify (`netlify.toml`).
- 🟠 **Point 8** : Validation runtime obligatoire de toutes les entrées via Zod.
- 🟠 **Point 9** : Journal d'audit (`AuditLog`) étendu à toutes les actions administratives sensibles.
- 🟠 **Point 10** : Suite de tests automatiques configurée avec Vitest.
