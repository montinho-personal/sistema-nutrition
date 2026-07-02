-- =============================================================================
-- Migração 0012 — Domain: Knowledge Base (Sprint 1.2)
--
-- Nutrition Knowledge Base (Documento 03G): bibliotecas independentes de
-- conhecimento estruturado — artigos, protocolos, guias e referências
-- científicas. Atualizáveis sem alterar código.
-- =============================================================================

-- kb_articles ---------------------------------------------------------------------
create table montinho.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  summary text,
  content text not null,
  evidence_level text check (evidence_level in ('strong', 'moderate', 'limited', 'expert_opinion')),
  tags text[],
  last_reviewed_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_articles is
  'Artigos da base de conhecimento com nível de evidência (Documento 03G — Biblioteca 10).';

create index idx_kb_articles_category on montinho.kb_articles (category);
create index idx_kb_articles_tags on montinho.kb_articles using gin (tags);

-- kb_protocols ----------------------------------------------------------------------
create table montinho.kb_protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  protocol_type text not null check (protocol_type in (
    'monitoring', 'adjustment', 'plateau', 'low_adherence',
    'excessive_hunger', 'performance_drop', 'other'
  )),
  trigger_conditions text not null,
  steps text not null,
  evidence_level text check (evidence_level in ('strong', 'moderate', 'limited', 'expert_opinion')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_protocols is
  'Banco de Protocolos (Documento 03G — Biblioteca 9): platôs, baixa aderência, excesso de fome...';
comment on column montinho.kb_protocols.trigger_conditions is
  'Quando o protocolo se aplica — ex.: estagnação de peso por 3 semanas com boa adesão.';
comment on column montinho.kb_protocols.steps is
  'Sequência de investigação/ação — ex.: platô: investigar adesão, passos, sono ANTES de reduzir calorias (Documento 03H).';

create index idx_kb_protocols_type on montinho.kb_protocols (protocol_type);

-- kb_food_guides -----------------------------------------------------------------------
create table montinho.kb_food_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null check (context in (
    'travel', 'restaurant', 'delivery', 'weekend', 'work', 'meal_prep',
    'low_budget', 'low_time', 'social_event', 'other'
  )),
  content text not null,
  tags text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_food_guides is
  'Guias de aderência alimentar por contexto (Documento 03G — Biblioteca 5): viagens, restaurantes, delivery...';

create index idx_kb_food_guides_context on montinho.kb_food_guides (context);

-- kb_supplement_guides ---------------------------------------------------------------------
create table montinho.kb_supplement_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  supplement_id uuid references montinho.supplements (id),
  content text not null,
  evidence_level text check (evidence_level in ('strong', 'moderate', 'limited', 'expert_opinion')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_supplement_guides is
  'Guias de suplementação — sempre subordinados à filosofia: alimentação primeiro (Documento 00).';

create index idx_kb_supplement_guides_supplement on montinho.kb_supplement_guides (supplement_id);

-- kb_behavior_guides --------------------------------------------------------------------------
create table montinho.kb_behavior_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  behavior_type text not null check (behavior_type in (
    'binge_eating', 'snacking', 'emotional_hunger', 'night_eating',
    'all_or_nothing', 'low_motivation', 'habit_building', 'other'
  )),
  content text not null,
  strategies text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_behavior_guides is
  'Banco de Comportamento Alimentar (Documento 03G — Biblioteca 4): gatilhos, compulsão, fome emocional...';

create index idx_kb_behavior_guides_type on montinho.kb_behavior_guides (behavior_type);

-- kb_scientific_references ----------------------------------------------------------------------
create table montinho.kb_scientific_references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  journal text,
  publication_year integer check (publication_year between 1900 and 2100),
  doi text,
  url text,
  summary text,
  evidence_level text check (evidence_level in ('strong', 'moderate', 'limited', 'expert_opinion')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.kb_scientific_references is
  'Referências científicas: toda afirmação importante possui origem e nível de evidência (Documento 03G).';

create index idx_kb_scientific_references_year on montinho.kb_scientific_references (publication_year);

-- RLS --------------------------------------------------------------------------------------------
alter table montinho.kb_articles enable row level security;
alter table montinho.kb_protocols enable row level security;
alter table montinho.kb_food_guides enable row level security;
alter table montinho.kb_supplement_guides enable row level security;
alter table montinho.kb_behavior_guides enable row level security;
alter table montinho.kb_scientific_references enable row level security;

create policy "kb_articles_all_authenticated" on montinho.kb_articles
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kb_protocols_all_authenticated" on montinho.kb_protocols
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kb_food_guides_all_authenticated" on montinho.kb_food_guides
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kb_supplement_guides_all_authenticated" on montinho.kb_supplement_guides
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kb_behavior_guides_all_authenticated" on montinho.kb_behavior_guides
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kb_scientific_references_all_authenticated" on montinho.kb_scientific_references
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão -----------------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'kb_articles', 'kb_protocols', 'kb_food_guides',
  'kb_supplement_guides', 'kb_behavior_guides', 'kb_scientific_references'
);
