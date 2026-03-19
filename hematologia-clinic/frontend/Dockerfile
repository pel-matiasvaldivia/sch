# ================================================================
# Multi-stage Dockerfile para el frontend Next.js
# ================================================================

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=development

# ─── Stage: Desarrollo ───
FROM base AS development

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Stage: Builder ───
FROM base AS builder

COPY package*.json ./
RUN npm install && npm cache clean --force

ENV NODE_ENV=production

COPY . .
RUN npm run build

# ─── Stage: Producción ───
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copiar solo los artefactos del build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
