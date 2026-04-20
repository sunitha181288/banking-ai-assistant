# frontend/Dockerfile
# ──────────────────────────────────────────────
# Node 20 LTS is required for Next.js 15
# ──────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "start"]
