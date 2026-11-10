# syntax=docker/dockerfile:1
# Build context: raíz del monorepo (RootSearch/)

FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

# ----------------------------
# Desarrollo (hot reload)
# ----------------------------
FROM base AS development
COPY frontend ./frontend
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace", "frontend"]

# ----------------------------
# Build
# ----------------------------
FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY frontend ./frontend
RUN npm run build --workspace frontend

# ----------------------------
# Producción
# ----------------------------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/next.config.mjs ./frontend/next.config.mjs
COPY --from=build /app/frontend/package.json ./frontend/package.json

WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "frontend"]
