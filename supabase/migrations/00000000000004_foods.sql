-- =============================================================================
-- Migração 0004 — Domain: Foods (Sprint 1.2)
--
-- Banco Inteligente de Alimentos (Documento 03G — Biblioteca 2):
-- composição nutricional com origem rastreável (TBCA → TACO → outras),
-- atributos estratégicos além dos macros, medidas caseiras, substituições
-- e tags. Biblioteca independente: evolui sem alterar código.
-- =============================================================================

-- food_sources: origem dos dados nutricionais ------------------------------------
create table public.food_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  priority integer not null default 100,
  url text,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.food_sources is
  'Fontes de composição nutricional. Prioridade: TBCA(1) → TACO(2) → internacionais → estimativa (Documento 00).';
comment on column public.food_sources.priority is 'Menor número = maior prioridade de uso.';

-- food_categories -----------------------------------------------------------------
create table public.food_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  parent_id uuid references public.food_categories (id),
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.food_categories is
  'Categorias hierárquicas de alimentos (grupo alimentar e subgrupos).';

create index idx_food_categories_parent on public.food_categories (parent_id);

-- foods -----------------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.food_categories (id),
  source_id uuid references public.food_sources (id),
  source_code text,
  energy_kcal numeric(7, 2) check (energy_kcal >= 0),
  protein_g numeric(6, 2) check (protein_g >= 0),
  carbs_g numeric(6, 2) check (carbs_g >= 0),
  fat_g numeric(6, 2) check (fat_g >= 0),
  fiber_g numeric(6, 2) check (fiber_g >= 0),
  micronutrients jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (name, source_id)
);

comment on table public.foods is
  'Alimentos com composição por 100 g e origem rastreável — nunca inventar dados nutricionais (Documento 00).';
comment on column public.foods.source_code is 'Código do alimento na fonte (ex.: ID TBCA/TACO).';
comment on column public.foods.micronutrients is 'Micronutrientes por 100 g — ex.: {"sodium_mg": 120}.';

create index idx_foods_category on public.foods (category_id);
create index idx_foods_source on public.foods (source_id);
create index idx_foods_name on public.foods using gin (to_tsvector('portuguese', name));

-- food_attributes: inteligência estratégica (1:1 com foods) --------------------------
create table public.food_attributes (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null unique references public.foods (id) on delete cascade,
  satiety_score integer check (satiety_score between 0 and 100),
  practicality_score integer check (practicality_score between 0 and 100),
  digestibility_score integer check (digestibility_score between 0 and 100),
  prep_time_minutes integer check (prep_time_minutes >= 0),
  freezes_well boolean,
  portability boolean,
  purchase_ease integer check (purchase_ease between 0 and 100),
  cost_range text check (cost_range in ('low', 'medium', 'high')),
  best_times text[],
  suitable_goals text[],
  strategic_applications text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.food_attributes is
  'Atributos além dos macros (Documento 01): saciedade, praticidade, custo, portabilidade, aplicações.';
comment on column public.food_attributes.best_times is
  'Melhores momentos de uso — ex.: {breakfast, pre_workout, night}.';
comment on column public.food_attributes.suitable_goals is
  'Objetivos em que costuma ser útil — ex.: {weight_loss, hypertrophy}.';

-- food_portions: medidas caseiras -------------------------------------------------------
create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  name text not null,
  grams numeric(7, 2) not null check (grams > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (food_id, name)
);

comment on table public.food_portions is
  'Medidas caseiras por alimento — ex.: "colher de sopa" = 25 g.';

create index idx_food_portions_food on public.food_portions (food_id);

-- food_substitutions ----------------------------------------------------------------------
create table public.food_substitutions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  substitute_food_id uuid not null references public.foods (id) on delete cascade,
  ratio numeric(6, 3) not null default 1 check (ratio > 0),
  context text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  check (food_id <> substitute_food_id),
  unique (food_id, substitute_food_id)
);

comment on table public.food_substitutions is
  'Substituições equivalentes entre alimentos, com proporção e contexto de uso.';
comment on column public.food_substitutions.ratio is
  'Proporção em gramas: 100 g do original ≈ ratio × 100 g do substituto.';

create index idx_food_substitutions_food on public.food_substitutions (food_id);

-- food_tags + atribuições -------------------------------------------------------------------
create table public.food_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.food_tags is
  'Tags estratégicas — ex.: "bom para marmitas", "bom para viagens" (Documento 01).';

create table public.food_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  tag_id uuid not null references public.food_tags (id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (food_id, tag_id)
);

comment on table public.food_tag_assignments is 'Associação N:N entre alimentos e tags.';

create index idx_food_tag_assignments_food on public.food_tag_assignments (food_id);
create index idx_food_tag_assignments_tag on public.food_tag_assignments (tag_id);

-- RLS -------------------------------------------------------------------------------------
alter table public.food_sources enable row level security;
alter table public.food_categories enable row level security;
alter table public.foods enable row level security;
alter table public.food_attributes enable row level security;
alter table public.food_portions enable row level security;
alter table public.food_substitutions enable row level security;
alter table public.food_tags enable row level security;
alter table public.food_tag_assignments enable row level security;

create policy "food_sources_all_authenticated" on public.food_sources
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_categories_all_authenticated" on public.food_categories
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "foods_all_authenticated" on public.foods
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_attributes_all_authenticated" on public.food_attributes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_portions_all_authenticated" on public.food_portions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_substitutions_all_authenticated" on public.food_substitutions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_tags_all_authenticated" on public.food_tags
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "food_tag_assignments_all_authenticated" on public.food_tag_assignments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ---------------------------------------------------------------------------
call public.attach_standard_triggers(
  'food_sources', 'food_categories', 'foods', 'food_attributes',
  'food_portions', 'food_substitutions', 'food_tags', 'food_tag_assignments'
);

-- Fontes iniciais (Documento 00 — prioridade de composição nutricional) ----------------------
insert into public.food_sources (name, priority, url, description) values
  ('TBCA', 1, 'https://www.tbca.net.br/',
   'Tabela Brasileira de Composição de Alimentos (USP) — fonte prioritária.'),
  ('TACO', 2, 'https://nepa.unicamp.br/publicacoes/tabela-taco/',
   'Tabela Brasileira de Composição de Alimentos (NEPA/Unicamp) — segunda prioridade.'),
  ('USDA', 3, 'https://fdc.nal.usda.gov/',
   'USDA FoodData Central — base internacional reconhecida.'),
  ('Estimativa', 99, null,
   'Estimativa profissional — utilizar apenas quando inevitável (Documento 00).');
