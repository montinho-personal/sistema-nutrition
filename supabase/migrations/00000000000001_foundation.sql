-- =============================================================================
-- Migração 0001 — Fundação (Sprint 1.1)
--
-- Documento 10 — Database Architecture V1:
--   • Chaves primárias UUID.
--   • Campos de auditoria em todas as tabelas.
--   • Soft delete via is_active.
--   • Estrutura preparada para múltiplos usuários.
--
-- Esta migração cria apenas a estrutura inicial: extensões, o gatilho
-- padrão de updated_at e a tabela de perfis vinculada ao Supabase Auth.
-- As tabelas de domínio chegam nas próximas sprints, cada uma em sua
-- própria migração.
-- =============================================================================

-- Extensões -------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Schema dedicado -------------------------------------------------------------
-- Todo o sistema vive no schema `montinho`, nunca no `public`. Isso permite
-- instalar o Montinho Nutrition Strategy dentro de um projeto Supabase que já
-- hospeda outros apps, sem colisão de nomes (uso pessoal, sem custo extra).
create schema if not exists montinho;

-- Função padrão de auditoria: mantém updated_at sempre atual ------------------
create or replace function montinho.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function montinho.set_updated_at() is
  'Gatilho padrão: atualiza updated_at em toda modificação de linha.';

-- Perfis ----------------------------------------------------------------------
-- Um perfil por usuário do Supabase Auth. Hoje existe apenas o Montinho;
-- a estrutura já suporta múltiplos profissionais no futuro (Documento 08).
create table if not exists montinho.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'professional',

  -- Padrão obrigatório de auditoria (Documento 10)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  notes text
);

comment on table montinho.profiles is
  'Perfis dos profissionais que utilizam o sistema (Domain: Students/Auth).';

create trigger profiles_set_updated_at
  before update on montinho.profiles
  for each row
  execute function montinho.set_updated_at();

-- Segurança (RLS) --------------------------------------------------------------
alter table montinho.profiles enable row level security;

create policy "profiles_select_own"
  on montinho.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on montinho.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário é registrado -----------------
create or replace function montinho.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = montinho
as $$
begin
  insert into montinho.profiles (id, full_name, created_by, updated_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.id,
    new.id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Gatilho com nome ÚNICO (sufixo _montinho): num projeto Supabase compartilhado
-- com outros apps, jamais dropar/sobrescrever o gatilho de signup alheio.
drop trigger if exists on_auth_user_created_montinho on auth.users;
create trigger on_auth_user_created_montinho
  after insert on auth.users
  for each row
  execute function montinho.handle_new_user();
