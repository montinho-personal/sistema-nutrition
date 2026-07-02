# Módulo `settings` — Configurações

Torna configuráveis os parâmetros estratégicos de macro (Documento 08 — parâmetros
estratégicos são configuráveis, nunca fixos no meio da lógica).

## Objetivo

Permitir ao usuário ajustar a matemática dos macros — **proteína (g/kg) por objetivo**, **gordura
mínima (g/kg)** e o **ajuste calórico (%) por velocidade** (déficit e superávit) — sem tocar no
código. Os motores passam a usar os novos valores imediatamente.

## Como funciona

- Os **padrões** vivem em `strategy/constants/parameters.ts` (`DEFAULT_MACRO_PARAMS`).
- O usuário sobrescreve na tela; o override é gravado local-first (`settings`).
- `resolveMacroParams()` (e o hook `useMacroParams`) mesclam o override sobre os padrões.
- `computeMacros(..., params)` recebe os parâmetros; sem argumento, usa os padrões — então testes e
  chamadas antigas seguem inalterados.

## Reuso

Os componentes que calculam macros (Estratégia, Plano Alimentar, Acompanhamentos, Relatório e a
Central de Decisão) passam `useMacroParams()` ao `computeMacros`/`buildStudentReport` — um único
ponto de verdade, reativo às Configurações (Documento 17 — reutilizar, nunca duplicar).

## Escopo

Fatores de atividade, coeficientes de BMR e energia por grama seguem padrões consolidados e não
são editáveis aqui — apenas os parâmetros que um profissional realmente ajusta.
