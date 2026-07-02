-- =============================================================================
-- Testes do banco de dados (Sprint 1.2 — Documento 14)
--
-- Cobre: inserções, atualizações, versionamento, soft delete, auditoria,
-- integridade referencial, constraints e unicidade.
--
-- Execução (banco de teste local ou Supabase de desenvolvimento):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/database.test.sql
--
-- Todo o teste roda em uma transação revertida ao final — não deixa dados.
-- =============================================================================

begin;

do $$
declare
  test_user uuid;
  test_student uuid;
  test_session uuid;
  test_strategy uuid;
  test_food uuid;
  test_plan uuid;
  test_meal uuid;
  test_report uuid;
  v integer;
  n integer;
  ts_before timestamptz;
  failed boolean;
begin
  -- Setup: usuário simulado -----------------------------------------------------
  insert into auth.users (email) values ('teste@montinho.dev') returning id into test_user;
  perform set_config('app.test_uid', test_user::text, true);

  -- profiles é criado pelo gatilho on_auth_user_created
  select count(*) into n from montinho.profiles where id = test_user;
  assert n = 1, 'TESTE 01 FALHOU: perfil não foi criado automaticamente para o novo usuário';
  raise notice 'TESTE 01 OK — perfil criado automaticamente via gatilho';

  -- Inserção --------------------------------------------------------------------
  insert into montinho.students (owner_id, full_name, sex, height_cm, main_goal, created_by)
  values (test_user, 'Aluno de Teste', 'male', 178.0, 'weight_loss', test_user)
  returning id, version into test_student, v;

  assert v = 1, 'TESTE 02 FALHOU: version inicial deveria ser 1';
  raise notice 'TESTE 02 OK — inserção com version = 1';

  -- Auditoria de INSERT -----------------------------------------------------------
  select count(*) into n from montinho.audit_log
  where table_name = 'students' and record_id = test_student and action = 'insert';
  assert n = 1, 'TESTE 03 FALHOU: insert não gerou registro de auditoria';
  raise notice 'TESTE 03 OK — auditoria registrou o insert com autor';

  -- Atualização: version + updated_at + auditoria com motivo ----------------------
  select updated_at into ts_before from montinho.students where id = test_student;
  perform set_config('montinho.change_reason', 'Ajuste de altura após nova medição', true);
  update montinho.students set height_cm = 179.0 where id = test_student;

  select version into v from montinho.students where id = test_student;
  assert v = 2, 'TESTE 04 FALHOU: update deveria incrementar version para 2';
  raise notice 'TESTE 04 OK — update incrementou version (1 → 2)';

  select count(*) into n from montinho.audit_log
  where table_name = 'students' and record_id = test_student
    and action = 'update' and reason = 'Ajuste de altura após nova medição';
  assert n = 1, 'TESTE 05 FALHOU: auditoria de update não registrou o motivo';
  raise notice 'TESTE 05 OK — auditoria registrou update com motivo';
  perform set_config('montinho.change_reason', '', true);

  -- Soft delete ---------------------------------------------------------------------
  update montinho.students set is_active = false where id = test_student;
  select count(*) into n from montinho.students where id = test_student;
  assert n = 1, 'TESTE 06 FALHOU: soft delete não deve remover a linha';
  update montinho.students set is_active = true where id = test_student;
  raise notice 'TESTE 06 OK — soft delete preserva o registro';

  -- Integridade referencial: FK inválida deve falhar -----------------------------------
  failed := false;
  begin
    insert into montinho.student_measurements (student_id, weight_kg)
    values (gen_random_uuid(), 80);
  exception when foreign_key_violation then
    failed := true;
  end;
  assert failed, 'TESTE 07 FALHOU: FK inválida deveria ser rejeitada';
  raise notice 'TESTE 07 OK — integridade referencial rejeita FK inválida';

  -- Constraint de domínio: check deve falhar --------------------------------------------
  failed := false;
  begin
    insert into montinho.diagnosis_sessions (student_id, status, overall_confidence)
    values (test_student, 'in_progress', 150);
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'TESTE 08 FALHOU: confiança 150 viola check 0–100 e deveria falhar';
  raise notice 'TESTE 08 OK — check constraint rejeita valores fora do domínio';

  -- Diagnóstico completo -----------------------------------------------------------------
  insert into montinho.diagnosis_sessions (student_id, status, overall_confidence, created_by)
  values (test_student, 'in_progress', 72, test_user)
  returning id into test_session;

  insert into montinho.diagnosis_answers (session_id, block, question_key, question_text, answer)
  values (test_session, 'routine', 'work_schedule', 'Como é sua rotina de trabalho?',
          '{"type": "text", "value": "Home office, horário flexível"}'::jsonb);

  insert into montinho.diagnosis_scores (session_id, score_key, score)
  values (test_session, 'adherence', 84);

  -- Unicidade: mesmo score_key na mesma sessão deve falhar
  failed := false;
  begin
    insert into montinho.diagnosis_scores (session_id, score_key, score)
    values (test_session, 'adherence', 90);
  exception when unique_violation then
    failed := true;
  end;
  assert failed, 'TESTE 09 FALHOU: score duplicado por sessão deveria violar unicidade';
  raise notice 'TESTE 09 OK — unicidade de score por sessão respeitada';

  insert into montinho.diagnosis_hypotheses (session_id, hypothesis, confidence)
  values (test_session, 'Maior dificuldade será o período noturno', 88);
  insert into montinho.diagnosis_risks (session_id, risk_type, description, severity, mitigation)
  values (test_session, 'abandonment', 'Histórico de abandono em dietas restritivas',
          'high', 'Estratégia flexível com plano B');
  insert into montinho.diagnosis_opportunities (session_id, description, effort)
  values (test_session, 'Trocar refrigerante comum por zero', 'low');
  raise notice 'TESTE 10 OK — domínio diagnosis aceita fluxo completo';

  -- Estratégia: versionamento automático com snapshot --------------------------------------
  insert into montinho.strategies
    (student_id, diagnosis_session_id, objective, speed, status, justification, created_by)
  values
    (test_student, test_session, 'weight_loss', 'moderate', 'draft',
     'Déficit moderado: maior chance de sucesso no longo prazo', test_user)
  returning id into test_strategy;

  select count(*) into n from montinho.strategy_versions
  where strategy_id = test_strategy and version_number = 1;
  assert n = 1, 'TESTE 11 FALHOU: insert de estratégia deveria gerar snapshot v1';
  raise notice 'TESTE 11 OK — snapshot v1 criado automaticamente no insert';

  perform set_config('montinho.change_reason', 'Ativação após validação do conselho', true);
  update montinho.strategies set status = 'active' where id = test_strategy;
  perform set_config('montinho.change_reason', '', true);

  select count(*) into n from montinho.strategy_versions where strategy_id = test_strategy;
  assert n = 2, 'TESTE 12 FALHOU: update de estratégia deveria gerar snapshot v2';

  select count(*) into n from montinho.strategy_versions
  where strategy_id = test_strategy and version_number = 2
    and change_reason = 'Ativação após validação do conselho'
    and snapshot ->> 'status' = 'active';
  assert n = 1, 'TESTE 12 FALHOU: snapshot v2 deveria conter novo status e motivo';
  raise notice 'TESTE 12 OK — versionamento: nada é sobrescrito, snapshots com motivo';

  -- Cadeia nutricional ------------------------------------------------------------------------
  select id into test_food from montinho.foods limit 1;
  if test_food is null then
    insert into montinho.foods (name, energy_kcal, protein_g, carbs_g, fat_g,
                              source_id, source_code)
    select 'Arroz, integral, cozido', 124, 2.6, 25.8, 1.0, id, 'BRC0001'
    from montinho.food_sources where name = 'TBCA'
    returning id into test_food;
  end if;

  insert into montinho.macro_plans (strategy_id, plan_type, calories_kcal, protein_g, carbs_g, fat_g)
  values (test_strategy, 'standard', 2100, 160, 210, 62)
  returning id into test_plan;

  insert into montinho.meal_structures (macro_plan_id, position, name, objective)
  values (test_plan, 1, 'Café da manhã', 'Saciedade matinal')
  returning id into test_meal;

  insert into montinho.meal_items (meal_structure_id, food_id, quantity_grams, household_measure)
  values (test_meal, test_food, 150, '3 colheres de sopa');
  raise notice 'TESTE 13 OK — cadeia strategy → macro_plan → meal → item íntegra';

  -- Origem protegida: sessão que originou estratégia não pode ser excluída -----------------------
  failed := false;
  begin
    delete from montinho.diagnosis_sessions where id = test_session;
  exception when foreign_key_violation then
    failed := true;
  end;
  assert failed,
    'TESTE 14 FALHOU: sessão com estratégia vinculada não deveria ser excluível (origem clara)';
  raise notice 'TESTE 14 OK — origem da estratégia protegida contra exclusão física';

  -- Cascade contido: sessão SEM estratégia remove filhos, preservando aluno ----------------------
  declare
    orphan_session uuid;
  begin
    insert into montinho.diagnosis_sessions (student_id, status)
    values (test_student, 'draft')
    returning id into orphan_session;

    insert into montinho.diagnosis_answers (session_id, block, question_key, question_text, answer)
    values (orphan_session, 'goals', 'main_goal', 'Qual seu objetivo?', '"emagrecer"'::jsonb);

    delete from montinho.diagnosis_sessions where id = orphan_session;

    select count(*) into n from montinho.diagnosis_answers where session_id = orphan_session;
    assert n = 0, 'TESTE 15 FALHOU: cascade não removeu respostas da sessão';
    select count(*) into n from montinho.students where id = test_student;
    assert n = 1, 'TESTE 15 FALHOU: aluno não deveria ser afetado';
    raise notice 'TESTE 15 OK — cascade correto e contido';
  end;

  -- Relatório: snapshot automático -------------------------------------------------------------
  insert into montinho.reports (student_id, strategy_id, title, content)
  values (test_student, test_strategy, 'Estratégia Nutricional — Aluno de Teste',
          '{"sections": ["resumo_executivo"]}'::jsonb)
  returning id into test_report;

  update montinho.reports
  set content = '{"sections": ["resumo_executivo", "plano_alimentar"]}'::jsonb
  where id = test_report;

  select count(*) into n from montinho.report_versions where report_id = test_report;
  assert n = 2, 'TESTE 16 FALHOU: report deveria ter 2 versões (insert + update)';
  raise notice 'TESTE 16 OK — versionamento de relatórios funcionando';

  -- Substituição de alimento: check contra auto-substituição -------------------------------------
  failed := false;
  begin
    insert into montinho.food_substitutions (food_id, substitute_food_id)
    values (test_food, test_food);
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'TESTE 17 FALHOU: alimento não pode substituir a si mesmo';
  raise notice 'TESTE 17 OK — auto-substituição rejeitada';

  raise notice '======================================';
  raise notice 'TODOS OS 17 TESTES PASSARAM';
  raise notice '======================================';
end;
$$;

rollback;
