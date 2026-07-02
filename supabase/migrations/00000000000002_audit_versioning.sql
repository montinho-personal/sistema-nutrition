-- =============================================================================
-- Migração 0002 — Infraestrutura de auditoria e versionamento (Sprint 1.2)
--
-- • touch_row(): mantém updated_at e incrementa version em todo UPDATE.
-- • audit_log: registro imutável de quem alterou, quando, o quê e por quê
--   (Documento 14 — Auditoria). O motivo é informado pela aplicação via
--   set_config('app.change_reason', ...).
-- • Adiciona a coluna version ao padrão obrigatório (profiles incluída).
-- =============================================================================

-- Padrão obrigatório: version --------------------------------------------------
alter table public.profiles
  add column if not exists version integer not null default 1;

-- touch_row: updated_at + version em todo UPDATE --------------------------------
create or replace function public.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;

comment on function public.touch_row() is
  'Gatilho padrão de UPDATE: atualiza updated_at e incrementa version.';

-- profiles passa a usar touch_row ----------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row
  execute function public.touch_row();

-- Auditoria ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb,
  reason text
);

comment on table public.audit_log is
  'Trilha de auditoria imutável: quem alterou, quando, o que mudou e por quê (Documento 14).';
comment on column public.audit_log.table_name is 'Tabela de origem do registro auditado.';
comment on column public.audit_log.record_id is 'ID (UUID) do registro auditado.';
comment on column public.audit_log.action is 'Ação realizada: insert, update ou delete.';
comment on column public.audit_log.changed_by is 'Usuário (auth.users) que realizou a ação.';
comment on column public.audit_log.old_data is 'Estado anterior da linha (update/delete).';
comment on column public.audit_log.new_data is 'Novo estado da linha (insert/update).';
comment on column public.audit_log.reason is
  'Motivo informado pela aplicação via set_config(''app.change_reason'', ..., true).';

create index if not exists idx_audit_log_record on public.audit_log (table_name, record_id);
create index if not exists idx_audit_log_changed_at on public.audit_log (changed_at);

alter table public.audit_log enable row level security;

-- Leitura para usuários autenticados; inserção apenas via gatilhos;
-- nunca atualizar ou excluir (trilha imutável).
create policy "audit_log_select_authenticated"
  on public.audit_log for select
  using (auth.uid() is not null);

create policy "audit_log_insert_authenticated"
  on public.audit_log for insert
  with check (true);

-- audit_row: gatilho genérico de auditoria --------------------------------------
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  change_reason text := nullif(current_setting('app.change_reason', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (table_name, record_id, action, changed_by, new_data, reason)
    values (tg_table_name, new.id, 'insert', auth.uid(), to_jsonb(new), change_reason);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (table_name, record_id, action, changed_by, old_data, new_data, reason)
    values (tg_table_name, new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new), change_reason);
    return new;
  else
    insert into public.audit_log (table_name, record_id, action, changed_by, old_data, reason)
    values (tg_table_name, old.id, 'delete', auth.uid(), to_jsonb(old), change_reason);
    return old;
  end if;
end;
$$;

comment on function public.audit_row() is
  'Gatilho genérico: grava insert/update/delete no audit_log com autor e motivo.';

-- attach_standard_triggers: aplica touch + auditoria a uma lista de tabelas ------
create or replace procedure public.attach_standard_triggers(variadic table_names text[])
language plpgsql
as $$
declare
  t text;
begin
  foreach t in array table_names loop
    execute format(
      'drop trigger if exists %I on public.%I;
       create trigger %I before update on public.%I
         for each row execute function public.touch_row();',
      t || '_touch', t, t || '_touch', t
    );
    execute format(
      'drop trigger if exists %I on public.%I;
       create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row();',
      t || '_audit', t, t || '_audit', t
    );
  end loop;
end;
$$;

comment on procedure public.attach_standard_triggers(text[]) is
  'Aplica os gatilhos padrão (touch_row + audit_row) às tabelas informadas.';

-- Auditoria retroativa para profiles --------------------------------------------
call public.attach_standard_triggers('profiles');
