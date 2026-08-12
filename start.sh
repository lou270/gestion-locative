#!/bin/sh
set -e

# La CLI Prisma est installée dans l'image. On l'appelle directement plutôt que
# par `npx`, qui tenterait un téléchargement depuis le registre npm si le
# paquet venait à manquer — un démarrage ne doit pas dépendre du réseau.
if [ -f node_modules/prisma/build/index.js ]; then
    PRISMA="node node_modules/prisma/build/index.js"
else
    PRISMA="npx --no-install prisma"
fi

echo "→ Application des migrations…"
# Aucun repli sur `prisma db push --accept-data-loss` : sur une base de
# production, cette commande aligne le schéma en SUPPRIMANT sans confirmation
# les colonnes et les données qui la gênent. Mieux vaut refuser de démarrer et
# laisser l'exploitant décider.
$PRISMA migrate deploy

echo "→ Compte administrateur…"
if ! node prisma/seed-admin.js; then
    echo "❌  Le compte administrateur n'a pas pu être créé : la connexion serait"
    echo "    impossible. Vérifiez ADMIN_EMAIL / ADMIN_PASSWORD et la base, puis"
    echo "    redémarrez le conteneur."
    exit 1
fi

echo "→ Démarrage de Next.js…"
exec node server.js
