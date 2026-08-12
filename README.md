
# 🏠 Gestion Locative

Application de gestion pour propriétaires bailleurs indépendants. Permet de gérer les biens, les locataires, les paiements, et de générer des documents administratifs (quittances, avis d'échéance).

## 🚀 Fonctionnalités

- **Tableau de bord** : revenus encaissés, loyers attendus, taux d'occupation et **suivi des impayés**.
- **Locataires** : annuaire avec recherche et filtre (baux en cours / terminés), échéancier mois par mois, journal des encaissements.
- **Biens** : ajout, occupation courante et historique des baux.
- **Documents PDF** : quittances de loyer, avis d'échéance et contrat de bail.
- **Attestation de loyer CAF** : remplissage automatique du Cerfa 10842*07.
- **Signature électronique** : intégration Yousign (webhooks signés).
- **Authentification** : Auth.js (NextAuth v5), compte administrateur unique.

## 🛠️ Stack technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router)
- **Langage** : TypeScript
- **Base de données** : SQLite via [Prisma ORM](https://www.prisma.io/)
- **Styles** : Tailwind CSS v4
- **Validation** : Zod (côté serveur, sur toutes les server actions)
- **Auth** : Auth.js (NextAuth v5)
- **PDF** : @react-pdf/renderer
- **Tests** : Jest + Testing Library

## 📦 Installation & démarrage

Copiez `.env.example` vers `.env` et renseignez au minimum `AUTH_SECRET`,
`ADMIN_EMAIL` et `ADMIN_PASSWORD`.

### Option 1 : Docker (recommandé)

```bash
docker compose up --build
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).
La base SQLite est persistée dans `./data`.

### Option 2 : local (développement)

```bash
npm install
npx prisma migrate dev     # crée/migre la base dans ./data
npx prisma db seed         # crée le compte administrateur
npm run dev
```

## ✅ Qualité

```bash
npm test      # suite Jest
npm run lint  # ESLint
npm run build # build de production (inclut la vérification TypeScript)
```

## 🔒 Sécurité

- **Routes API** : le middleware (`src/proxy.ts`) ne couvre pas `/api`. Chaque
  route handler doit donc appeler `guardApiRoute()` (`src/lib/api-guard.ts`),
  et chaque server action `requireSession()` (`src/lib/auth-guard.ts`).
  Sans ce garde, les quittances, baux et demandes de signature sont
  accessibles publiquement.
- **Webhook Yousign** : `/api/webhooks/yousign` est le seul endpoint public.
  Il vérifie la signature HMAC-SHA256 de Yousign et **rejette tout** si
  `YOUSIGN_WEBHOOK_SECRET` n'est pas renseigné — sinon n'importe qui pourrait
  marquer un bail comme signé.
- **Authentification** : seul l'administrateur défini dans `.env` peut se
  connecter. Pour changer le mot de passe, modifiez le `.env` puis redémarrez
  (Docker) ou relancez `npx prisma db seed` (local).
- **Tentatives de connexion** : 5 échecs depuis une même adresse IP en 15
  minutes bloquent celle-ci pendant 15 minutes
  ([`src/lib/rate-limit.ts`](src/lib/rate-limit.ts)). Le contrôle est appliqué
  dans `authorize()` et couvre donc aussi les appels directs à
  `/api/auth/callback/credentials`, pas seulement le formulaire.
  Le compteur vit en mémoire du processus : il repart à zéro au redémarrage du
  conteneur. Une limitation au niveau du reverse proxy reste un complément utile
  (voir ci-dessous).

  L'adresse retenue est la **dernière** entrée de `X-Forwarded-For`, celle que le
  proxy a réellement observée — les entrées de gauche sont fournies par le client
  et peuvent être falsifiées. Si vous placez un CDN devant le proxy, cette valeur
  devient l'adresse du CDN et la limitation perd son intérêt : il faut alors se
  fier à l'en-tête d'adresse réelle du CDN.

### Limiter aussi au niveau de Nginx Proxy Manager (optionnel)

La directive `limit_req_zone` doit être déclarée dans le bloc `http`, que
l'onglet « Advanced » d'un hôte ne permet pas d'atteindre. Elle passe par un
fichier de configuration personnalisé.

1. Sur le serveur, dans le volume `data` de Nginx Proxy Manager, créez
   `/data/nginx/custom/http_top.conf` :

   ```nginx
   limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
   ```

2. Redémarrez le conteneur Nginx Proxy Manager pour qu'il prenne le fichier en
   compte.

3. Dans l'hôte proxy de l'application, onglet **Advanced**, ajoutez :

   ```nginx
   location /api/auth/ {
       limit_req zone=login burst=5 nodelay;
       limit_req_status 429;

       include conf.d/include/proxy.conf;
       proxy_pass $forward_scheme://$server:$port;
   }
   ```

   `/api/auth/` couvre la soumission réelle du formulaire. Inutile de limiter
   `/login`, qui ne fait qu'afficher la page.

Vérifiez au passage que l'hôte transmet bien `X-Forwarded-Proto` (c'est le cas
par défaut avec `proxy.conf`) : sans lui, les cookies de session ne sont pas
marqués `Secure`.

## 📄 Attestation de loyer CAF (Cerfa 10842*07)

Depuis la fiche d'un locataire : **Gestion du bail → Attestation de loyer CAF**.

Le formulaire envoyé par la CAF est **nominatif** (matricule et code-barres
pré-imprimés) : il est donc téléversé à chaque demande plutôt que conservé
comme modèle. Le document rempli est renvoyé immédiatement et **n'est stocké
nulle part**.

Le Cerfa est un PDF *plat*, sans champ de formulaire : le remplissage superpose
du texte à des coordonnées relevées sur le document réel
([`src/lib/caf/layout.ts`](src/lib/caf/layout.ts)). Appliquées à un autre
formulaire, ces positions écriraient les informations en face des mauvaises
rubriques — [`verifyCafForm()`](src/lib/caf/verify.ts) refuse donc tout document
dont l'empreinte (position des 19 cases à cocher de la page 1) ne correspond
pas.

Les valeurs sont pré-remplies depuis le dossier locataire puis **relues et
ajustables** avant génération : plusieurs rubriques (sous-location, versement
direct, décence) relèvent d'une déclaration sur l'honneur du bailleur, et le
Cerfa réclame un loyer pour un *mois complet* au tarif de la période concernée.
Une rubrique laissée vide reste vierge sur le document.

Seule la première page est remplie ; la signature et le cachet restent à
apposer.

> Si la CAF publie un nouveau millésime du Cerfa, les coordonnées de
> `layout.ts` et l'empreinte devront être relevées à nouveau — la vérification
> rejettera le nouveau formulaire d'ici là, plutôt que de le remplir de travers.

## 🧮 Règles comptables

La logique de solde est centralisée dans [`src/lib/ledger.ts`](src/lib/ledger.ts) :

- le **dépôt de garantie** (`Depot`) n'est jamais compté comme un loyer réglé
  ni comme un revenu ;
- l'**allocation logement** (`CAF`) compte comme un règlement du loyer effectué
  pour le compte du locataire ;
- un paiement est rattaché à un mois par sa **période**, pas par sa date
  d'encaissement ;
- une **quittance** n'est délivrée que si le mois est soldé et qu'aucun arriéré
  antérieur ne subsiste ;
- les mois d'entrée et de sortie sont calculés **au prorata temporis**.
