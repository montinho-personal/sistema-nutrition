-- =============================================================================
-- Testes da sincronização na nuvem — fusão no push (Sprint A / migração 0019)
--
-- Cobre o bug de produção auditado: um dispositivo com cópia local
-- desatualizada não pode apagar o que outro dispositivo já salvou. Cobre
-- também a atualização de um mesmo registro em dois dispositivos, a
-- preservação da versão mais nova mesmo quando ela chega primeiro, o
-- primeiro envio (sem linha prévia), coleções tipo objeto (settings) e o
-- isolamento por usuário (RLS).
--
-- Execução (banco de teste local ou Supabase de desenvolvimento):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/cloud_sync.test.sql
--
-- Todo o teste roda em uma transação revertida ao final — não deixa dados.
-- =============================================================================

begin;

do $$
declare
  user_a uuid;
  user_b uuid;
  n int;
  fetched jsonb;
begin
  insert into auth.users (email) values ('sync-teste-a@montinho.dev') returning id into user_a;
  insert into auth.users (email) values ('sync-teste-b@montinho.dev') returning id into user_b;
  perform set_config('app.test_uid', user_a::text, true);

  -- TESTE 01: dois dispositivos criam alunos diferentes na mesma coleção; o
  -- push do segundo NÃO pode apagar o que o primeiro já salvou (o bug
  -- auditado em produção). ------------------------------------------------
  perform public.montinho_sync_push('students',
    '[{"id":"renato","fullName":"Renato","updatedAt":"2026-07-01T10:00:00Z"}]'::jsonb);
  perform public.montinho_sync_push('students',
    '[{"id":"maria","fullName":"Maria","updatedAt":"2026-07-01T10:00:05Z"}]'::jsonb);

  select jsonb_array_length(data) into n
  from montinho.app_collections
  where user_id = user_a and collection_key = 'students';
  assert n = 2, format('TESTE 01 FALHOU: esperava 2 alunos após dois pushes de dispositivos diferentes, encontrei %s — a fusão não está unindo os registros', n);
  raise notice 'TESTE 01 OK — pushes de dois dispositivos preservam os dois alunos (bug de produção corrigido)';

  -- TESTE 02: o MESMO aluno editado em dois dispositivos — a versão com
  -- updatedAt mais recente vence, não importa a ordem de chegada. ----------
  perform public.montinho_sync_push('students',
    '[{"id":"renato","fullName":"Renato","weight":92,"updatedAt":"2026-07-05T08:00:00Z"}]'::jsonb);

  select elem into fetched
  from montinho.app_collections ac, jsonb_array_elements(ac.data) as elem
  where ac.user_id = user_a and ac.collection_key = 'students' and elem ->> 'id' = 'renato';
  assert (fetched ->> 'weight') = '92', 'TESTE 02 FALHOU: a atualização mais recente do mesmo registro não venceu';
  raise notice 'TESTE 02 OK — atualização mais recente do mesmo registro substitui a antiga';

  -- TESTE 03: um push com dado MAIS ANTIGO (ex.: dispositivo que ficou
  -- offline e sincronizou tarde) não pode reverter uma edição já mais nova.
  perform public.montinho_sync_push('students',
    '[{"id":"renato","fullName":"Renato","weight":80,"updatedAt":"2026-06-01T08:00:00Z"}]'::jsonb);
  select elem into fetched
  from montinho.app_collections ac, jsonb_array_elements(ac.data) as elem
  where ac.user_id = user_a and ac.collection_key = 'students' and elem ->> 'id' = 'renato';
  assert (fetched ->> 'weight') = '92', 'TESTE 03 FALHOU: um push com data antiga reverteu uma edição mais recente (deveria perder, por timestamp)';
  raise notice 'TESTE 03 OK — push com timestamp mais antigo não reverte uma edição mais recente';

  -- TESTE 04: primeiro envio (sem linha prévia) funciona normalmente. ------
  perform public.montinho_sync_push('followups',
    '[{"id":"fu1","date":"2026-07-01","updatedAt":"2026-07-01T10:00:00Z"}]'::jsonb);
  select jsonb_array_length(data) into n
  from montinho.app_collections
  where user_id = user_a and collection_key = 'followups';
  assert n = 1, 'TESTE 04 FALHOU: primeiro envio de uma coleção nova deveria gravar 1 registro';
  raise notice 'TESTE 04 OK — primeiro envio de uma coleção (sem linha prévia) funciona';

  -- TESTE 05: coleção tipo objeto (settings) continua sendo substituída —
  -- não há lista de registros para unir. ------------------------------------
  perform public.montinho_sync_push('settings', '{"theme":"dark"}'::jsonb);
  perform public.montinho_sync_push('settings', '{"theme":"light"}'::jsonb);
  select data into fetched
  from montinho.app_collections
  where user_id = user_a and collection_key = 'settings';
  assert (fetched ->> 'theme') = 'light', 'TESTE 05 FALHOU: settings deveria ser substituído (objeto único), não unido';
  raise notice 'TESTE 05 OK — coleções tipo objeto continuam sendo substituídas';

  -- TESTE 06: isolamento por usuário — o push do usuário B não enxerga nem
  -- altera os dados do usuário A. -------------------------------------------
  perform set_config('app.test_uid', user_b::text, true);
  perform public.montinho_sync_push('students',
    '[{"id":"outro-aluno","fullName":"Aluno de B","updatedAt":"2026-07-01T10:00:00Z"}]'::jsonb);
  select jsonb_array_length(data) into n
  from montinho.app_collections
  where user_id = user_a and collection_key = 'students';
  assert n = 2, 'TESTE 06 FALHOU: o push de outro usuário vazou/alterou a coleção do usuário A';
  raise notice 'TESTE 06 OK — a fusão é isolada por usuário (RLS/auth.uid), sem vazamento entre contas';

  raise notice '✔ TODOS OS TESTES DE SINCRONIZAÇÃO PASSARAM';
end $$;

rollback;
