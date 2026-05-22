import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Load local .env
dotenv.config();

// Fallback to root .env if DATABASE_URL is not set
if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const host = process.env.POSTGRES_HOST || 'localhost';
const user = process.env.POSTGRES_USER || 'copa2026';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const db = process.env.POSTGRES_DB || 'copa2026';
const port = process.env.POSTGRES_PORT || '5432';

const databaseUrl = process.env.DATABASE_URL || `postgresql://${user}:${password}@${host}:${port}/${db}?schema=public`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
