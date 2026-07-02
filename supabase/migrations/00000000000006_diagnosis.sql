-- =============================================================================
-- Migração 0006 — Domain: Diagnosis (Sprint 1.2)
--
-- Diagnóstico Estratégico Nutricional (Documentos 03A, 03B, 06):
-- sessões de entrevista com respostas por bloco, scores, hipóteses com
-- confiança, riscos e oportunidades — a base de todas as decisões do NDE.
-- =============================================================================

-- diagnosis_sessions -----------------------------------------------------------
create table montinho.diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references montinho.students (id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'reviewed')),
  started_at timestamptz,
  completed_at timestamptz,
  executive_summary text,
  overall_confidence integer check (overall_confidence between 0 and 100),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.diagnosis_sessions is
  'Sessão de Entrevista Estratégica (Documento 06). Cada nova entrevista gera nova sessão — histórico preservado.';
comment on column montinho.diagnosis_sessions.executive_summary is
  'Resumo Executivo gerado ao concluir (Documento 06 — Motor de Resumo).';
comment on column montinho.diagnosis_sessions.overall_confidence is
  'Confiança geral do diagnóstico 0–100 (Documento 03B — Grau de Confiança).';

create index idx_diagnosis_sessions_student on montinho.diagnosis_sessions (student_id);
create index idx_diagnosis_sessions_status on montinho.diagnosis_sessions (status);
create index idx_diagnosis_sessions_created_at on montinho.diagnosis_sessions (created_at);

-- diagnosis_answers ---------------------------------------------------------------
create table montinho.diagnosis_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references montinho.diagnosis_sessions (id) on delete cascade,
  block text not null,
  question_key text not null,
  question_text text not null,
  answer jsonb,
  answer_state text not null default 'answered'
    check (answer_state in ('unanswered', 'answered', 'in_review', 'confirmed', 'revised')),
  confidence integer check (confidence between 0 and 100),
  answered_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (session_id, question_key)
);

comment on table montinho.diagnosis_answers is
  'Respostas da entrevista adaptativa, por bloco e pergunta (Documento 03A — 20 blocos).';
comment on column montinho.diagnosis_answers.block is
  'Bloco do diagnóstico — ex.: goals, routine, eating_behavior, psychology.';
comment on column montinho.diagnosis_answers.answer is
  'Resposta em formato flexível (texto, escala, múltipla escolha).';
comment on column montinho.diagnosis_answers.answer_state is
  'Estado da pergunta (Documento 07): respondida, em análise, confirmada, revisada.';

create index idx_diagnosis_answers_session on montinho.diagnosis_answers (session_id);
create index idx_diagnosis_answers_block on montinho.diagnosis_answers (block);

-- diagnosis_scores ------------------------------------------------------------------
create table montinho.diagnosis_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references montinho.diagnosis_sessions (id) on delete cascade,
  score_key text not null,
  score integer not null check (score between 0 and 100),
  rationale text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text,

  unique (session_id, score_key)
);

comment on table montinho.diagnosis_scores is
  'Scores do diagnóstico 0–100 (Documento 06): aderência, organização, motivação, risco...';
comment on column montinho.diagnosis_scores.score_key is
  'Identificador do score — ex.: adherence, organization, motivation, risk, satiety.';

create index idx_diagnosis_scores_session on montinho.diagnosis_scores (session_id);

-- diagnosis_hypotheses -----------------------------------------------------------------
create table montinho.diagnosis_hypotheses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references montinho.diagnosis_sessions (id) on delete cascade,
  hypothesis text not null,
  justification text,
  confidence integer not null check (confidence between 0 and 100),
  expected_impact text,
  preventive_plan text,
  status text not null default 'active'
    check (status in ('active', 'validated', 'discarded')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.diagnosis_hypotheses is
  'Hipóteses com nível de confiança (Documento 03A — problema, justificativa, confiança, impacto, plano preventivo).';

create index idx_diagnosis_hypotheses_session on montinho.diagnosis_hypotheses (session_id);
create index idx_diagnosis_hypotheses_status on montinho.diagnosis_hypotheses (status);

-- diagnosis_risks -------------------------------------------------------------------------
create table montinho.diagnosis_risks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references montinho.diagnosis_sessions (id) on delete cascade,
  risk_type text not null check (risk_type in (
    'abandonment', 'hunger', 'muscle_loss', 'excessive_fat_gain',
    'psychological', 'financial', 'routine_infeasibility', 'other'
  )),
  description text not null,
  severity text not null default 'moderate'
    check (severity in ('low', 'moderate', 'high', 'critical')),
  probability integer check (probability between 0 and 100),
  mitigation text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.diagnosis_risks is
  'Riscos do Motor de Risco (Documento 00): abandono, fome, perda muscular, psicológico, financeiro, rotina.';
comment on column montinho.diagnosis_risks.mitigation is
  'Como reduzir o risco — todo risco vem acompanhado de solução (Documento 02).';

create index idx_diagnosis_risks_session on montinho.diagnosis_risks (session_id);
create index idx_diagnosis_risks_type on montinho.diagnosis_risks (risk_type);

-- diagnosis_opportunities --------------------------------------------------------------------
create table montinho.diagnosis_opportunities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references montinho.diagnosis_sessions (id) on delete cascade,
  description text not null,
  expected_impact text,
  effort text not null default 'moderate' check (effort in ('low', 'moderate', 'high')),
  priority integer not null default 100,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table montinho.diagnosis_opportunities is
  'Oportunidades do Motor de Oportunidades (Documento 00): pequenas mudanças de grande impacto.';
comment on column montinho.diagnosis_opportunities.priority is
  'Menor número = maior prioridade (Matriz impacto × dificuldade, Documento 03D).';

create index idx_diagnosis_opportunities_session on montinho.diagnosis_opportunities (session_id);

-- RLS ------------------------------------------------------------------------------------------
alter table montinho.diagnosis_sessions enable row level security;
alter table montinho.diagnosis_answers enable row level security;
alter table montinho.diagnosis_scores enable row level security;
alter table montinho.diagnosis_hypotheses enable row level security;
alter table montinho.diagnosis_risks enable row level security;
alter table montinho.diagnosis_opportunities enable row level security;

create policy "diagnosis_sessions_all_authenticated" on montinho.diagnosis_sessions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "diagnosis_answers_all_authenticated" on montinho.diagnosis_answers
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "diagnosis_scores_all_authenticated" on montinho.diagnosis_scores
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "diagnosis_hypotheses_all_authenticated" on montinho.diagnosis_hypotheses
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "diagnosis_risks_all_authenticated" on montinho.diagnosis_risks
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "diagnosis_opportunities_all_authenticated" on montinho.diagnosis_opportunities
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão --------------------------------------------------------------------------------
call montinho.attach_standard_triggers(
  'diagnosis_sessions', 'diagnosis_answers', 'diagnosis_scores',
  'diagnosis_hypotheses', 'diagnosis_risks', 'diagnosis_opportunities'
);
