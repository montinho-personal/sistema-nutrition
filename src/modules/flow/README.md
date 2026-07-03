# Módulo `flow` — Fluxo Guiado (Workflow V1)

O percurso que costura os módulos existentes num único caminho de **7 etapas**, da
anamnese ao documento final — rápido, claro e sempre mostrando onde se está. Não cria
funcionalidades: **orquestra** o que já existe (Diagnóstico, Estratégia, Cardápio…).

## As 7 etapas

Anamnese → Diagnóstico → Estratégia → Estratégia alimentar → Cardápio → Validação → Documento
(`constants/steps.ts`).

## Estrutura

- `types/` — `FlowStepId`, `FlowStep`, `FlowState`.
- `constants/steps.ts` — as 7 etapas, na ordem.
- `services/flowProgress.ts` — **regra pura** de sequenciamento: quais etapas estão
  alcançáveis, quais concluídas e qual a próxima ação (`deriveStepState`, `firstActionableStep`).
- `services/flowStateRepository.ts` — persiste a última etapa por aluno (retomar de onde parou).
- `hooks/use-flow-data.ts` — reúne, de forma reativa, tudo do aluno reaproveitando os motores
  da Estratégia e do Diagnóstico (sem duplicar regra); deriva os alertas da Rail.
- `hooks/use-flow-step.ts` — etapa atual reativa (grava na store; sem `setState` em efeito).
- `components/` — `FlowView` (shell), `FlowStepper`, `StrategyRail`, `FlowStepBody`, `FlowPicker`.

## Estado (Workflow V1 completo)

As 7 etapas estão redesenhadas e costuradas ponta a ponta: rota `/flow/[aluno]`, stepper com
progresso, navegação (voltar/continuar + clique nas etapas alcançáveis), auto-save, retomada e a
**Strategy Rail** sempre à vista (aluno · estratégia · abordagem · calorias · macros · alertas).
Cada etapa reaproveita os motores existentes (Diagnóstico, Estratégia, Cardápio, Validação,
Documento) sem duplicar regra. A anamnese é **híbrida**: entrevista determinística como base, com
aprofundamento por IA (só quando habilitada, degradando com elegância).

No `/flow` o shell oculta os painéis genéricos de inteligência (áreas 4/5) — a Rail do fluxo
é o resumo lateral daquela tela.

**Coesão & polimento (Sprint 8):** transição suave entre etapas (`motion.div` reanimado a cada
troca de etapa) e, no mobile, a Rail sobe para o topo (contexto antes do corpo longo) e volta
para a coluna lateral fixa no desktop. QA ponta a ponta em claro, escuro e mobile.
