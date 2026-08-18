# Self-host em produção (Docker Compose)

Stack completa pra rodar o app fora do ambiente de desenvolvimento — pensada
pra um LXC no Proxmox, mas roda em qualquer host com Docker + Compose v2.

Mesmo código/migrations do resto do repositório; nada duplicado aqui além
da infraestrutura (banco, gateway, auth, API, painel administrativo e o
build do frontend).

## Arquitetura

```
                         ┌────────────────────────┐
   :8000 ──────────────▶ │  kong (gateway único)   │
   (API + Studio)        └────────┬────────┬───────┘
                                   │        │
                         ┌─────────┘        └─────────┐
                         ▼                             ▼
                 ┌───────────────┐            ┌────────────────┐
                 │ auth (GoTrue) │            │ rest (PostgREST)│
                 └───────┬───────┘            └────────┬────────┘
                         │                              │
                         └──────────────┬───────────────┘
                                         ▼
                                 ┌───────────────┐        ┌──────────────┐
                                 │  db (Postgres)│◀───────│ meta (admin) │
                                 └───────────────┘        └──────┬───────┘
                                         ▲                       │
                                         │                  ┌────▼────┐
                                 ┌───────┴───────┐          │ studio  │
                                 │ migrate (1x)  │          │ (via    │
                                 │ aplica         │          │ kong)   │
                                 │ ../supabase/   │          └─────────┘
                                 │ migrations     │
                                 └───────────────┘

   :8080 ──────────────▶ ┌────────────────┐
   (app)                 │ app (nginx +   │
                          │ build do Vite) │
                          └────────────────┘
```

`app` fala com a API só através do `kong` (mesma topologia do dev local, que
usa `supabase start` expondo tudo em `http://127.0.0.1:54321`). O Studio
também fica atrás do Kong, em `/`, protegido por usuário/senha (basic auth).

## Pré-requisitos

- Docker Engine + plugin Compose v2 (`docker compose version` deve mostrar
  v2.20+ — usamos `condition: service_completed_successfully`, recurso mais
  novo do Compose).
- No Proxmox: um LXC **privilegiado** com nesting habilitado (Docker dentro
  de LXC não-privilegiado tem restrições de namespace que costumam dar
  trabalho). Nas opções do container: `Features > nesting=1` (e `keyctl=1`
  se disponível). Depois, instale o Docker normalmente dentro do LXC
  (Debian/Ubuntu: [docs.docker.com/engine/install](https://docs.docker.com/engine/install/)).
- ~2 GB de RAM livres pra stack toda (Postgres + 5 serviços leves + nginx).

## Setup

1. Copie o `.env` e gere as chaves:

   ```bash
   cd docker
   cp .env.example .env
   node generate-keys.mjs
   ```

   Cole o `JWT_SECRET`, `ANON_KEY` e `SERVICE_ROLE_KEY` gerados no `.env`.
   Preencha também `POSTGRES_PASSWORD` (ex.: `openssl rand -hex 24`) e
   `DASHBOARD_PASSWORD` (login do Studio).

2. Ajuste `API_EXTERNAL_URL`, `SITE_URL` e `VITE_SUPABASE_URL` pro
   IP/hostname real do LXC na sua rede (ex.: `http://192.168.1.50:8000`) —
   **não** deixe `localhost` se for acessar de outro dispositivo.
   `VITE_SUPABASE_ANON_KEY` = mesma `ANON_KEY` de cima.

3. Suba a stack (a primeira vez baixa as imagens e builda o app — leva
   alguns minutos):

   ```bash
   docker compose up -d --build
   ```

   Ordem de subida (automática, via `depends_on`): `db` → `auth` → `migrate`
   (aplica `../supabase/migrations/*.sql` uma vez, idempotente) → `rest` →
   `kong`/`app`. Acompanhe com `docker compose ps` até tudo ficar `healthy`
   (exceto `migrate`, que sobe, roda e sai com código 0 — isso é esperado).

4. Crie o usuário operador (login público fica desabilitado —
   `GOTRUE_DISABLE_SIGNUP=true` — então o único jeito de criar conta é via
   API admin, com a `SERVICE_ROLE_KEY`):

   ```bash
   curl -X POST "http://<host>:8000/auth/v1/admin/users" \
     -H "apikey: <SERVICE_ROLE_KEY do .env>" \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY do .env>" \
     -H "Content-Type: application/json" \
     -d '{"email":"seu@email.com","password":"sua-senha","email_confirm":true}'
   ```

5. Acesse:
   - App: `http://<host>:8080`
   - Studio (ver/editar dados, gerenciar usuários): `http://<host>:8000/`,
     login = `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` do `.env`.

## Operação do dia a dia

**Atualizar o app** depois de um novo commit:
```bash
docker compose up -d --build app
```

**Aplicar novas migrations** (criadas em fases futuras, em
`../supabase/migrations/`): já rodam sozinhas na próxima subida —
```bash
docker compose up migrate
```
O serviço é idempotente (guarda o que já aplicou numa tabela de controle,
`supabase_migrations.schema_migrations`); rodar de novo não duplica nada.

**Backup do banco:**
```bash
docker exec soc-db pg_dump -U postgres postgres > backup-$(date +%F).sql
```
Os dados ficam no volume Docker `service-order-control_db-data`
(`docker volume inspect` pra achar o caminho no host, se quiser incluir no
backup do Proxmox também).

**Parar tudo:** `docker compose down` (mantém o volume/dados).
**Apagar tudo, incluindo dados:** `docker compose down -v` — ⚠️ irreversível.

**Logs de um serviço:** `docker compose logs -f <serviço>` (ex.: `auth`,
`rest`, `app`).

## Notas de segurança e comportamento (aprendidas na validação)

- Verificado de ponta a ponta: criar usuário → login → RLS bloqueando
  escrita/leitura de `anon` → leitura/escrita liberada pro usuário
  autenticado — tudo passando pelo Kong, igual ao fluxo real do app.
- `anon` sem sessão faz `SELECT` e recebe `[]` (lista vazia, HTTP 200) em
  vez de erro 401 — diferente do que se via no Postgres "cru" do ambiente
  de dev local, mas **igualmente seguro**: a política de RLS (`RLS
  Migrations`) restringe a `authenticated`, então nenhum dado real é
  exposto; é só uma diferença de como a imagem `supabase/postgres` já vem
  com privilégios (`GRANT`) mais amplos por padrão, deixando a
  restrição de fato por conta da RLS.
- O healthcheck embutido na imagem do `studio` testa `localhost:3000` de
  dentro do próprio container, mas o Next.js ali só liga na interface de
  rede do Docker — por isso ele aparece "unhealthy" mesmo funcionando
  (confirmamos acesso real via Kong). Desativamos esse healthcheck
  específico no compose; nada depende dele para funcionar.
- `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` são embutidos no bundle do
  frontend **em tempo de build** (Vite não lê `.env` em runtime) — se
  mudar essas variáveis, precisa rebuildar (`docker compose up -d --build
  app`), não só reiniciar o container.

## Versões fixadas

Imagens pinadas em versões específicas (não `:latest`) pra evitar quebra
por atualização silenciosa: `supabase/postgres:15.1.1.78`,
`supabase/gotrue:v2.158.1`, `postgrest/postgrest:v12.2.0`, `kong:2.8.1`,
`supabase/postgres-meta:v0.83.2`, `supabase/studio:20240923-2e3e90c`.
Atualizar exige troca manual da tag + reteste (não é automático).

## Estrutura

```
docker/
├── docker-compose.yml     # stack completa
├── .env.example            # template de variáveis
├── generate-keys.mjs       # gera JWT_SECRET/ANON_KEY/SERVICE_ROLE_KEY
├── db/init/                 # scripts que rodam 1x na criação do banco
├── kong/kong.yml            # rotas do gateway (auth/rest/meta/studio)
└── app/                     # Dockerfile + nginx.conf do frontend
```
