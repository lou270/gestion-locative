#!/bin/sh
set -e

# Run migrations
if command -v npx >/dev/null 2>&1; then
    echo "Running Prisma migrations..."
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    
    echo "Seeding Admin User..."
    # We use ts-node to run the seed script directly
    # Ensure ts-node is available or use a compiled version if in production only environment
    npx ts-node prisma/seed-admin.ts || echo "Seed failed (maybe dependencies missing in prod?)"
fi

echo "Starting Next.js..."
exec node server.js
