# Supabase — Banco de Dados

Migrações do banco PostgreSQL (Supabase), seguindo o **Documento 10 — Database Architecture V1**.

## Regras

- **Toda** alteração de schema acontece via migração neste diretório. Nunca alterar tabelas
  manualmente (Documento 11 — Padrão das Migrações).
- Toda tabela segue o padrão obrigatório de auditoria: `id` (UUID), `created_at`, `updated_at`,
  `created_by`, `updated_by`, `is_active`, `notes`.
- Soft delete via `is_active` — nunca excluir definitivamente registros importantes.
- RLS habilitado em todas as tabelas.

## Como aplicar

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) autenticado no projeto:

```bash
supabase db push
```

Ou cole o conteúdo de cada migração (em ordem) no SQL Editor do painel do Supabase.

## Convenção de nomes

`<timestamp>_<descricao>.sql` — ex.: `00000000000001_foundation.sql`.
