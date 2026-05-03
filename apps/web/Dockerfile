FROM node:24.15.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/web apps/web
COPY packages/shared packages/shared
RUN pnpm --filter @agendarhorario/shared build
RUN pnpm --filter @agendarhorario/web build

FROM caddy:2.11.2-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/apps/web/dist /usr/share/caddy
RUN chown -R app:app /data /config
USER app
EXPOSE 80
