-- =============================================================================
-- Migração 0007 — Domain: Strategy (Sprint 1.2)
--
-- Estratégia Nutricional (Documentos 04, 03C, 03H): a estratégia escolhida,
-- versionamento automático com snapshot, alternativas descartadas, o Banco
-- de Decisões (Documento 01) e as validações do Conselho Estratégico.
-- =============================================================================

-- strategies -----------------------------------------------------------------------
create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  diagnosis_session_id uuid references public.diagnosis_sessions (id),
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

comment on table public.strategies is
  'Estratégia Nutricional (Documento 04): objetivo, velocidade, filosofia alimentar, flexibilidade e justificativa. Sempre nasce de um diagnóstico.';
comment on column public.strategies.speed is
  'Velocidade da transformação (Documento 04 — Etapa 2), sempre justificada.';
comment on column public.strategies.food_philosophy is
  'Abordagem alimentar escolhida — ex.: traditional_plan, portion_method, macro_counting.';
comment on column public.strategies.meals_per_day is
  'Refeições que maximizam aderência — nunca número teórico fixo (Documento 04 — Etapa 5).';

create index idx_strategies_student on public.strategies (student_id);
create index idx_strategies_diagnosis on public.strategies (diagnosis_session_id);
create index idx_strategies_status on public.strategies (status);
create index idx_strategies_created_at on public.strategies (created_at);

-- strategy_versions: histórico automático via gatilho ---------------------------------
create table public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
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

comment on table public.strategy_versions is
  'Snapshot completo da estratégia a cada alteração — nenhum plano é sobrescrito (Documento 10).';
comment on column public.strategy_versions.snapshot is 'Estado completo da linha em JSON.';

create index idx_strategy_versions_strategy on public.strategy_versions (strategy_id);

-- Gatilho: snapshot automático em INSERT e UPDATE de strategies
create or replace function public.snapshot_strategy()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.strategy_versions
    (strategy_id, version_number, snapshot, change_reason, created_by)
  values (
    new.id,
    new.version,
    to_jsonb(new),
    nullif(current_setting('app.change_reason', true), ''),
    auth.uid()
  );
  return new;
end;
$$;

comment on function public.snapshot_strategy() is
  'Grava snapshot em strategy_versions a cada insert/update de strategies.';

create trigger strategies_snapshot
  after insert or update on public.strategies
  for each row
  execute function public.snapshot_strategy();

-- strategy_alternatives -------------------------------------------------------------------
create table public.strategy_alternatives (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
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

comment on table public.strategy_alternatives is
  'Estratégias analisadas e descartadas, com motivo — transparência obrigatória (Documento 01).';

create index idx_strategy_alternatives_strategy on public.strategy_alternatives (strategy_id);

-- strategy_decisions: o Banco de Decisões -----------------------------------------------------
create table public.strategy_decisions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
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

comment on table public.strategy_decisions is
  'Banco de Decisões (Documento 01): problema encontrado, estratégia escolhida, justificativa e alternativas descartadas.';
comment on column public.strategy_decisions.decision_key is
  'Etapa da prescrição (Documento 04) — ex.: speed, hunger_strategy, weekend_strategy, plan_b.';

create index idx_strategy_decisions_strategy on public.strategy_decisions (strategy_id);
create index idx_strategy_decisions_key on public.strategy_decisions (decision_key);

-- strategy_validations: autocrítica do Conselho Estratégico -----------------------------------
create table public.strategy_validations (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
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

comment on table public.strategy_validations is
  'Checklist de autocrítica antes da decisão final (Documentos 03C e 04): existe opção mais simples/sustentável/barata/prática/aderente?';

create index idx_strategy_validations_strategy on public.strategy_validations (strategy_id);

-- RLS --------------------------------------------------------------------------------------------
alter table public.strategies enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.strategy_alternatives enable row level security;
alter table public.strategy_decisions enable row level security;
alter table public.strategy_validations enable row level security;

create policy "strategies_all_authenticated" on public.strategies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_versions_all_authenticated" on public.strategy_versions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_alternatives_all_authenticated" on public.strategy_alternatives
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_decisions_all_authenticated" on public.strategy_decisions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "strategy_validations_all_authenticated" on public.strategy_validations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ----------------------------------------------------------------------------------
call public.attach_standard_triggers(
  'strategies', 'strategy_versions', 'strategy_alternatives',
  'strategy_decisions', 'strategy_validations'
);
