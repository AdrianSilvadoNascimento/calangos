# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine
ARG TURBO_VERSION=2.5.0
ARG PNPM_VERSION=9.15.0

# ==========================================
# Stage 1: Pruner — isolates the API workspace
# ==========================================
FROM node:${NODE_VERSION} AS pruner
ARG TURBO_VERSION
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm install -g turbo@${TURBO_VERSION}

COPY . .

RUN turbo prune api --docker

# ==========================================
# Stage 2: Installer — install all deps and build
# ==========================================
FROM node:${NODE_VERSION} AS installer
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

RUN pnpm turbo build --filter=api

# ==========================================
# Stage 3: Prod-deps — production-only node_modules
# ==========================================
FROM node:${NODE_VERSION} AS prod-deps
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ==========================================
# Stage 4: Runner — minimal production image
# ==========================================
FROM node:${NODE_VERSION} AS runner
RUN apk add --no-cache libc6-compat tini
WORKDIR /app

ENV NODE_ENV=production
USER node

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=installer /app/package.json ./
COPY --chown=node:node --from=installer /app/pnpm-workspace.yaml ./

COPY --chown=node:node --from=installer /app/packages ./packages
COPY --chown=node:node --from=installer /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
