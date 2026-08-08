FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
COPY nx.json tsconfig*.json nest-cli.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci
RUN npx nx build api

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/api ./dist/apps/api
COPY package*.json ./

EXPOSE 3001

CMD ["node", "dist/apps/api/main.js"]
