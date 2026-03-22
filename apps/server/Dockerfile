FROM node:20-alpine AS base

FROM base AS installer
WORKDIR /app
# Copy the full monorepo (needed for workspace resolution)
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/types ./packages/types
COPY apps/server ./apps/server

# Install all deps
RUN npm install

# 1. Build shared types first
RUN npm run build --workspace=packages/types

# 2. Build server (types are now compiled in packages/types/dist)
RUN cd apps/server && npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build --workspace=@dev-sync/server

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/types/dist ./packages/types/dist
COPY --from=installer /app/packages/types/package.json ./packages/types/package.json
COPY --from=installer /app/apps/server/dist ./apps/server/dist
COPY --from=installer /app/apps/server/package.json ./apps/server/package.json
COPY --from=installer /app/apps/server/prisma ./apps/server/prisma

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
