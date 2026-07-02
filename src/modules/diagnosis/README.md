# Módulo `diagnosis` — Módulo 1: Diagnóstico Estratégico

A Entrevista Estratégica que compreende o aluno antes de qualquer decisão
(Documentos 03A, 03B, 06, 07).

## Objetivo

Conduzir uma anamnese inteligente por etapas e, a partir das respostas, produzir **scores**,
**hipóteses com confiança** e um **Resumo Executivo** — a base para o NDE decidir sem achismos.

## Estrutura

- `types/` — perguntas, sessão, scores, hipóteses, resumo.
- `constants/` — scores (linha de base, rótulos) e o **questionário** (11 etapas, Documento 06),
  com contribuições de score e perguntas condicionais (`showIf`). Inclui o **recordatório
  alimentar** ("Seu dia alimentar") e o aprofundamento adaptativo (gatilhos, histórico, saúde).
- `services/` — **toda a inteligência é determinística** (regra, não IA — Documento 08):
  - `scoringEngine.ts` — scores 0–100 a partir das respostas; a confiança conta só as
    perguntas *aplicáveis* (condicionais ocultas não penalizam).
  - `hypothesisEngine.ts` — hipóteses com justificativa e confiança (Documento 03A).
  - `anamnesePortrait.ts` — traduz o recordatório e as preferências em grupos legíveis
    ("Retrato alimentar") para o treinador.
  - `executiveSummary.ts` — Resumo Inteligente (Documento 05/06).
  - `diagnosisRepository.ts` — sessões com auto-save (local-first).
- `hooks/use-diagnosis-session.ts` — sessão reativa com auto-save.
- `components/` — entrevista (stepper), campo de pergunta, insights em tempo real, resumo.
- `tests/` — cobertura dos motores (scores, hipóteses, resumo, condicionais).

## Fluxo

Cadastrar aluno → `/diagnosis/[studentId]` → entrevista (auto-save) → concluir → Resumo
Executivo. Quando o Supabase for conectado, as sessões vão para `montinho.diagnosis_*`.
