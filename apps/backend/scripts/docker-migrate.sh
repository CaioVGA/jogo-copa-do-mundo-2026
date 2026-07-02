#!/bin/sh
set -e

cd /app/apps/backend

echo "=== Step 1/5: Check baseline ==="
npx ts-node scripts/baseline-if-needed.ts

echo "=== Step 2/5: Apply migrations ==="
npx prisma migrate deploy

echo "=== Step 3/5: Sync schema ==="
npx ts-node scripts/sync-schema-if-needed.ts

echo "=== Step 4/5: Seed database ==="
npx prisma db seed

echo "=== Step 5/5: Fix knockout venues (idempotent) ==="
npx ts-node scripts/fix-knockout-venues-if-needed.ts

echo "Migrations and seed completed!"
