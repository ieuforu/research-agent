# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
# `minimumReleaseAge` is pinned in pnpm-workspace.yaml, which this stage copies,
# so installs behave the same here as on a laptop or in CI.

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter web...

COPY web ./web
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/web/dist /usr/share/nginx/html
EXPOSE 80
