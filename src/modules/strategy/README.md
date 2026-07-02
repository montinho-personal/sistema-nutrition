# Módulo `strategy` — Estratégia Nutricional + Macros

O Strategic Prescription Engine (Documento 04): **a estratégia vem antes da matemática.**

## Objetivo

A partir do diagnóstico concluído e do objetivo do aluno, construir a **Estratégia Nutricional**
(as 12 etapas do SPE) — cada decisão com justificativa técnica — e **só então** calcular os
macros. Nenhuma caloria é calculada antes de a estratégia estar definida.

## Estrutura

- `constants/parameters.ts` — **todos os parâmetros** (proteína g/kg, ajustes por velocidade,
  fatores de atividade, coeficientes de BMR). Documento 08: nenhum número mágico na lógica; este
  é o ponto único de verdade (e o que a tela de Configurações vai expor no futuro).
- `types/` — estratégia, decisões, input antropométrico, alvos de macro.
- `services/` — **inteligência determinística** (regra, não IA — Documento 08):
  - `strategyEngine.ts` — as 12 decisões do SPE a partir dos scores + respostas + objetivo.
  - `macroEngine.ts` — BMR (Katch-McArdle/Mifflin/fallback) → TDEE → calorias → macros.
  - `strategyRepository.ts` — persiste só o input antropométrico (local-first); a estratégia e
    os macros são derivados, então nunca dessincronizam.
- `validators/` — schema Zod do input (peso, % de gordura).
- `hooks/use-strategy-input.ts` — input reativo do aluno.
- `components/` — índice (escolher aluno), formulário antropométrico, resultado da estratégia
  (DecisionCards) e resumo dos macros.
- `tests/` — cobertura dos dois motores (estratégia e macros).

## Fluxo

Diagnóstico concluído → `/strategy/[studentId]` → Estratégia Nutricional (12 decisões) →
informar peso → **Macros calculados e justificados**.

## Derivado, não duplicado

A estratégia e os macros são funções puras do aluno + diagnóstico + peso. Persistimos apenas o
peso/% de gordura; tudo o mais é recalculado (Documento 17 — evoluir, nunca duplicar estado).
Quando o Supabase for conectado, o input migra para `montinho` sem mudar a UI.
