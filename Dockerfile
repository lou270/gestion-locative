
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Generate Prisma Client
RUN npx prisma generate

# Create data directory so SQLite doesn't fail if initialized during build
RUN mkdir -p /app/data

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# L'image de base fournit déjà l'utilisateur `node` en uid/gid 1000. On le
# réutilise au lieu d'en créer un en 1001 : sur un serveur Linux, le premier
# compte créé porte presque toujours l'uid 1000, et un volume monté depuis son
# répertoire devient alors inaccessible au conteneur — SQLite échoue sur un
# « unable to open database file » qui ne dit pas d'où vient le problème.

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Create data directory and set permissions for SQLite volume
RUN mkdir -p /app/data && chown node:node /app/data

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Schéma et migrations, appliqués au démarrage par `prisma migrate deploy`.
COPY --from=builder /app/prisma ./prisma
COPY --chmod=0755 start.sh ./start.sh

# CLI Prisma, reprise telle quelle de l'étage `builder` plutôt que réinstallée ici.
# Un `npm install` dans l'étage final refait un appel au registre npm après la
# copie du bundle standalone : la version installée peut différer de celle du
# lockfile, et la construction échoue sans accès sortant. `@prisma` apporte les
# moteurs dont la CLI a besoin ; il complète le `@prisma/client` déjà présent
# dans le bundle sans l'écraser.
COPY --from=builder --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma

USER node

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["./start.sh"]
