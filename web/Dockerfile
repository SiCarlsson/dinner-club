# 1. Dependencies Stage
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm globally inside the container (installs v11+)
RUN npm i -g pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml* ./

# FIX: pnpm 11+ requires configuration via allowBuilds inside pnpm-workspace.yaml
RUN echo "allowBuilds:" > pnpm-workspace.yaml && \
    echo "  sharp: true" >> pnpm-workspace.yaml && \
    echo "  unrs-resolver: true" >> pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

# 2. Builder Stage
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# FIX: Inject the same permission file here so the Next.js builder can execute sharp
RUN echo "allowBuilds:" > pnpm-workspace.yaml && \
    echo "  sharp: true" >> pnpm-workspace.yaml && \
    echo "  unrs-resolver: true" >> pnpm-workspace.yaml

RUN pnpm run build

# 3. Production Runner Stage (No pnpm needed here!)
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk update && apk upgrade --no-cache
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]