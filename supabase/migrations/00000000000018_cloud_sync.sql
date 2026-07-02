-- =============================================================================
-- Migração 0018 — Sincronização na nuvem (backup + multi-dispositivo)
--
-- Guarda cada coleção local do app (students, diagnosis_sessions, ...) como um
-- documento por usuário. É a rede de segurança contra perda de dados e o que
-- permite usar o sistema em qualquer dispositivo — sem reescrever a UI.
--
-- Privacidade: os dados são de saúde. O acesso é SEMPRE do próprio usuário
-- logado (auth.uid()); a chave anon NÃO acessa nada aqui. As funções
-- SECURITY DEFINER ficam em `public` (sempre exposto) e exigem sessão.
-- =============================================================================

create table if not exists montinho.app_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  collection_key text not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, collection_key)
);

comment on table montinho.app_collections is
  'Backup/sync das coleções locais do app, um documento por usuário (Sprint A — Persistência).';

create index if not exists idx_app_collections_user on montinho.app_collections (user_id);

-- RLS: cada usuário só enxerga o próprio dado (defesa em profundidade, mesmo
-- com o acesso passando pelas funções abaixo).
alter table montinho.app_collections enable row level security;

drop policy if exists "app_collections_own" on montinho.app_collections;
create policy "app_collections_own" on montinho.app_collections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Enviar (upsert) uma coleção do usuário logado ------------------------------
create or replace function public.montinho_sync_push(p_key text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = montinho, public
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  insert into montinho.app_collections (user_id, collection_key, data, updated_at)
  values (auth.uid(), p_key, coalesce(p_data, '[]'::jsonb), now())
  on conflict (user_id, collection_key)
  do update set data = excluded.data, updated_at = now();
end;
$$;

comment on function public.montinho_sync_push(text, jsonb) is
  'Salva (upsert) uma coleção do usuário logado na nuvem.';

-- Baixar todas as coleções do usuário logado ---------------------------------
create or replace function public.montinho_sync_pull()
returns table (collection_key text, data jsonb, updated_at timestamptz)
language sql
security definer
set search_path = montinho, public
as $$
  select collection_key, data, updated_at
  from montinho.app_collections
  where user_id = auth.uid();
$$;

comment on function public.montinho_sync_pull() is
  'Retorna todas as coleções do usuário logado (restauração/multi-dispositivo).';

-- Só usuários logados sincronizam (a chave anon não tem acesso).
grant execute on function public.montinho_sync_push(text, jsonb) to authenticated;
grant execute on function public.montinho_sync_pull() to authenticated;
