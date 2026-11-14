FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24-bookworm-slim AS api
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/api ./dist/api
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/web/public/fonts ./apps/web/public/fonts
USER node
EXPOSE 3001
CMD ["sh","-c","npm run db:migrate && npm run db:seed && npm run start:api"]
FROM nginx:alpine AS web
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 80
