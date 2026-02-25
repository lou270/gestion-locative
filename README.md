
# 🏠 Gestion Locative

Application de gestion pour propriétaires bailleurs indépendants. Permet de gérer les biens, les locataires, les paiements, et de générer des documents administratifs (quittances, avis d'échéance).

![Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## 🚀 Fonctionnalités

- **Tableau de Bord** : Vue d'ensemble des revenus, taux d'occupation, et locataires actifs.
- **Gestion des Biens** : Ajout, modification et suivi des appartements/maisons.
- **Gestion des Locataires** : Suivi des baux, dates d'entrée/sortie, loyers et charges.
- **Documents PDF** : Génération automatique de quittances de loyer et d'avis d'échéance.
- **Signature Électronique** : Intégration avec Yousign pour faire signer les baux (Webhooks inclus).
- **Authentification** : Système sécurisé (Auth.js) avec gestion "Super Admin".

## 🛠️ Stack Technique

- **Framework** : [Next.js 15+](https://nextjs.org/) (App Router)
- **Langage** : TypeScript
- **Base de Données** : SQLite (via [Prisma ORM](https://www.prisma.io/))
- **Styles** : Tailwind CSS
- **Auth** : Auth.js (NextAuth v5)
- **PDF** : @react-pdf/renderer

## 📦 Installation & Démarrage

### Option 1 : Docker (Recommandé)

Le plus simple pour démarrer sans configurer Node.js ou la base de données.

1. **Configurer l'environnement** :
   Créez un fichier `.env` à la racine :
   ```env
   AUTH_SECRET=votre_secret_super_long_et_aleatoire
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=votre_mot_de_passe
   ```

2. **Lancer** :
   ```bash
   docker-compose up --build
   ```

3. **Accéder** :
   Ouvrez [http://localhost:3000](http://localhost:3000).

---

### Option 2 : Local (Développement)

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configurer l'environnement** :
   Créez un fichier `.env` (ou `.env.local`) :
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="secret"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="password"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Initialiser la base de données** :
   ```bash
   npx prisma migrate dev
   npx prisma db seed # Crée le compte admin
   ```

4. **Lancer le serveur** :
   ```bash
   npm run dev
   ```

## 🔒 Authentification

L'application est protégée. Seul l'administrateur défini dans le `.env` peut se connecter.
Pour changer le mot de passe : modifiez le `.env` et redémarrez (Docker) ou relancez `npx prisma db seed` (Local).

