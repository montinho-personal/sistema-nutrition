-- =============================================================================
-- Bootstrap para testes locais em PostgreSQL puro (sem Supabase).
--
-- Emula a superfície mínima do Supabase utilizada pelas migrações:
--   • schema auth + tabela auth.users
--   • função auth.uid() (lê o usuário simulado de app.test_uid)
--   • papéis anon / authenticated / service_role (para a migração de grants)
--
-- NUNCA executar em um projeto Supabase real — lá o schema auth e os papéis
-- já existem.
-- =============================================================================

create schema if not exists auth;

-- Papéis do Supabase (nível de cluster; guardados para reexecução idempotente)
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.test_uid', true), '')::uuid;
$$;

create extension if not exists "pgcrypto";
