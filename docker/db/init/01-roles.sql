-- A imagem supabase/postgres já vem com os roles do Supabase (authenticator,
-- supabase_auth_admin, anon, authenticated, service_role, etc.) e os schemas
-- auth/storage pré-criados. Só precisamos definir a senha dos roles que
-- realmente usamos (PostgREST conecta como `authenticator`, GoTrue como
-- `supabase_auth_admin`) para bater com POSTGRES_PASSWORD do .env.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
