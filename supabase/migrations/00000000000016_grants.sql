-- =============================================================================
-- Migração 0016 — Grants do schema montinho (Sprint de coexistência)
--
-- Num schema dedicado (fora do `public`), os papéis do Supabase — anon,
-- authenticated, service_role — precisam de permissão EXPLÍCITA. No `public`
-- isso é automático; no `montinho` não. O RLS continua governando o acesso
-- por linha (as políticas exigem auth.uid()); estes grants apenas concedem a
-- permissão de tabela que o RLS depois filtra.
--
-- Guardado por checagem de papel para rodar também em Postgres puro (testes).
-- Executa por último (após todas as tabelas existirem).
-- =============================================================================

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema montinho to anon, authenticated, service_role;

    grant all on all tables in schema montinho to anon, authenticated, service_role;
    grant all on all sequences in schema montinho to anon, authenticated, service_role;
    grant execute on all functions in schema montinho to anon, authenticated, service_role;

    -- Objetos futuros (novas tabelas de próximas migrações) herdam os grants.
    alter default privileges in schema montinho
      grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema montinho
      grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema montinho
      grant execute on functions to anon, authenticated, service_role;
  end if;
end
$$;
