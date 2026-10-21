# syntax=docker/dockerfile:1

# ---- build: install the workspace and compile TypeScript ----
FROM node:24-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
# `minimumReleaseAge` is pinned in pnpm-workspace.yaml, which this stage copies,
# so installs behave the same here as on a laptop or in CI.

WORKDIR /repo

# Copy only the manifests first: the install layer stays cached until a
# dependency actually changes, instead of being invalidated by every edit.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter server...

COPY server ./server
RUN pnpm --filter server build

# ---- runtime: production dependencies + compiled output only ----
FROM node:24-alpine AS runtime
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
RUN corepack enable

WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --prod --filter server... \
  && pnpm store prune

COPY --from=build /repo/server/dist ./server/dist
COPY --from=build /repo/server/drizzle ./server/drizzle
COPY --from=build /repo/server/tsconfig.json ./server/tsconfig.json

WORKDIR /repo/server

# Migrations run against the committed files before the server binds the port.
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
