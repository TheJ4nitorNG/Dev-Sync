FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune --scope=@dev-sync/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
COPY --from=builder /app/out/full/ .
RUN npm run build --workspace=apps/web
FROM nginx:alpine
COPY --from=runner /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
