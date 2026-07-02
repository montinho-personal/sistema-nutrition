-- =============================================================================
-- Migração 0005 — Domain: Supplements (Sprint 1.2)
--
-- Banco Inteligente de Suplementação (Documento 03G — Biblioteca 3).
-- Suplementos nunca são protagonistas: cada registro carrega indicações,
-- contraindicações, evidência e alternativas alimentares.
-- =============================================================================

-- supplements --------------------------------------------------------------------
create table montinho.supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  objective text not null,
  problem_solved text,
  mechanism text,
  usual_dose text,
  timing text,
  food_alternatives text,
  expected_impact text,
  priority integer not null default 100,
  cost_benefit text check (cost_benefit in ('low', 'medium', 'high')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.supplements is
  'Suplementos com objetivo, mecanismo, dose e alternativas alimentares (Documento 01).';
comment on column montinho.supplements.problem_solved is
  'Qual problema o suplemento resolve — pergunta obrigatória (Documento 00).';
comment on column montinho.supplements.food_alternatives is
  'Alternativas alimentares — sempre avaliadas antes do suplemento.';
comment on column montinho.supplements.priority is 'Menor número = maior prioridade estratégica.';

create index idx_supplements_priority on montinho.supplements (priority);

-- supplement_protocols --------------------------------------------------------------
create table montinho.supplement_protocols (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references montinho.supplements (id) on delete cascade,
  name text not null,
  dose text not null,
  schedule text,
  duration text,
  target_context text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.supplement_protocols is
  'Protocolos de uso por suplemento: dose, horário, duração e contexto-alvo.';

create index idx_supplement_protocols_supplement on montinho.supplement_protocols (supplement_id);

-- supplement_indications ---------------------------------------------------------------
create table montinho.supplement_indications (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references montinho.supplements (id) on delete cascade,
  indication text not null,
  rationale text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.supplement_indications is 'Quando considerar cada suplemento.';

create index idx_supplement_indications_supplement
  on montinho.supplement_indications (supplement_id);

-- supplement_contraindications ----------------------------------------------------------
create table montinho.supplement_contraindications (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references montinho.supplements (id) on delete cascade,
  contraindication text not null,
  severity text not null default 'moderate'
    check (severity in ('mild', 'moderate', 'severe')),
  rationale text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.supplement_contraindications is
  'Quando evitar cada suplemento, com severidade — segurança primeiro (Documento 03G).';

create index idx_supplement_contraindications_supplement
  on montinho.supplement_contraindications (supplement_id);

-- supplement_evidence ---------------------------------------------------------------------
create table montinho.supplement_evidence (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references montinho.supplements (id) on delete cascade,
  evidence_level text not null
    check (evidence_level in ('strong', 'moderate', 'limited', 'expert_opinion')),
  summary text not null,
  reference_url text,
  reviewed_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.supplement_evidence is
  'Nível de evidência científica por suplemento — nunca prescrever por moda (Documento 00).';

create index idx_supplement_evidence_supplement on montinho.supplement_evidence (supplement_id);
create index idx_supplement_evidence_level on montinho.supplement_evidence (evidence_level);

-- RLS ---------------------------------------------------------------------------------------
alter table montinho.supplements enable row level security;
alter table montinho.supplement_protocols enable row level security;
alter table montinho.supplement_indications enable row level security;
alter table montinho.supplement_contraindications enable row level security;
alter table montinho.supplement_evidence enable row level security;

create policy "supplements_all_authenticated" on montinho.supplements
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "supplement_protocols_all_authenticated" on montinho.supplement_protocols
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "supplement_indications_all_authenticated" on montinho.supplement_indications
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "supplement_contraindications_all_authenticated" on montinho.supplement_contraindications
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "supplement_evidence_all_authenticated" on montinho.supplement_evidence
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão -----------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'supplements', 'supplement_protocols', 'supplement_indications',
  'supplement_contraindications', 'supplement_evidence'
);
