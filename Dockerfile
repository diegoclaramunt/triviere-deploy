FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src ./src
COPY public ./public
COPY server ./server
RUN npm test && npm run build

FROM node:24-alpine AS production
ARG APP_NAME=cat
ARG CLIENT_NAME=acme
ARG MONGO_COLLECTION=${CLIENT_NAME}
ENV NODE_ENV=production \
    PORT=3000 \
    APP_NAME=${APP_NAME} \
    CLIENT_NAME=${CLIENT_NAME} \
    MONGO_COLLECTION=${MONGO_COLLECTION}
LABEL org.opencontainers.image.title="${APP_NAME}-${CLIENT_NAME}" \
      com.triviere.client="${CLIENT_NAME}"
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /workspace/dist/server ./server
COPY --from=build /workspace/dist/frontend ./dist/frontend

USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]
