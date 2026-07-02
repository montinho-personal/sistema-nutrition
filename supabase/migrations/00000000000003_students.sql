-- =============================================================================
-- Migração 0003 — Domain: Students (Sprint 1.2)
--
-- Dados permanentes do aluno e sua evolução física: perfil, medidas,
-- fotos, documentos e metas. Todas as tabelas seguem o padrão obrigatório
-- de auditoria (Documento 14) e possuem RLS habilitada.
-- =============================================================================

-- students ----------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  full_name text not null,
  sex text check (sex in ('male', 'female', 'other')),
  birth_date date,
  height_cm numeric(5, 1) check (height_cm > 0),
  main_goal text,
  email text,
  phone text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.students is
  'Perfil permanente do aluno (Documento 10 — Domain Students). Um registro por pessoa.';
comment on column public.students.owner_id is 'Profissional responsável (multi-user ready).';
comment on column public.students.main_goal is 'Objetivo principal declarado pelo aluno.';
comment on column public.students.status is 'Situação do acompanhamento: active, paused, archived.';

create index idx_students_owner on public.students (owner_id);
create index idx_students_status on public.students (status);
create index idx_students_created_at on public.students (created_at);

-- student_measurements ------------------------------------------------------------
create table public.student_measurements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  body_fat_pct numeric(4, 1) check (body_fat_pct between 0 and 100),
  circumferences jsonb,
  skinfolds jsonb,
  bioimpedance jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.student_measurements is
  'Medidas antropométricas por data: peso, circunferências, dobras, bioimpedância.';
comment on column public.student_measurements.circumferences is
  'Circunferências em cm, por região — ex.: {"waist": 84, "hip": 98}.';
comment on column public.student_measurements.skinfolds is
  'Dobras cutâneas em mm, por ponto — ex.: {"triceps": 12}.';
comment on column public.student_measurements.bioimpedance is
  'Resultado bruto de bioimpedância, quando disponível.';

create index idx_student_measurements_student on public.student_measurements (student_id);
create index idx_student_measurements_date on public.student_measurements (measured_at);

-- student_photos -------------------------------------------------------------------
create table public.student_photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  taken_at date not null default current_date,
  storage_path text not null,
  angle text check (angle in ('front', 'side', 'back', 'other')),
  caption text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.student_photos is
  'Fotos de evolução física (Supabase Storage), por data e ângulo.';
comment on column public.student_photos.storage_path is 'Caminho no bucket do Supabase Storage.';

create index idx_student_photos_student on public.student_photos (student_id);

-- student_documents ------------------------------------------------------------------
create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  document_type text not null default 'other'
    check (document_type in ('exam', 'report', 'prescription', 'other')),
  storage_path text not null,
  issued_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.student_documents is
  'Documentos do aluno: exames, laudos e relatórios externos (Supabase Storage).';

create index idx_student_documents_student on public.student_documents (student_id);
create index idx_student_documents_type on public.student_documents (document_type);

-- student_goals -----------------------------------------------------------------------
create table public.student_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  goal_type text not null check (goal_type in (
    'weight_loss', 'hypertrophy', 'recomposition', 'maintenance',
    'performance', 'health', 'event_preparation'
  )),
  description text not null,
  target_value numeric(8, 2),
  target_unit text,
  deadline date,
  priority integer not null default 1 check (priority >= 1),
  status text not null default 'active'
    check (status in ('active', 'achieved', 'adjusted', 'abandoned')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  is_active boolean not null default true,
  version integer not null default 1,
  notes text
);

comment on table public.student_goals is
  'Metas do aluno: objetivo principal e secundários, com prazo e prioridade (Documento 06 — Etapa 1).';
comment on column public.student_goals.priority is '1 = objetivo principal; demais são secundários.';

create index idx_student_goals_student on public.student_goals (student_id);
create index idx_student_goals_type on public.student_goals (goal_type);
create index idx_student_goals_status on public.student_goals (status);

-- RLS ---------------------------------------------------------------------------------
alter table public.students enable row level security;
alter table public.student_measurements enable row level security;
alter table public.student_photos enable row level security;
alter table public.student_documents enable row level security;
alter table public.student_goals enable row level security;

-- Fase single-user: acesso completo para autenticados (Documento 08 —
-- preparado para multi-user; políticas por owner_id virão nessa fase).
create policy "students_all_authenticated" on public.students
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "student_measurements_all_authenticated" on public.student_measurements
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "student_photos_all_authenticated" on public.student_photos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "student_documents_all_authenticated" on public.student_documents
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "student_goals_all_authenticated" on public.student_goals
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Gatilhos padrão ------------------------------------------------------------------------
call public.attach_standard_triggers(
  'students', 'student_measurements', 'student_photos', 'student_documents', 'student_goals'
);
