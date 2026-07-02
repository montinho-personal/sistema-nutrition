# Módulo `reports` — Relatório do Aluno

Documento final com padrão de consultoria premium (Documento 02) — a
consolidação de toda a jornada num único documento apresentável.

## Objetivo

Reunir, num relatório coeso e imprimível, tudo o que o sistema decidiu sobre o aluno: resumo
executivo, scores e hipóteses, estratégia (12 decisões), macros, plano alimentar, evolução e a
fase do roadmap — cada parte com sua justificativa.

## Ponto único de consolidação

`reportBuilder.ts` **reaproveita todos os motores** (Diagnóstico, Estratégia, Macros, Plano
Alimentar, Acompanhamentos, Roadmap) — nada é recalculado por conta própria (Documento 17 —
reutilizar, nunca reconstruir). É determinístico (Documento 08).

## Estrutura

- `types/` — o modelo do relatório (bundle das peças de cada módulo).
- `services/reportBuilder.ts` — agrega os motores num `ReportModel`.
- `components/report-document.tsx` — o documento premium, reusando os componentes de exibição de
  cada módulo (StrategyResult, MacroSummary, MealCard, EvolutionSummary, TransformationPanel).
- `components/report-view.tsx` — orquestra e oferece **Imprimir / PDF** (`window.print()`).
- `components/reports-index.tsx` — seleção de aluno.

## Impressão

O App Shell esconde a navegação na impressão (`print:hidden`), então `window.print()` gera um PDF
limpo só com o documento. Requer a cadeia mínima: diagnóstico concluído + objetivo + estratégia
com o peso registrado.
