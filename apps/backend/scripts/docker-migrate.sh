#!/bin/sh
set -e

cd /app/apps/backend

echo "=== Step 1/3: Check baseline ==="
npx ts-node scripts/baseline-if-needed.ts

echo "=== Step 2/3: Apply migrations ==="
npx prisma migrate deploy

echo "=== Step 3/3: Seed database ==="
npx prisma db seed

echo "Migrations and seed completed!"
