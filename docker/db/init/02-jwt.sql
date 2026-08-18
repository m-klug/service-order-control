-- Disponibiliza o JWT secret como GUC do Postgres (usado por funções que
-- verificam/assinam JWT no banco). Mesma configuração do self-host oficial.
\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp `echo "$JWT_EXPIRY"`

ALTER DATABASE postgres SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
