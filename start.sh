#!/bin/sh
set -e

DATA_DIR=/app/data

# Contrôle préalable du volume. Sans lui, un dossier hôte non inscriptible
# ressort sous la forme « SQLite database error: unable to open database file »,
# qui ne dit ni quel dossier, ni pourquoi, ni comment le réparer. C'est le
# premier écueil d'une installation : Docker crée le dossier de montage en
# `root` quand il n'existe pas encore, alors que le conteneur tourne sans
# privilèges.
if [ ! -d "$DATA_DIR" ]; then
    echo "❌  Le dossier de données $DATA_DIR est absent."
    echo "    Vérifiez le montage de volume « ./data:/app/data » dans docker-compose."
    exit 1
fi

if ! touch "$DATA_DIR/.permissions-test" 2>/dev/null; then
    echo "❌  Le dossier de données $DATA_DIR n'est pas inscriptible."
    echo "    Le conteneur tourne en uid $(id -u), or le dossier appartient à"
    echo "    l'uid $(stat -c %u "$DATA_DIR" 2>/dev/null || echo '?')."
    echo
    echo "    Sur le serveur, depuis le dossier contenant docker-compose.yml :"
    echo "        sudo chown -R $(id -u):$(id -g) ./data"
    echo "        docker compose -f docker-compose.yml restart"
    exit 1
fi
rm -f "$DATA_DIR/.permissions-test"

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
