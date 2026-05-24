# ─── Stage 1: Dependências ────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Instala dotenv necessário para prisma.config.ts
RUN apk add --no-cache libc6-compat

# Copia manifests do workspace e do backend
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Instala APENAS dependências de produção do backend
RUN npm ci --workspace=apps/backend --omit=dev
RUN mkdir -p /app/apps/backend/node_modules

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copia manifests
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci --workspace=apps/backend

# Copia código-fonte do backend e arquivos de configuração
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/scripts ./apps/backend/scripts
RUN sed -i 's/\r$//' apps/backend/scripts/*.sh && chmod +x apps/backend/scripts/*.sh
COPY apps/backend/prisma.config.ts ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Gera o Prisma Client
RUN cd apps/backend && npx prisma generate

# Compila o TypeScript
RUN cd apps/backend && npm run build

# ─── Stage 3: Produção ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN apk add --no-cache libc6-compat

# Copia node_modules de produção
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copia build compilado
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copia Prisma schema e client gerado
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copia package.json (necessário para module resolution)
COPY apps/backend/package.json ./apps/backend/
COPY package.json ./

USER nestjs

WORKDIR /app/apps/backend

EXPOSE 3001

# Roda migrations e inicia a aplicação
CMD ["node", "dist/main.js"]
