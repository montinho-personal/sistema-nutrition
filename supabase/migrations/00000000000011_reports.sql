-- =============================================================================
-- Migração 0011 — Domain: Reports (Sprint 1.2)
--
-- Documentos premium (Documento 02 — Documento Final): relatórios com
-- conteúdo estruturado, versionamento explícito e histórico de exportações.
-- =============================================================================

-- reports -------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  strategy_id uuid references public.strategies (id),
  report_type text not null default 'full_strategy' check (report_type in (
    'full_strategy', 'followup', 'adjustment', 'custom'
  )),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'final', 'archived')),
  content jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.reports is
  'Documentos para o aluno com padrão de consultoria premium (Documento 02): resumo executivo, planos e justificativas.';
comment on column public.reports.content is
  'Conteúdo estruturado do documento (seções, planos, justificativas) em JSON.';

create index idx_reports_student on public.reports (student_id);
create index idx_reports_strategy on public.reports (strategy_id);
create index idx_reports_status on public.reports (status);
create index idx_reports_type on public.reports (report_type);

-- report_versions --------------------------------------------------------------------
create table public.report_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  version_number integer not null,
  content jsonb not null,
  change_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (report_id, version_number)
);

comment on table public.report_versions is
  'Histórico completo do conteúdo de cada relatório — nada é sobrescrito (Documento 10).';

create index idx_report_versions_report on public.report_versions (report_id);

-- Gatilho: snapshot automático em INSERT e UPDATE de reports
create or replace function public.snapshot_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.report_versions
    (report_id, version_number, content, change_reason, created_by)
  values (
    new.id,
    new.version,
    new.content,
    nullif(current_setting('app.change_reason', true), ''),
    auth.uid()
  );
  return new;
end;
$$;

comment on function public.snapshot_report() is
  'Grava snapshot do conteúdo em report_versions a cada insert/update de reports.';

create trigger reports_snapshot
  after insert or update on public.reports
  for each row
  execute function public.snapshot_report();

-- report_exports ------------------------------------------------------------------------
create table public.report_exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  report_version_number integer,
  format text not null default 'pdf' check (format in ('pdf', 'html')),
  storage_path text not null,
  exported_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.report_exports is
  'Arquivos exportados (Supabase Storage) com formato e versão de origem.';

create index idx_report_exports_report on public.report_exports (report_id);

-- RLS ---------------------------------------------------------------------------------------
alter table public.reports enable row level security;
alter table public.report_versions enable row level security;
alter table public.report_exports enable row level security;

create policy "reports_all_authenticated" on public.reports
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "report_versions_all_authenticated" on public.report_versions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "report_exports_all_authenticated" on public.report_exports
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ------------------------------------------------------------------------------
call public.attach_standard_triggers('reports', 'report_versions', 'report_exports');
