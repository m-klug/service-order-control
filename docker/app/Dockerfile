# syntax=docker/dockerfile:1
#
# Build de produção do frontend (Vite/React). Contexto de build = raiz do
# repositório (para ter acesso a package.json, pnpm-lock.yaml e src/).
#
# As variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY são embutidas no
# bundle em tempo de build (Vite não lê env em runtime) — por isso são
# build args aqui, não env vars do container final.

FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY docker/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
