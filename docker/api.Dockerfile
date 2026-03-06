FROM node:22-alpine AS base
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN corepack enable && pnpm install
COPY . .
RUN pnpm --filter @arena/api build
CMD ["node", "apps/api/dist/main.js"]
