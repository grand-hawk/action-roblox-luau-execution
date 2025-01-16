FROM node:20-alpine

RUN corepack enable pnpm

COPY . /build
WORKDIR /build

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run build

CMD ["node", "dist/index.js"]
