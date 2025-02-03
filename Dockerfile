FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.2.0 --activate

COPY . /build
WORKDIR /build

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run build

RUN chmod +x /build/entrypoint.sh

ENTRYPOINT [ "/build/entrypoint.sh" ]
