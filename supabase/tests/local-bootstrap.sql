-- =============================================================================
-- Bootstrap para testes locais em PostgreSQL puro (sem Supabase).
--
-- Emula a superfície mínima do Supabase utilizada pelas migrações:
--   • schema auth + tabela auth.users
--   • função auth.uid() (lê o usuário simulado de app.test_uid)
--
-- NUNCA executar em um projeto Supabase real — lá o schema auth já existe.
-- =============================================================================

create schema if not exists auth;

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
