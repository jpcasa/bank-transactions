# syntax=docker/dockerfile:1
# Build context: repo root (docker build -f apps/api/Dockerfile .)

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api...
COPY apps/api apps/api
RUN pnpm --filter api build
# pnpm 10: --legacy needed unless inject-workspace-packages=true
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm deploy --filter api --prod --legacy /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# Copied explicitly: deploy's packlist may skip gitignored dist
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/api/drizzle ./drizzle
COPY --from=build --chown=node:node /repo/apps/api/data ./data
USER node
EXPOSE 8787
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1
CMD ["node", "dist/index.js"]
