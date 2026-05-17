# ─── Stage 1: Dependências ────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copia manifests do workspace e do frontend
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Instala apenas dependências de produção
RUN npm ci --workspace=apps/frontend --omit=dev

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci --workspace=apps/frontend
RUN mkdir -p /app/apps/frontend/node_modules

# Copia código-fonte do frontend
COPY apps/frontend/src ./apps/frontend/src
COPY apps/frontend/public ./apps/frontend/public
COPY apps/frontend/next.config.ts ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/postcss.config.mjs ./apps/frontend/
COPY apps/frontend/components.json ./apps/frontend/

# Variável para o Next.js conseguir se comunicar com o backend dentro do Docker
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Habilita output standalone para imagem mínima
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/frontend

# Build de produção
RUN npm run build

# ─── Stage 3: Produção ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos públicos estáticos
COPY --from=builder /app/apps/frontend/public ./public

# Copia o build do Next.js
# Usando modo padrão (sem standalone) — copia .next inteiro
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node_modules/.bin/next", "start"]
