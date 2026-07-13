-- =============================================================================
-- Migração 0019 — Corrige perda de dados na sincronização multi-dispositivo
--
-- BUG (auditoria de produção): `montinho_sync_push` fazia um SUBSTITUI CEGO
-- (`data = excluded.data`) — o array inteiro enviado por um dispositivo
-- sobrescrevia o que já estava salvo. Se o treinador criava um aluno no
-- computador A (sincronizado) e depois usava o computador B (com uma cópia
-- local desatualizada, sem esse aluno) e fazia qualquer outra edição na MESMA
-- coleção, o push de B apagava o aluno de A da nuvem — mesmo que B nunca
-- tivesse "visto" aquele aluno para decidir removê-lo.
--
-- Reproduzido e confirmado num Postgres real antes desta correção (ver
-- registro da auditoria): dois pushes sequenciais de "students" com alunos
-- diferentes resultavam em 1 aluno salvo, não 2.
--
-- CORREÇÃO: `montinho_sync_push` agora funde (união por `id`/`studentId`, o
-- mais recente por `updatedAt`/`createdAt` vence) o que já está salvo com o
-- que está chegando — a MESMA regra que o cliente já usa ao restaurar
-- (`mergeCollections.ts`), só que aplicada no servidor, na escrita, contra o
-- estado atual (nunca uma cópia desatualizada). Isso torna o push seguro
-- entre dispositivos concorrentes, em qualquer ordem.
--
-- Coleções que não são array (ex.: "settings", um objeto único) continuam
-- sendo substituídas — não há o que unir num documento sem lista de registros.
--
-- Limitação conhecida (inalterada por esta migração): apagar um registro só
-- localmente ainda não se propaga como remoção — o próximo push/pull pode
-- trazê-lo de volta. Registrado como recomendação futura (precisaria de
-- marcação de exclusão/tombstone); o comportamento anterior já tinha essa
-- mesma limitação, então não é uma regressão desta correção.
-- =============================================================================

create or replace function public.montinho_sync_push(p_key text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = montinho, public
as $$
declare
  v_uid uuid;
  v_incoming jsonb;
  v_merged jsonb;
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  v_uid := auth.uid();
  v_incoming := coalesce(p_data, '[]'::jsonb);

  if jsonb_typeof(v_incoming) = 'array' then
    -- Coleção de registros: une o que já está salvo com o que está chegando,
    -- por id (ou studentId, para coleções por aluno) — o mais recente vence.
    -- Em empate de horário, o envio atual (este dispositivo, agora) vence.
    select coalesce(jsonb_agg(row_data order by row_key), '[]'::jsonb)
    into v_merged
    from (
      select distinct on (row_key) row_key, row_data
      from (
        select
          coalesce(elem ->> 'id', elem ->> 'studentId') as row_key,
          elem as row_data,
          coalesce(elem ->> 'updatedAt', elem ->> 'createdAt', '') as row_time,
          0 as arrival_order -- já estava salvo
        from montinho.app_collections ac,
             jsonb_array_elements(ac.data) as elem
        where ac.user_id = v_uid
          and ac.collection_key = p_key
          and jsonb_typeof(ac.data) = 'array'
        union all
        select
          coalesce(elem ->> 'id', elem ->> 'studentId') as row_key,
          elem as row_data,
          coalesce(elem ->> 'updatedAt', elem ->> 'createdAt', '') as row_time,
          1 as arrival_order -- chegando agora — desempate vence
        from jsonb_array_elements(v_incoming) as elem
      ) candidates
      where row_key is not null
      order by row_key, row_time desc, arrival_order desc
    ) deduplicated;
  else
    -- Objeto único (ex.: settings) — sem lista de registros para unir.
    v_merged := v_incoming;
  end if;

  insert into montinho.app_collections (user_id, collection_key, data, updated_at)
  values (v_uid, p_key, v_merged, now())
  on conflict (user_id, collection_key)
  do update set data = excluded.data, updated_at = now();
end;
$$;

comment on function public.montinho_sync_push(text, jsonb) is
  'Salva uma coleção do usuário logado na nuvem, fundindo com o que já existe (união por id, o mais recente vence) — nunca apaga um registro só porque outro dispositivo não o conhecia ainda.';
