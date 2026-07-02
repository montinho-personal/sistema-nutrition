-- =============================================================================
-- Migração 0008 — Domain: Nutrition (Sprint 1.2)
--
-- Estrutura nutricional derivada da estratégia (Documento 00 — a dieta é
-- consequência): alvos nutricionais, planos de macros por tipo de dia,
-- estrutura de refeições, itens, substituições e observações.
-- =============================================================================

-- nutrition_targets ------------------------------------------------------------------
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
  target_key text not null,
  target_value numeric(8, 2) not null,
  target_unit text not null,
  justification text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (strategy_id, target_key)
);

comment on table public.nutrition_targets is
  'Alvos nutricionais estratégicos por estratégia — ex.: protein_g_per_kg = 2.0. Parâmetros sempre configuráveis (Documento 08).';
comment on column public.nutrition_targets.target_key is
  'Identificador do alvo — ex.: protein_g_per_kg, deficit_pct, fiber_g_per_day.';

create index idx_nutrition_targets_strategy on public.nutrition_targets (strategy_id);

-- macro_plans ---------------------------------------------------------------------------
create table public.macro_plans (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies (id) on delete cascade,
  plan_type text not null default 'standard' check (plan_type in (
    'standard', 'training_day', 'rest_day', 'refeed', 'diet_break', 'weekend', 'travel'
  )),
  calories_kcal integer check (calories_kcal > 0),
  protein_g numeric(6, 1) check (protein_g >= 0),
  carbs_g numeric(6, 1) check (carbs_g >= 0),
  fat_g numeric(6, 1) check (fat_g >= 0),
  fiber_g numeric(6, 1) check (fiber_g >= 0),
  justification text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (strategy_id, plan_type)
);

comment on table public.macro_plans is
  'Plano de macros por tipo de dia (Documento 10) — nenhum cálculo sem justificativa (Documento 01).';

create index idx_macro_plans_strategy on public.macro_plans (strategy_id);

-- meal_structures ---------------------------------------------------------------------------
create table public.meal_structures (
  id uuid primary key default gen_random_uuid(),
  macro_plan_id uuid not null references public.macro_plans (id) on delete cascade,
  position integer not null check (position >= 1),
  name text not null,
  scheduled_time time,
  objective text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (macro_plan_id, position)
);

comment on table public.meal_structures is
  'Refeições do plano: ordem, horário e objetivo de cada refeição (Documento 10).';
comment on column public.meal_structures.objective is
  'Papel estratégico da refeição — ex.: saciedade noturna, pré-treino.';

create index idx_meal_structures_plan on public.meal_structures (macro_plan_id);

-- meal_items ------------------------------------------------------------------------------------
create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_structure_id uuid not null references public.meal_structures (id) on delete cascade,
  food_id uuid not null references public.foods (id),
  quantity_grams numeric(7, 2) not null check (quantity_grams > 0),
  household_measure text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.meal_items is
  'Alimentos de cada refeição com quantidade em gramas e medida caseira.';

create index idx_meal_items_meal on public.meal_items (meal_structure_id);
create index idx_meal_items_food on public.meal_items (food_id);

-- meal_substitutions ------------------------------------------------------------------------------
create table public.meal_substitutions (
  id uuid primary key default gen_random_uuid(),
  meal_item_id uuid not null references public.meal_items (id) on delete cascade,
  substitute_food_id uuid not null references public.foods (id),
  quantity_grams numeric(7, 2) not null check (quantity_grams > 0),
  household_measure text,
  reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.meal_substitutions is
  'Substituições por item da refeição — flexibilidade planejada a serviço da aderência.';

create index idx_meal_substitutions_item on public.meal_substitutions (meal_item_id);
create index idx_meal_substitutions_food on public.meal_substitutions (substitute_food_id);

-- meal_notes ---------------------------------------------------------------------------------------
create table public.meal_notes (
  id uuid primary key default gen_random_uuid(),
  meal_structure_id uuid not null references public.meal_structures (id) on delete cascade,
  note_type text not null default 'general'
    check (note_type in ('general', 'preparation', 'timing', 'behavior')),
  content text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.meal_notes is
  'Observações estratégicas por refeição: preparo, horário, comportamento.';

create index idx_meal_notes_meal on public.meal_notes (meal_structure_id);

-- RLS -----------------------------------------------------------------------------------------------
alter table public.nutrition_targets enable row level security;
alter table public.macro_plans enable row level security;
alter table public.meal_structures enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_substitutions enable row level security;
alter table public.meal_notes enable row level security;

create policy "nutrition_targets_all_authenticated" on public.nutrition_targets
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "macro_plans_all_authenticated" on public.macro_plans
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meal_structures_all_authenticated" on public.meal_structures
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meal_items_all_authenticated" on public.meal_items
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meal_substitutions_all_authenticated" on public.meal_substitutions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "meal_notes_all_authenticated" on public.meal_notes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão --------------------------------------------------------------------------------------
call public.attach_standard_triggers(
  'nutrition_targets', 'macro_plans', 'meal_structures',
  'meal_items', 'meal_substitutions', 'meal_notes'
);
