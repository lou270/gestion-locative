#!/bin/sh
set -e

# Run migrations
if command -v npx >/dev/null 2>&1; then
    echo "Running Prisma db push..."
    npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
    
    echo "Seeding Admin User..."
    npx -y ts-node prisma/seed-admin.ts || echo "Seed failed (maybe dependencies missing in prod?)"
fi

echo "Starting Next.js..."
exec node server.js
