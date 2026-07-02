# Supabase — Banco de Dados

Migrações do banco PostgreSQL (Supabase), seguindo os **Documentos 10 e 14**.
Referência completa do schema: [`docs/database-schema.md`](../docs/database-schema.md).

## Regras

- **Toda** alteração de schema acontece via migração neste diretório. Nunca alterar tabelas
  manualmente (Documento 11 — Padrão das Migrações).
- Toda tabela segue o padrão obrigatório: `id` (UUID), `created_at`, `updated_at`,
  `created_by`, `updated_by`, `is_active`, `version`, `notes`.
- Soft delete via `is_active` — nunca excluir definitivamente registros importantes.
- RLS habilitada em todas as tabelas.
- Auditoria: gatilho `audit_row` → `audit_log`; motivo via
  `set_config('app.change_reason', '...', true)`.
- Versionamento: `touch_row` incrementa `version` em todo UPDATE; `strategies` e `reports`
  geram snapshot automático em `strategy_versions` / `report_versions`.

## Migrações

| #    | Arquivo                    | Conteúdo                                                                                    |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------- |
| 0001 | `..._foundation.sql`       | Extensões, `set_updated_at`, `profiles` + RLS                                               |
| 0002 | `..._audit_versioning.sql` | `touch_row`, `audit_log`, `audit_row`, `attach_standard_triggers`                           |
| 0003 | `..._students.sql`         | students, measurements, photos, documents, goals                                            |
| 0004 | `..._foods.sql`            | sources (seed TBCA/TACO/USDA), categories, foods, attributes, portions, substitutions, tags |
| 0005 | `..._supplements.sql`      | supplements, protocols, indications, contraindications, evidence                            |
| 0006 | `..._diagnosis.sql`        | sessions, answers, scores, hypotheses, risks, opportunities                                 |
| 0007 | `..._strategy.sql`         | strategies (+snapshot), versions, alternatives, decisions, validations                      |
| 0008 | `..._nutrition.sql`        | targets, macro_plans, meal_structures/items/substitutions/notes                             |
| 0009 | `..._roadmap.sql`          | roadmaps, phases (7 fases), events, adjustments                                             |
| 0010 | `..._followup.sql`         | followups, answers, adjustments, progress                                                   |
| 0011 | `..._reports.sql`          | reports (+snapshot), versions, exports                                                      |
| 0012 | `..._knowledge_base.sql`   | kb_articles, protocols, food/supplement/behavior guides, references                         |
| 0013 | `..._ai.sql`               | ai_prompts (+versions), outputs, reasoning_logs, recommendations                            |

## Como aplicar

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) autenticado no projeto:

```bash
supabase db push
```

Ou cole o conteúdo de cada migração (em ordem) no SQL Editor do painel do Supabase.

## Testes

`tests/database.test.sql` — 17 testes de integridade, executados em transação com rollback
(não deixam dados):

```bash
npm run db:test          # usa $DATABASE_URL
```

Para rodar em PostgreSQL puro (sem Supabase), aplique antes `tests/local-bootstrap.sql`,
que emula o schema `auth` mínimo. **Nunca** aplicar o bootstrap em um projeto Supabase real.

## Convenção de nomes

`<timestamp>_<descricao>.sql` — ex.: `00000000000003_students.sql`.
