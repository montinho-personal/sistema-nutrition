# Módulo `follow-ups` — Acompanhamentos

Monitoramento contínuo que alimenta a inteligência individual do aluno
(Documentos 05 — PNI; 03F — previsão × real; 01/03E — Indicadores da Jornada).

## Objetivo

Registrar a resposta do aluno ao plano ao longo do tempo (peso + adesão, fome, sono, energia,
humor + **medidas corporais** + o que funcionou/não funcionou/porquê) e **comparar a evolução
real com o ritmo previsto** pelos macros — gerando recomendações ligadas ao plano de ajustes
(Documento 04, Etapa 12).

## A cadeia

O acompanhamento mede a resposta ao plano, então exige a **Estratégia** (que fixa o peso inicial
e os macros). Diagnóstico → Estratégia/Macros → **Acompanhamentos**.

## Estrutura

- `constants/parameters.ts` — **todos os parâmetros**: energia por kg, fator de ganho do
  superávit, bandas do ritmo esperado, limiares dos indicadores. Documento 08: nenhum número
  mágico na lógica.
- `types/` — acompanhamento, escalas, evolução, insights.
- `services/`:
  - `evolutionEngine.ts` — **determinístico** (regra, não IA): ritmo esperado a partir dos macros
    (déficit → kg/semana), status (no ritmo / lento / acelerado / estagnado / contrário),
    recomendações ligadas ao plano de ajustes, e a **evolução das circunferências**
    (`computeMeasurementDeltas` — primeiro × último; a cintura cai mesmo quando a balança empaca).
  - `outcomePrediction.ts` — **Outcome Prediction Engine** (Documento 03F): a partir do ritmo
    REAL medido, projeta o desfecho ante a meta do plano (Definição Estratégica) — projeção no
    prazo, semanas até a meta, % no ritmo, veredito e confiança que cresce a cada acompanhamento.
    Fecha o loop entre o plano (Sprint C) e a realidade (evolução).
  - `followUpRepository.ts` — CRUD local-first (tabela `montinho.followups` no futuro).
- `validators/` — schema Zod do registro (peso, escalas e medidas opcionais).
- `hooks/use-follow-ups.ts` — lista reativa por aluno.
- `components/` — índice, resumo da evolução (métricas + medidas + insights), formulário e histórico.
- `tests/` — cobertura do motor (previsão, status, insights, deltas de medidas).

## Previsão × real

O ritmo esperado vem dos próprios macros: `déficit_kcal × 7 / 7700 ≈ kg/semana` (sabor do Outcome
Prediction Engine, Documento 03F). Comparado ao ritmo real medido, o sistema diz **manter,
revisar, reduzir ou aumentar** — sempre com justificativa, nunca por achismo.
