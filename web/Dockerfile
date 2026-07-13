# web/Dockerfile
# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=11.10.0

# 1. Dependencies Stage
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG PNPM_VERSION
RUN npm i -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 2. Builder Stage
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ARG PNPM_VERSION
RUN npm i -g pnpm@${PNPM_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time
ARG NEXT_PUBLIC_SUPABASE_PROJECT_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_PROJECT_URL=${NEXT_PUBLIC_SUPABASE_PROJECT_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

# 3. Production Runner Stage
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
