# ==========================================
# Stage 1: Pruner (Isolates the API workspace)
# ==========================================
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
# Enable pnpm
RUN corepack enable pnpm
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy all source code
COPY . .

# Prune the monorepo keeping only what's needed for the API
RUN turbo prune api --docker

# ==========================================
# Stage 2: Installer (Install deps and Build)
# ==========================================
FROM node:24-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm
WORKDIR /app

# 1. Copy isolated package.json's and pnpm-lock.yaml
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 2. Install dependencies (using frozen-lockfile for deterministic builds)
RUN pnpm install --frozen-lockfile

# 3. Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# 4. Build the API and its dependencies
RUN pnpm turbo build --filter=api

# ==========================================
# Stage 3: Runner (Production Image)
# ==========================================
FROM node:24-alpine AS runner
RUN corepack enable pnpm
WORKDIR /app

# We need the node_modules with hoisted dependencies
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./
COPY --from=installer /app/pnpm-workspace.yaml ./

# Copy built internal packages
COPY --from=installer /app/packages ./packages

# Copy the built API
COPY --from=installer /app/apps/api ./apps/api

# Default to port 3000
EXPOSE 3000

WORKDIR /app/apps/api

# Start the NestJS application
CMD ["node", "dist/main.js"]
