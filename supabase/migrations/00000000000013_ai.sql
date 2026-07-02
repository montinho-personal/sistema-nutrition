-- =============================================================================
-- Migração 0013 — Domain: AI (Sprint 1.2)
--
-- Preparação para IA (Documento 14): prompts versionados, saídas com
-- metadados de execução, logs de raciocínio e recomendações rastreáveis.
-- Estrutura criada agora, utilizada nas sprints de inteligência.
-- Independente de provedor (Documento 08).
-- =============================================================================

-- ai_prompts ------------------------------------------------------------------------
create table montinho.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  objective text not null,
  inputs jsonb,
  outputs jsonb,
  current_version integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.ai_prompts is
  'Catálogo de prompts (Documento 11): nome, objetivo, entradas e saídas. O template vive em ai_prompt_versions.';
comment on column montinho.ai_prompts.inputs is 'Descrição estruturada das entradas esperadas.';
comment on column montinho.ai_prompts.outputs is 'Descrição estruturada das saídas esperadas.';

-- ai_prompt_versions -------------------------------------------------------------------
create table montinho.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references montinho.ai_prompts (id) on delete cascade,
  version_number integer not null,
  template text not null,
  change_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (prompt_id, version_number)
);

comment on table montinho.ai_prompt_versions is
  'Histórico de versões de cada prompt — todo prompt possui versão e histórico (Documento 11).';

create index idx_ai_prompt_versions_prompt on montinho.ai_prompt_versions (prompt_id);

-- ai_outputs -------------------------------------------------------------------------------
create table montinho.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references montinho.ai_prompts (id),
  prompt_version_number integer,
  student_id uuid references montinho.students (id) on delete cascade,
  context jsonb,
  output jsonb not null,
  model text,
  tokens_input integer check (tokens_input >= 0),
  tokens_output integer check (tokens_output >= 0),
  latency_ms integer check (latency_ms >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.ai_outputs is
  'Execuções de IA com contexto, saída e metadados (modelo, tokens, latência) — auditáveis (Documento 03G).';
comment on column montinho.ai_outputs.model is 'Identificador do modelo — arquitetura independente de provedor.';

create index idx_ai_outputs_prompt on montinho.ai_outputs (prompt_id);
create index idx_ai_outputs_student on montinho.ai_outputs (student_id);
create index idx_ai_outputs_created_at on montinho.ai_outputs (created_at);

-- ai_reasoning_logs ----------------------------------------------------------------------------
create table montinho.ai_reasoning_logs (
  id uuid primary key default gen_random_uuid(),
  ai_output_id uuid not null references montinho.ai_outputs (id) on delete cascade,
  step integer not null check (step >= 1),
  reasoning text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (ai_output_id, step)
);

comment on table montinho.ai_reasoning_logs is
  'Raciocínio passo a passo de cada execução — alimenta o AI Strategy Panel (Documento 09).';

create index idx_ai_reasoning_logs_output on montinho.ai_reasoning_logs (ai_output_id);

-- ai_recommendations ------------------------------------------------------------------------------
create table montinho.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references montinho.students (id) on delete cascade,
  source_output_id uuid references montinho.ai_outputs (id),
  recommendation text not null,
  justification text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'superseded')),
  decided_by uuid references auth.users (id),
  decided_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.ai_recommendations is
  'Recomendações da IA com decisão do profissional — a IA nunca decide sozinha (Documento 00).';
comment on column montinho.ai_recommendations.status is
  'pending → accepted/rejected pelo Montinho; superseded quando substituída.';

create index idx_ai_recommendations_student on montinho.ai_recommendations (student_id);
create index idx_ai_recommendations_status on montinho.ai_recommendations (status);

-- RLS ----------------------------------------------------------------------------------------------
alter table montinho.ai_prompts enable row level security;
alter table montinho.ai_prompt_versions enable row level security;
alter table montinho.ai_outputs enable row level security;
alter table montinho.ai_reasoning_logs enable row level security;
alter table montinho.ai_recommendations enable row level security;

create policy "ai_prompts_all_authenticated" on montinho.ai_prompts
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "ai_prompt_versions_all_authenticated" on montinho.ai_prompt_versions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "ai_outputs_all_authenticated" on montinho.ai_outputs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "ai_reasoning_logs_all_authenticated" on montinho.ai_reasoning_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "ai_recommendations_all_authenticated" on montinho.ai_recommendations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão -------------------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'ai_prompts', 'ai_prompt_versions', 'ai_outputs', 'ai_reasoning_logs', 'ai_recommendations'
);
