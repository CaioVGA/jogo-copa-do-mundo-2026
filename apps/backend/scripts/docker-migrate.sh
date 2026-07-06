#!/bin/sh
set -e

cd /app/apps/backend

echo "=== Step 1/4: Check baseline ==="
npx ts-node scripts/baseline-if-needed.ts

echo "=== Step 2/4: Apply migrations ==="
npx prisma migrate deploy

echo "=== Step 3/4: Sync schema ==="
npx ts-node scripts/sync-schema-if-needed.ts

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "=== Optional step: Seed database (RUN_SEED=true) ==="
  npx prisma db seed
else
  echo "=== Optional step skipped: Seed database (RUN_SEED=false) ==="
fi

echo "=== Step 4/4: Fix knockout venues (idempotent) ==="
npx ts-node scripts/fix-knockout-venues-if-needed.ts

echo "Migration flow completed successfully!"
