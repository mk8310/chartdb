FROM node:22-alpine AS builder

ARG VITE_OPENAI_API_KEY
ARG VITE_OPENAI_API_ENDPOINT
ARG VITE_LLM_MODEL_NAME
ARG VITE_HIDE_BUCKLE_DOT_DEV

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN echo "VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}" > .env && \
    echo "VITE_OPENAI_API_ENDPOINT=${VITE_OPENAI_API_ENDPOINT}" >> .env && \
    echo "VITE_LLM_MODEL_NAME=${VITE_LLM_MODEL_NAME}" >> .env && \
    echo "VITE_HIDE_BUCKLE_DOT_DEV=${VITE_HIDE_BUCKLE_DOT_DEV}" >> .env
RUN npm run build
RUN npm prune --production

FROM node:22-alpine

ARG POSTGRES_URL
ARG JWT_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD

ENV POSTGRES_URL=${POSTGRES_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

RUN node server/init-db.js || echo "DB init skipped"

EXPOSE 3000

CMD ["node", "server/index.js"]
