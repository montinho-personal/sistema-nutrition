# DOCUMENTO 14 — Montinho Nutrition Strategy

## Sprint 1.2 — Database Implementation

---

| Campo             | Valor                                          |
| ----------------- | ---------------------------------------------- |
| **Classificação** | Sprint de Implementação                        |
| **Sprint**        | 1.2 — Implementação Completa do Banco de Dados |

> **Missão:** implementar toda a estrutura do banco de dados. Não criar apenas tabelas — criar
> uma arquitetura de dados robusta, organizada, escalável e preparada para suportar toda a
> evolução futura do software, seguindo rigorosamente os documentos anteriores.

---

## Objetivo

Construir a **fundação de dados** do sistema. Ao final desta Sprint, todo módulo futuro deverá
possuir uma estrutura pronta para armazenamento das informações.

## Tecnologia

Supabase • PostgreSQL • Migration Scripts • Row Level Security preparada • Views quando fizer
sentido • Indexes • Foreign Keys • Constraints

## Padrão

Todas as tabelas deverão possuir obrigatoriamente:

```
id (UUID) • created_at • updated_at • created_by • updated_by • is_active • version • notes
```

---

## Domínios e Tabelas

### Students

`students` • `student_measurements` • `student_photos` • `student_documents` • `student_goals`

### Diagnosis

`diagnosis_sessions` • `diagnosis_answers` • `diagnosis_scores` • `diagnosis_hypotheses` •
`diagnosis_risks` • `diagnosis_opportunities`

### Strategy

`strategies` • `strategy_versions` • `strategy_alternatives` • `strategy_decisions` •
`strategy_validations`

### Nutrition

`nutrition_targets` • `macro_plans` • `meal_structures` • `meal_items` • `meal_substitutions` •
`meal_notes`

### Foods

`foods` • `food_categories` • `food_attributes` • `food_substitutions` • `food_portions` •
`food_tags` • `food_sources`

### Supplements

`supplements` • `supplement_protocols` • `supplement_indications` •
`supplement_contraindications` • `supplement_evidence`

### Roadmap

`roadmaps` • `roadmap_phases` • `roadmap_events` • `roadmap_adjustments`

### Follow Up

`followups` • `followup_answers` • `followup_adjustments` • `followup_progress`

### Reports

`reports` • `report_versions` • `report_exports`

### Knowledge Base

`kb_articles` • `kb_protocols` • `kb_food_guides` • `kb_supplement_guides` •
`kb_behavior_guides` • `kb_scientific_references`

---

## Relacionamentos

- Criar todos os relacionamentos.
- Nunca utilizar dados duplicados.
- Toda informação deverá possuir origem clara.

## Índices

Criar índices para: Student ID, Diagnosis ID, Strategy ID, Created At, Status, Objetivo,
Categoria. **Nunca esperar problemas de performance para criar índices importantes.**

## Versionamento

- Toda estratégia deverá possuir histórico.
- Toda alteração deverá gerar nova versão.
- Nunca sobrescrever informações importantes.

## Auditoria

Implementar estrutura para registrar: quem alterou, quando alterou, o que mudou, motivo.

## Preparação para IA

Criar tabelas específicas — mesmo que ainda não sejam utilizadas:

`ai_prompts` • `ai_prompt_versions` • `ai_outputs` • `ai_reasoning_logs` • `ai_recommendations`

## Preparação para Base de Conhecimento

Toda biblioteca deverá ser independente. Permitir atualização sem alterar código.

## Migrations

- Todas as tabelas criadas através de migrations. Nunca criar manualmente.
- Cada migration deverá possuir descrição.

## Documentação

Gerar: diagrama do banco, relacionamentos, descrição de cada tabela, descrição de cada campo.

## Testes

Criar testes para: integridade referencial, constraints, relacionamentos, inserções,
atualizações, soft delete, versionamento.

---

## Não Implementar

Somente infraestrutura de dados. Não implementar ainda: regras nutricionais, IA, macros,
dashboard, entrevista, plano alimentar.

## Entregáveis

- ✔ Banco totalmente estruturado.
- ✔ Todas as migrations.
- ✔ Relacionamentos completos.
- ✔ Índices.
- ✔ Auditoria.
- ✔ Versionamento.
- ✔ Documentação.
- ✔ Estrutura pronta para todos os módulos futuros.

## Critérios de Aceitação

- O banco estiver normalizado.
- Os relacionamentos estiverem consistentes.
- O versionamento funcionar.
- As migrations puderem recriar o banco do zero.
- A documentação estiver completa.
- O banco estiver preparado para suportar a evolução do sistema pelos próximos anos.

## Mentalidade

> Você não está criando um banco de dados para um MVP. Você está criando a fundação de uma
> plataforma profissional. Sempre priorize clareza, consistência e escalabilidade.
