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
  `set_config('montinho.change_reason', '...', true)`.
- Versionamento: `touch_row` incrementa `version` em todo UPDATE; `strategies` e `reports`
  geram snapshot automático em `strategy_versions` / `report_versions`.

## Migrações

| #    | Arquivo                     | Conteúdo                                                                                    |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------- |
| 0001 | `..._foundation.sql`        | Cria o schema `montinho`, extensões, `set_updated_at`, `profiles` + RLS                     |
| 0002 | `..._audit_versioning.sql`  | `touch_row`, `audit_log`, `audit_row`, `attach_standard_triggers`                           |
| 0003 | `..._students.sql`          | students, measurements, photos, documents, goals                                            |
| 0004 | `..._foods.sql`             | sources (seed TBCA/TACO/USDA), categories, foods, attributes, portions, substitutions, tags |
| 0005 | `..._supplements.sql`       | supplements, protocols, indications, contraindications, evidence                            |
| 0006 | `..._diagnosis.sql`         | sessions, answers, scores, hypotheses, risks, opportunities                                 |
| 0007 | `..._strategy.sql`          | strategies (+snapshot), versions, alternatives, decisions, validations                      |
| 0008 | `..._nutrition.sql`         | targets, macro_plans, meal_structures/items/substitutions/notes                             |
| 0009 | `..._roadmap.sql`           | roadmaps, phases (7 fases), events, adjustments                                             |
| 0010 | `..._followup.sql`          | followups, answers, adjustments, progress                                                   |
| 0011 | `..._reports.sql`           | reports (+snapshot), versions, exports                                                      |
| 0012 | `..._knowledge_base.sql`    | kb_articles, protocols, food/supplement/behavior guides, references                         |
| 0013 | `..._ai.sql`                | ai_prompts (+versions), outputs, reasoning_logs, recommendations                            |
| 0014 | `..._food_intelligence.sql` | Extensão FIE: perfis do alimento, busca full-text, view `foods_enriched`                    |
| 0015 | `..._food_seed.sql`         | Seed curado (24 alimentos, tags, categorias, medidas)                                       |
| 0016 | `..._grants.sql`            | Grants dos papéis Supabase no schema `montinho`                                             |

## Schema dedicado `montinho`

Todo o sistema vive no schema **`montinho`** — nunca no `public`. Isso permite instalar o
Montinho Nutrition Strategy **dentro de um projeto Supabase que você já usa** para outros apps,
sem colisão de nomes e **sem criar um projeto novo** (sem custo extra). O gatilho de criação de
perfil usa nome único (`on_auth_user_created_montinho`) para nunca sobrescrever gatilhos alheios.

No app, o schema é configurável via `NEXT_PUBLIC_SUPABASE_SCHEMA` (padrão `montinho`).

## Como aplicar

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) autenticado no projeto:

```bash
supabase db push
```

Ou cole o conteúdo de cada migração (em ordem) no **SQL Editor** do painel do Supabase.

### Instalar dentro de um projeto Supabase existente (sem custo extra)

1. Abra o projeto que você já usa → **SQL Editor**.
2. Cole e rode cada migração de `migrations/` **em ordem** (0001 → 0016). Elas criam o schema
   `montinho` e tudo dentro dele — seu app atual (no schema `public`) não é tocado.
3. Painel → **Settings → API → Exposed schemas**: adicione `montinho` à lista.
4. No deploy (Vercel) ou no `.env.local`, use as chaves **desse** projeto e
   `NEXT_PUBLIC_SUPABASE_SCHEMA=montinho`.
5. Crie seu usuário em **Authentication → Users** (ou pela tela de login).

## Testes

`tests/database.test.sql` — 17 testes de integridade, executados em transação com rollback
(não deixam dados):

```bash
npm run db:test          # usa $DATABASE_URL
```

`tests/cloud_sync.test.sql` — 6 testes da sincronização multi-dispositivo (fusão no push:
dois dispositivos criando registros diferentes, atualização do mesmo registro, proteção
contra push com dado desatualizado, primeiro envio, coleção tipo objeto e isolamento por
usuário):

```bash
npm run db:test:sync     # usa $DATABASE_URL
```

Para rodar em PostgreSQL puro (sem Supabase), aplique antes `tests/local-bootstrap.sql`,
que emula o schema `auth` e os papéis (`anon`/`authenticated`/`service_role`) mínimos.
**Nunca** aplicar o bootstrap em um projeto Supabase real.

## Convenção de nomes

`<timestamp>_<descricao>.sql` — ex.: `00000000000003_students.sql`.
