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

-- Função padrão de auditoria: mantém updated_at sempre atual ------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Gatilho padrão: atualiza updated_at em toda modificação de linha.';

-- Perfis ----------------------------------------------------------------------
-- Um perfil por usuário do Supabase Auth. Hoje existe apenas o Montinho;
-- a estrutura já suporta múltiplos profissionais no futuro (Documento 08).
create table if not exists public.profiles (
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

comment on table public.profiles is
  'Perfis dos profissionais que utilizam o sistema (Domain: Students/Auth).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Segurança (RLS) --------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário é registrado -----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, created_by, updated_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.id,
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
