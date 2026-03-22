FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune --scope=@dev-sync/server --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
COPY --from=builder /app/out/full/ .
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma
RUN npm run build --workspace=@dev-sync/server
CMD ["node", "apps/server/dist/index.js"]
