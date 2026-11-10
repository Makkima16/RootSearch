# syntax=docker/dockerfile:1
# Build context: raíz del monorepo (RootSearch/)

FROM node:22-alpine AS base
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

# ----------------------------
# Desarrollo (hot reload)
# ----------------------------
FROM base AS development
COPY backend ./backend
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace", "backend"]

# ----------------------------
# Build
# ----------------------------
FROM base AS build
COPY backend ./backend
RUN npm run build --workspace backend

# ----------------------------
# Producción
# ----------------------------
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main"]
