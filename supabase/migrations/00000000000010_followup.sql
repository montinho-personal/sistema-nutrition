-- =============================================================================
-- Migração 0010 — Domain: Follow Up (Sprint 1.2)
--
-- Acompanhamentos (Documentos 01, 05): monitoramento contínuo com
-- indicadores da jornada, respostas estruturadas, ajustes realizados e
-- progresso por métrica — alimenta o Personal Nutrition Intelligence.
-- =============================================================================

-- followups ---------------------------------------------------------------------
create table montinho.followups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references montinho.students (id) on delete cascade,
  strategy_id uuid references montinho.strategies (id),
  followup_date date not null default current_date,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  adherence_score integer check (adherence_score between 0 and 100),
  hunger_score integer check (hunger_score between 0 and 100),
  sleep_score integer check (sleep_score between 0 and 100),
  energy_score integer check (energy_score between 0 and 100),
  mood_score integer check (mood_score between 0 and 100),
  summary text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.followups is
  'Acompanhamento periódico: peso, adesão, fome, sono, energia e humor (Documento 03E — Indicadores da Jornada).';

create index idx_followups_student on montinho.followups (student_id);
create index idx_followups_strategy on montinho.followups (strategy_id);
create index idx_followups_date on montinho.followups (followup_date);

-- followup_answers -----------------------------------------------------------------
create table montinho.followup_answers (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references montinho.followups (id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (followup_id, question_key)
);

comment on table montinho.followup_answers is
  'Respostas estruturadas do acompanhamento — o que funcionou, o que não funcionou, por quê (Documento 05).';

create index idx_followup_answers_followup on montinho.followup_answers (followup_id);

-- followup_adjustments ----------------------------------------------------------------
create table montinho.followup_adjustments (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references montinho.followups (id) on delete cascade,
  adjustment text not null,
  reason text not null,
  expected_impact text,
  observed_result text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.followup_adjustments is
  'Ajustes realizados: alteração, motivo, impacto esperado e resultado observado (Documento 10).';
comment on column montinho.followup_adjustments.observed_result is
  'Preenchido no acompanhamento seguinte — fecha o ciclo de aprendizado (Documento 05).';

create index idx_followup_adjustments_followup on montinho.followup_adjustments (followup_id);

-- followup_progress ---------------------------------------------------------------------
create table montinho.followup_progress (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references montinho.followups (id) on delete cascade,
  metric_key text not null,
  metric_value numeric(10, 2) not null,
  metric_unit text,
  trend text check (trend in ('improving', 'stable', 'worsening')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (followup_id, metric_key)
);

comment on table montinho.followup_progress is
  'Progresso por métrica (força, medidas, performance...) com tendência interpretada.';

create index idx_followup_progress_followup on montinho.followup_progress (followup_id);
create index idx_followup_progress_metric on montinho.followup_progress (metric_key);

-- RLS -------------------------------------------------------------------------------------
alter table montinho.followups enable row level security;
alter table montinho.followup_answers enable row level security;
alter table montinho.followup_adjustments enable row level security;
alter table montinho.followup_progress enable row level security;

create policy "followups_all_authenticated" on montinho.followups
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "followup_answers_all_authenticated" on montinho.followup_answers
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "followup_adjustments_all_authenticated" on montinho.followup_adjustments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "followup_progress_all_authenticated" on montinho.followup_progress
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ----------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'followups', 'followup_answers', 'followup_adjustments', 'followup_progress'
);
