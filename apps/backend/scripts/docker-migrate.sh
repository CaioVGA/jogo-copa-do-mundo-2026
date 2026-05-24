#!/bin/sh
set -e

cd /app/apps/backend

echo "Running database migrations..."

if ! npx prisma migrate deploy > /tmp/prisma-migrate.log 2>&1; then
  if grep -q "P3005" /tmp/prisma-migrate.log; then
    cat /tmp/prisma-migrate.log
    echo ""
    echo "Database already has schema without migration history (e.g. from db push)."
    echo "Baselining existing migrations - no data will be deleted."

    for migration_dir in prisma/migrations/*/; do
      [ -f "${migration_dir}migration.sql" ] || continue
      migration_name=$(basename "$migration_dir")
      echo "Marking migration as applied: ${migration_name}"
      npx prisma migrate resolve --applied "${migration_name}"
    done

    echo "Retrying migrate deploy..."
    npx prisma migrate deploy
  else
    cat /tmp/prisma-migrate.log
    exit 1
  fi
else
  cat /tmp/prisma-migrate.log
fi

echo "Running database seed..."
npx prisma db seed

echo "Migrations and seed completed!"
