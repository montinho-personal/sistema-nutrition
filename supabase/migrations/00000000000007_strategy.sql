-- =============================================================================
-- Migração 0007 — Domain: Strategy (Sprint 1.2)
--
-- Estratégia Nutricional (Documentos 04, 03C, 03H): a estratégia escolhida,
-- versionamento automático com snapshot, alternativas descartadas, o Banco
-- de Decisões (Documento 01) e as validações do Conselho Estratégico.
-- =============================================================================

-- strategies -----------------------------------------------------------------------
create table montinho.strategies (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references montinho.students (id) on delete cascade,
  diagnosis_session_id uuid references montinho.diagnosis_sessions (id),
  objective text not null,
  speed text check (speed in (
    'very_conservative', 'conservative', 'moderate', 'intensive', 'aggressive'
  )),
  food_philosophy text,
  flexibility_level text check (flexibility_level in ('low', 'moderate', 'high', 'planned')),
  meals_per_day integer check (meals_per_day between 1 and 10),
  justification text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  starts_at date,
  ends_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.strategies is
  'Estratégia Nutricional (Documento 04): objetivo, velocidade, filosofia alimentar, flexibilidade e justificativa. Sempre nasce de um diagnóstico.';
comment on column montinho.strategies.speed is
  'Velocidade da transformação (Documento 04 — Etapa 2), sempre justificada.';
comment on column montinho.strategies.food_philosophy is
  'Abordagem alimentar escolhida — ex.: traditional_plan, portion_method, macro_counting.';
comment on column montinho.strategies.meals_per_day is
  'Refeições que maximizam aderência — nunca número teórico fixo (Documento 04 — Etapa 5).';

create index idx_strategies_student on montinho.strategies (student_id);
create index idx_strategies_diagnosis on montinho.strategies (diagnosis_session_id);
create index idx_strategies_status on montinho.strategies (status);
create index idx_strategies_created_at on montinho.strategies (created_at);

-- strategy_versions: histórico automático via gatilho ---------------------------------
create table montinho.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references montinho.strategies (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (strategy_id, version_number)
);

comment on table montinho.strategy_versions is
  'Snapshot completo da estratégia a cada alteração — nenhum plano é sobrescrito (Documento 10).';
comment on column montinho.strategy_versions.snapshot is 'Estado completo da linha em JSON.';

create index idx_strategy_versions_strategy on montinho.strategy_versions (strategy_id);

-- Gatilho: snapshot automático em INSERT e UPDATE de strategies
create or replace function montinho.snapshot_strategy()
returns trigger
language plpgsql
security definer set search_path = montinho
as $$
begin
  insert into montinho.strategy_versions
    (strategy_id, version_number, snapshot, change_reason, created_by)
  values (
    new.id,
    new.version,
    to_jsonb(new),
    nullif(current_setting('montinho.change_reason', true), ''),
    auth.uid()
  );
  return new;
end;
$$;

comment on function montinho.snapshot_strategy() is
  'Grava snapshot em strategy_versions a cada insert/update de strategies.';

create trigger strategies_snapshot
  after insert or update on montinho.strategies
  for each row
  execute function montinho.snapshot_strategy();

-- strategy_alternatives -------------------------------------------------------------------
create table montinho.strategy_alternatives (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references montinho.strategies (id) on delete cascade,
  name text not null,
  description text,
  rejection_reason text not null,
  adherence_probability integer check (adherence_probability between 0 and 100),
  risks text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.strategy_alternatives is
  'Estratégias analisadas e descartadas, com motivo — transparência obrigatória (Documento 01).';

create index idx_strategy_alternatives_strategy on montinho.strategy_alternatives (strategy_id);

-- strategy_decisions: o Banco de Decisões -----------------------------------------------------
create table montinho.strategy_decisions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references montinho.strategies (id) on delete cascade,
  decision_key text not null,
  problem text not null,
  decision text not null,
  justification text not null,
  alternatives_considered text,
  risks text,
  mitigation text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.strategy_decisions is
  'Banco de Decisões (Documento 01): problema encontrado, estratégia escolhida, justificativa e alternativas descartadas.';
comment on column montinho.strategy_decisions.decision_key is
  'Etapa da prescrição (Documento 04) — ex.: speed, hunger_strategy, weekend_strategy, plan_b.';

create index idx_strategy_decisions_strategy on montinho.strategy_decisions (strategy_id);
create index idx_strategy_decisions_key on montinho.strategy_decisions (decision_key);

-- strategy_validations: autocrítica do Conselho Estratégico -----------------------------------
create table montinho.strategy_validations (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references montinho.strategies (id) on delete cascade,
  validation_key text not null check (validation_key in (
    'simpler_option', 'more_sustainable', 'cheaper', 'more_practical',
    'higher_adherence', 'better_evidence', 'safer', 'more_compatible'
  )),
  passed boolean not null,
  rationale text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (strategy_id, validation_key)
);

comment on table montinho.strategy_validations is
  'Checklist de autocrítica antes da decisão final (Documentos 03C e 04): existe opção mais simples/sustentável/barata/prática/aderente?';

create index idx_strategy_validations_strategy on montinho.strategy_validations (strategy_id);

-- RLS --------------------------------------------------------------------------------------------
alter table montinho.strategies enable row level security;
alter table montinho.strategy_versions enable row level security;
alter table montinho.strategy_alternatives enable row level security;
alter table montinho.strategy_decisions enable row level security;
alter table montinho.strategy_validations enable row level security;

create policy "strategies_all_authenticated" on montinho.strategies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_versions_all_authenticated" on montinho.strategy_versions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_alternatives_all_authenticated" on montinho.strategy_alternatives
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_decisions_all_authenticated" on montinho.strategy_decisions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_validations_all_authenticated" on montinho.strategy_validations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ----------------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'strategies', 'strategy_versions', 'strategy_alternatives',
  'strategy_decisions', 'strategy_validations'
);
