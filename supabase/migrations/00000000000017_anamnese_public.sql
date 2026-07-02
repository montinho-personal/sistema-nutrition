-- =============================================================================
-- Migração 0017 — Anamnese pública (sync sem login)
--
-- Caixa de entrada das anamneses que o aluno preenche pelo link público. O
-- aluno usa a chave anon (pública); por isso o acesso é SOMENTE via funções
-- SECURITY DEFINER expostas no schema `public` (sempre visível ao PostgREST) —
-- não há acesso direto à tabela pela chave anon.
--
-- Os dados vivem no schema `montinho` (isolado). As funções ficam em `public`
-- com prefixo `montinho_` para não colidir com outros apps do projeto.
-- =============================================================================

create table if not exists montinho.anamnese_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  student_name text,
  answers jsonb not null default '{}'::jsonb,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table montinho.anamnese_submissions is
  'Anamneses preenchidas pelo aluno no link público; importadas pelo treinador.';

create index if not exists idx_anamnese_submissions_student
  on montinho.anamnese_submissions (student_id);

-- RLS ligada e SEM políticas para anon: todo acesso passa pelas funções abaixo.
alter table montinho.anamnese_submissions enable row level security;

-- Envio (aluno) --------------------------------------------------------------
create or replace function public.montinho_submit_anamnese(
  p_student_id text,
  p_student_name text,
  p_answers jsonb
) returns uuid
language plpgsql
security definer
set search_path = montinho, public
as $$
declare
  v_id uuid;
begin
  if p_student_id is null or length(trim(p_student_id)) = 0 then
    raise exception 'student_id obrigatório';
  end if;
  insert into montinho.anamnese_submissions (student_id, student_name, answers)
  values (p_student_id, p_student_name, coalesce(p_answers, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

comment on function public.montinho_submit_anamnese(text, text, jsonb) is
  'Grava a anamnese preenchida pelo aluno (chamada com a chave anon, via link público).';

-- Busca (treinador) — só do student_id informado (UUID não-adivinhável) -------
create or replace function public.montinho_fetch_anamnese(p_student_id text)
returns table (
  id uuid,
  student_id text,
  student_name text,
  answers jsonb,
  consumed boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = montinho, public
as $$
  select id, student_id, student_name, answers, consumed, created_at
  from montinho.anamnese_submissions
  where student_id = p_student_id
  order by created_at desc;
$$;

comment on function public.montinho_fetch_anamnese(text) is
  'Retorna as anamneses enviadas para um aluno específico.';

-- Marcar como importada ------------------------------------------------------
create or replace function public.montinho_consume_anamnese(p_id uuid)
returns void
language sql
security definer
set search_path = montinho, public
as $$
  update montinho.anamnese_submissions set consumed = true where id = p_id;
$$;

comment on function public.montinho_consume_anamnese(uuid) is
  'Marca uma anamnese como já importada pelo treinador.';

-- Permissões: as funções são chamáveis pela chave anon e por usuários logados.
grant execute on function public.montinho_submit_anamnese(text, text, jsonb) to anon, authenticated;
grant execute on function public.montinho_fetch_anamnese(text) to anon, authenticated;
grant execute on function public.montinho_consume_anamnese(uuid) to anon, authenticated;
