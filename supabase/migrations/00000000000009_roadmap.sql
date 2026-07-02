-- =============================================================================
-- Migração 0009 — Domain: Roadmap (Sprint 1.2)
--
-- Transformation Roadmap Engine (Documento 03E): a jornada em 7 fases,
-- eventos especiais com planejamento antecipado e ajustes de percurso.
-- =============================================================================

-- roadmaps -----------------------------------------------------------------------
create table montinho.roadmaps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references montinho.students (id) on delete cascade,
  strategy_id uuid references montinho.strategies (id),
  objective text not null,
  current_phase text check (current_phase in (
    'diagnosis', 'preparation', 'implementation', 'consolidation',
    'optimization', 'transition', 'maintenance'
  )),
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.roadmaps is
  'Jornada de transformação do aluno (Documento 03E) — o sistema entrega um caminho, não uma dieta.';
comment on column montinho.roadmaps.current_phase is
  'Fase atual entre as 7 fases da transformação (Documento 03E).';

create index idx_roadmaps_student on montinho.roadmaps (student_id);
create index idx_roadmaps_strategy on montinho.roadmaps (strategy_id);
create index idx_roadmaps_status on montinho.roadmaps (status);

-- roadmap_phases --------------------------------------------------------------------
create table montinho.roadmap_phases (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references montinho.roadmaps (id) on delete cascade,
  phase text not null check (phase in (
    'diagnosis', 'preparation', 'implementation', 'consolidation',
    'optimization', 'transition', 'maintenance'
  )),
  position integer not null check (position >= 1),
  objective text not null,
  success_criteria text,
  starts_at date,
  ends_at date,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'skipped')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (roadmap_id, position)
);

comment on table montinho.roadmap_phases is
  'Fases planejadas do roadmap. A evolução nunca acontece apenas pelo tempo — segue critérios (Documento 03E).';
comment on column montinho.roadmap_phases.success_criteria is
  'Indicadores que definem o sucesso e autorizam a evolução de fase.';
comment on column montinho.roadmap_phases.status is
  'Nem todo aluno passa por todas as fases — skipped é estado legítimo.';

create index idx_roadmap_phases_roadmap on montinho.roadmap_phases (roadmap_id);
create index idx_roadmap_phases_status on montinho.roadmap_phases (status);

-- roadmap_events ------------------------------------------------------------------------
create table montinho.roadmap_events (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references montinho.roadmaps (id) on delete cascade,
  event_type text not null check (event_type in (
    'travel', 'vacation', 'carnival', 'christmas', 'new_year', 'wedding',
    'birthday', 'competition', 'work_change', 'relocation', 'other'
  )),
  name text not null,
  event_date date,
  preparation_plan text,
  impact_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.roadmap_events is
  'Eventos especiais (Documento 03E): o sistema prepara o aluno antecipadamente — nunca apenas reage.';
comment on column montinho.roadmap_events.preparation_plan is
  'Plano antecipado construído antes do evento.';

create index idx_roadmap_events_roadmap on montinho.roadmap_events (roadmap_id);
create index idx_roadmap_events_date on montinho.roadmap_events (event_date);

-- roadmap_adjustments ----------------------------------------------------------------------
create table montinho.roadmap_adjustments (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references montinho.roadmaps (id) on delete cascade,
  phase_id uuid references montinho.roadmap_phases (id),
  adjustment text not null,
  reason text not null,
  expected_impact text,
  applied_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.roadmap_adjustments is
  'Ajustes de percurso com motivo e impacto esperado — toda decisão justificada (Documento 00).';

create index idx_roadmap_adjustments_roadmap on montinho.roadmap_adjustments (roadmap_id);

-- RLS -----------------------------------------------------------------------------------------
alter table montinho.roadmaps enable row level security;
alter table montinho.roadmap_phases enable row level security;
alter table montinho.roadmap_events enable row level security;
alter table montinho.roadmap_adjustments enable row level security;

create policy "roadmaps_all_authenticated" on montinho.roadmaps
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "roadmap_phases_all_authenticated" on montinho.roadmap_phases
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "roadmap_events_all_authenticated" on montinho.roadmap_events
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "roadmap_adjustments_all_authenticated" on montinho.roadmap_adjustments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão --------------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'roadmaps', 'roadmap_phases', 'roadmap_events', 'roadmap_adjustments'
);
