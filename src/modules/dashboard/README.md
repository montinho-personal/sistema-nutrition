# Módulo `dashboard` — Central de Decisão

A visão executiva de todos os alunos (Documento 09 — Main Workspace): onde cada um está na
jornada e o que fazer a seguir.

## Objetivo

Transformar a lista de alunos numa central de decisão: para cada aluno, a **fase atual** e a
**próxima ação recomendada** (diagnóstico → estratégia → acompanhamento → relatório), além de um
resumo por etapa.

## Estrutura

- `services/studentJourney.ts` — `computeStudentJourney`: determina a etapa da jornada e a próxima
  ação a partir do estado real, **reaproveitando `buildStudentReport`** para a fase e a evolução
  (Documento 17 — reutilizar, nunca duplicar). Determinístico (Documento 08).
- `components/dashboard-view.tsx` — resumo por etapa + cartões agrupados em "precisam de ação" e
  "em andamento".
- `tests/` — cobertura da lógica de próxima ação.

## Próxima ação

1. Sem diagnóstico concluído → **Fazer diagnóstico**.
2. Diagnóstico feito, sem estratégia → **Definir estratégia**.
3. Estratégia definida, sem acompanhamento → **Registrar acompanhamento**.
4. Em acompanhamento → **Ver relatório** (com a variação de peso e o status da evolução).
