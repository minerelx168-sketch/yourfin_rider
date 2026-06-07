# YourFin Rider API — production image (multi-stage)
# ── build ──────────────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app
# openssl is required by Prisma's query engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npm run build          # prisma generate + tsc -> dist/

# ── runtime ────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
# bring built output + already-installed deps (incl. generated Prisma client
# and the prisma CLI used by `migrate deploy`) — no network needed at boot
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p uploads
EXPOSE 4000
# apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
