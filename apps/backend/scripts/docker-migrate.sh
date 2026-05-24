#!/bin/sh
set -e

cd /app/apps/backend

echo "=== Step 1/4: Check baseline ==="
npx ts-node scripts/baseline-if-needed.ts

echo "=== Step 2/4: Apply migrations ==="
npx prisma migrate deploy

echo "=== Step 3/4: Sync schema ==="
npx ts-node scripts/sync-schema-if-needed.ts

echo "=== Step 4/4: Seed database ==="
npx prisma db seed

echo "Migrations and seed completed!"
