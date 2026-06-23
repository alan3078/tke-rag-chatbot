# =============================================================================
# Multi-stage Dockerfile for TKE RAG Chatbot
# Builds the Next.js app from apps/web in a monorepo context
# =============================================================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
RUN npm ci

# Stage 2: Build the application
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
WORKDIR /app/apps/web
RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output from apps/web
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy nodejieba native bindings (needed at runtime)
COPY --from=builder /app/node_modules/nodejieba ./node_modules/nodejieba
COPY --from=builder /app/node_modules/reflect-metadata ./node_modules/reflect-metadata

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
