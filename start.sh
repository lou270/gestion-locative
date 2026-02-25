#!/bin/sh
set -e

# Run migrations
if command -v npx >/dev/null 2>&1; then
    echo "Running Prisma migrations..."
    npx prisma migrate deploy || npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate
    
    echo "Seeding Admin User..."
    npx -y tsx prisma/seed-admin.ts || echo "Seed failed (maybe dependencies missing in prod?)"
fi

echo "Starting Next.js..."
exec node server.js
