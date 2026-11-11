# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies reproducing package-lock.json
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and TypeScript configurations
COPY tsconfig*.json ./
COPY src ./src

# Build production TypeScript bundle
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma@^6.19.3 --save-exact

# Copy generated Prisma artifacts and compiled code from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Secure non-root runtime user
RUN chmod +x ./docker-entrypoint.sh && \
    addgroup -S sweety && \
    adduser -S sweety -G sweety && \
    chown -R sweety:sweety /app

USER sweety

EXPOSE 3000

# Health check using Sweety backend health API
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main/server.js"]
