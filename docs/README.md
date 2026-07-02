# Documentação — Montinho Nutrition Strategy

Este diretório reúne os documentos de produto do sistema. Os documentos são numerados por
ordem de autoridade e dependência. O **Documento 00** é o Documento Mestre e tem prioridade
máxima sobre qualquer outro.

## Índice

| #   | Documento                                                                                           | Status                                    |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 00  | [Vision & Product Philosophy (PRD)](00-vision-product-philosophy.md)                                | ✅ V1.0 — Fundação                        |
| 01  | [Software Architecture & Nutrition Decision Engine (NDE)](01-software-architecture-nde.md)          | ✅ V1.0 — Arquitetura                     |
| 02  | [Design System • UX • UI • Product Experience](02-design-system-ux-ui.md)                           | ✅ V1.0 — Design System                   |
| 03A | [Módulo 1 — Diagnóstico Estratégico Nutricional](03a-modulo-1-diagnostico-estrategico.md)           | ✅ V1.0 — Core Module                     |
| 03B | [Intelligent Clinical Interview Engine (ICIE)](03b-intelligent-clinical-interview-engine.md)        | ✅ V1.0 — Core AI Module                  |
| 03C | [Clinical Strategy Council (CSC)](03c-clinical-strategy-council.md)                                 | ✅ V1.0 — Core Intelligence Module        |
| 03D | [Strategic Priority Matrix (SPM)](03d-strategic-priority-matrix.md)                                 | ✅ V1.0 — Core Intelligence Module        |
| 03E | [Transformation Roadmap Engine (TRE)](03e-transformation-roadmap-engine.md)                         | ✅ V1.0 — Core Intelligence Module        |
| 03F | [Outcome Prediction Engine (OPE)](03f-outcome-prediction-engine.md)                                 | ✅ V1.0 — Core Intelligence Module        |
| 03G | [Nutrition Knowledge Base (NKB)](03g-nutrition-knowledge-base.md)                                   | ✅ V1.0 — Core Knowledge Module           |
| 03H | [Decision Rules Engine (DRE)](03h-decision-rules-engine.md)                                         | ✅ V1.0 — Core Decision Module            |
| 04  | [Strategic Prescription Engine (SPE)](04-strategic-prescription-engine.md)                          | ✅ V1.0 — Core Strategy Module            |
| 05  | [Personal Nutrition Intelligence (PNI)](05-personal-nutrition-intelligence.md)                      | ✅ V1.0 — Core Intelligence Module        |
| 06  | [Módulo 1 — Diagnóstico Estratégico Nutricional (PRD)](06-modulo-1-diagnostico-prd.md)              | ✅ V1.0 — PRD de Módulo                   |
| 07  | [Módulo 1 — UX • Interface • Fluxo da Entrevista](07-modulo-1-ux-interface-entrevista.md)           | ✅ V1.0 — Engineering PRD                 |
| 08  | [Master Software Architecture (MSA)](08-master-software-architecture.md)                            | ✅ V1.0 — Master Architecture             |
| 09  | [Main Workspace (Central de Decisão)](09-main-workspace-central-decisao.md)                         | ✅ V1.0 — Engineering PRD (Core UI)       |
| 10  | [Database Architecture V1](10-database-architecture-v1.md)                                          | ✅ V1.0 — Engineering PRD (Database)      |
| 11  | [Project Foundation & Engineering Standards (PFES)](11-project-foundation-engineering-standards.md) | ✅ V1.0 — Master Engineering PRD          |
| 12  | [AI Engineering Constitution (AEC)](12-ai-engineering-constitution.md)                              | ✅ V1.0 — Master Engineering Constitution |
| 13  | [Sprint 1.1 — Foundation Setup](13-sprint-1.1-foundation-setup.md)                                  | 🚧 Em implementação                       |

## Hierarquia em caso de conflito (definida no Doc 13)

1. **AI Engineering Constitution** (Doc 12) — como a IA trabalha.
2. **Master Software Architecture** (Doc 08) — arquitetura técnica.
3. **Vision & Product Philosophy** (Doc 00) — filosofia do produto.
4. Demais PRDs.

## Módulos previstos

A partir da filosofia do Documento Mestre, os seguintes módulos serão especificados. A ordem
reflete a **Hierarquia das Decisões** definida no PRD:

- **Diagnóstico Estratégico** — coleta e interpretação do contexto do aluno.
- **Objetivos** — definição e priorização de metas.
- **Nutrition Decision Engine (NDE)** — motor central de decisão (arquitetura de 8 camadas definida no [Documento 01](01-software-architecture-nde.md)).
- **Motor de Aderência** — prioriza estratégias que o aluno consiga seguir.
- **Motor de Risco** — avalia riscos antes de cada decisão.
- **Motor de Oportunidades** — busca ganhos simples de alto impacto.
- **Banco Inteligente de Alimentos** — TBCA → TACO → bases internacionais.
- **Banco Inteligente de Estratégias** — múltiplas abordagens, nunca metodologia única.
- **Banco Inteligente de Casos** — aprendizado com atendimentos, preservando privacidade.
- **Filosofia da Suplementação** — comportamento → organização → alimentação → ajustes → suplemento.
- **Gerador de Documento Premium** — entrega final para apresentação ao aluno.

## Regra de conflito

Em caso de conflito entre qualquer módulo e o Documento 00, o **Documento 00 sempre prevalece**.
Nenhuma funcionalidade é aprovada sem atender aos cinco níveis de qualidade definidos no PRD:
funciona tecnicamente, é baseada em evidências, é fácil de usar, ajuda na tomada de decisão e
parece um software premium.
