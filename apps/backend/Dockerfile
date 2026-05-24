# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

# ─── Manifests compartilhados ─────────────────────────────────────────────────
FROM base AS packages

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# ─── Migrate (leve: sem build NestJS) ─────────────────────────────────────────
FROM packages AS migrate

ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm ci --workspace=apps/backend

COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/scripts ./apps/backend/scripts
COPY apps/backend/prisma.config.ts ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

RUN sed -i 's/\r$//' apps/backend/scripts/*.sh && chmod +x apps/backend/scripts/*.sh
RUN cd apps/backend && npx prisma generate

WORKDIR /app/apps/backend

# ─── Dependências de produção ─────────────────────────────────────────────────
FROM packages AS deps

RUN npm ci --workspace=apps/backend --omit=dev
RUN mkdir -p /app/apps/backend/node_modules

# ─── Build do backend ─────────────────────────────────────────────────────────
FROM packages AS builder

ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm ci --workspace=apps/backend

COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

RUN cd apps/backend && npx prisma generate && npm run build
RUN test -f /app/apps/backend/dist/main.js || (echo "ERROR: dist/main.js not found" && ls -laR /app/apps/backend/dist && exit 1)

# ─── Produção ─────────────────────────────────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY apps/backend/package.json ./apps/backend/
COPY package.json ./

USER nestjs
WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]
