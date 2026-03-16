# ============================================
# Stage 1: Base
# ============================================
FROM node:20-slim AS base
WORKDIR /app
RUN npm install -g pnpm@9

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY .env.local .env
COPY prisma ./prisma/
COPY build ./build/
COPY tsconfig.json ./
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder
# ============================================
FROM deps AS builder
COPY . .
RUN pnpm run build:prisma \
    && pnpm run build:sdk \
    && pnpm run build:swagger \
    && pnpm run build:main

# ============================================
# Stage 4: Runner
# ============================================
FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/src/prisma ./src/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./

CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema && node lib/executable/seed && node lib/executable/server"]
