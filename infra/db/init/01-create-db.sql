-- supabase/postgres creates POSTGRES_DB owned by supabase_admin, and `postgres`
-- has no CREATE on its public schema. Create app DBs owned by `postgres` instead.
-- Mounted as zz-*.sql so it runs after the image's own migrate.sh.
SELECT 'CREATE DATABASE transactions OWNER postgres'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'transactions')\gexec

SELECT 'CREATE DATABASE transactions_test OWNER postgres'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'transactions_test')\gexec
