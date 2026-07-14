\set ON_ERROR_STOP on

-- Crea o actualiza el rol utilizado por la aplicación.
-- La contraseña se recibe mediante una variable de psql y nunca se almacena aquí.
-- Uso local:
-- psql -d artify_db -v app_user='artify_app' -v app_password='secreto' \
--   -f database/postgresql/app-role.sql

\if :{?app_user}
\else
  \echo 'Falta la variable app_user'
  \quit 1
\endif

\if :{?app_password}
\else
  \echo 'Falta la variable app_password'
  \quit 1
\endif

SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT CONNECTION LIMIT 10',
  :'app_user',
  :'app_password'
)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = :'app_user'
) \gexec

SELECT format(
  'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT CONNECTION LIMIT 10',
  :'app_user',
  :'app_password'
) \gexec

SELECT format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM %I', current_database(), :'app_user')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_user')
\gexec

SELECT format('REVOKE ALL PRIVILEGES ON SCHEMA public FROM %I', :'app_user')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_user')
\gexec

SELECT format(
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
  :'app_user'
) \gexec

SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "USUARIO", "CONFIGURACION", "IMAGEN", "SESION_EDICION", "OPERACION" TO %I',
  :'app_user'
) \gexec

SELECT format(
  'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
  :'app_user'
) \gexec

SELECT format(
  'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'app_user'
) \gexec

SELECT format(
  'GRANT SELECT ON TABLE "v_usuarios_activos" TO %I',
  :'app_user'
) \gexec

SELECT format('ALTER ROLE %I SET search_path = public', :'app_user')
\gexec

SELECT
  rolname,
  rolsuper,
  rolcreatedb,
  rolcreaterole,
  rolreplication,
  rolconnlimit
FROM pg_roles
WHERE rolname = :'app_user';
