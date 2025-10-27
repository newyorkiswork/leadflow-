# LeadFlow AI - Backend Dockerfile (2025)
# Multi-stage build for optimized production deployment

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY lib/package*.json ./lib/
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY server/ ./server/
COPY lib/ ./lib/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build the application
WORKDIR /app/server
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S leadflow -u 1001

# Set working directory
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY --chown=leadflow:nodejs package*.json ./
COPY --chown=leadflow:nodejs server/package*.json ./server/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=leadflow:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=leadflow:nodejs /app/lib ./lib
COPY --from=builder --chown=leadflow:nodejs /app/prisma ./prisma
COPY --from=builder --chown=leadflow:nodejs /app/node_modules ./node_modules

# Copy health check script
COPY --chown=leadflow:nodejs scripts/health-check.sh ./scripts/
RUN chmod +x ./scripts/health-check.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV USER=leadflow

# Switch to non-root user
USER leadflow

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ./scripts/health-check.sh

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/index.js"]

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install development dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY lib/package*.json ./lib/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]

# Labels for metadata
LABEL maintainer="LeadFlow AI Team <dev@leadflow.ai>"
LABEL version="1.0.0"
LABEL description="LeadFlow AI Backend - Real Estate Investor Platform"
LABEL org.opencontainers.image.source="https://github.com/leadflow-ai/platform"
