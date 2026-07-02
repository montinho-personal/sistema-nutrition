# DOCUMENTO 10 — Montinho Nutrition Strategy

## Database Architecture V1 (PRD)

---

| Campo | Valor |
| --- | --- |
| **Classificação** | Engineering PRD — Database Foundation |
| **Prioridade** | Absoluta |

> Este documento define toda a **arquitetura inicial do banco de dados**.
>
> **Nenhum módulo poderá criar tabelas fora deste padrão.**
> O objetivo é construir uma base sólida, escalável e organizada.

---

## Filosofia

O banco de dados não deverá apenas armazenar informações. **Ele deverá armazenar conhecimento.**

- Cada entidade deverá possuir apenas uma responsabilidade.
- Nunca duplicar dados.
- Sempre normalizar quando fizer sentido.
- Sempre facilitar futuras evoluções.

---

## Princípios

- Organização por domínio.
- Chaves primárias **UUID**.
- Soft Delete quando necessário.
- Campos de auditoria em todas as tabelas.
- Histórico de alterações.
- Estrutura preparada para múltiplos usuários no futuro — mesmo que inicialmente exista apenas um usuário.

---

## Padrão Obrigatório

Toda tabela deverá possuir:

```
id
created_at
updated_at
created_by
updated_by
is_active
notes
```

---

## Domínios do Banco

O banco será dividido em **domínios independentes**:

| Domain | Responsabilidade |
| --- | --- |
| **Students** | Dados permanentes do aluno |
| **Diagnosis** | Diagnóstico estratégico |
| **Nutrition Strategy** | Decisões estratégicas |
| **Macros** | Cálculos nutricionais |
| **Meal Planning** | Estrutura das refeições |
| **Food Database** | Banco inteligente de alimentos |
| **Supplements** | Banco inteligente de suplementação |
| **Follow Up** | Acompanhamentos |
| **Roadmap** | Planejamento da transformação |
| **Reports** | Documentos, PDFs, histórico |
| **Knowledge Base** | Bibliotecas inteligentes |

---

## Tabelas

### `students`
Nome, sexo, nascimento, altura, objetivo principal, contato, observações, status, foto.

### `student_measurements`
Peso, circunferências, dobras cutâneas, bioimpedância, fotos, data.

### `diagnosis_sessions`
Cada entrevista realizada: versão, status, resumo, score geral.

### `diagnosis_answers`
Todas as respostas: pergunta, resposta, data, categoria, confiança.

### `strategies`
Estratégia escolhida: objetivo, velocidade, justificativa, status, data.

### `strategy_alternatives`
Estratégias descartadas: motivos, probabilidade, riscos.

### `macro_plans`
Calorias, proteínas, carboidratos, gorduras, justificativa.

### `meal_structure`
Número de refeições, horários, objetivo de cada refeição, observações.

### `meal_items`
Alimentos, quantidade, medidas caseiras, substituições.

### `food_library`
Banco Inteligente de Alimentos: nome, grupo, categoria, TBCA_ID, TACO_ID, calorias, proteína,
carboidrato, gordura, fibras, micronutrientes, saciedade, praticidade, tempo de preparo,
congela bem, portabilidade, custo estimado, objetivos indicados, observações.

### `supplement_library`
Nome, objetivo, nível de evidência, dose, quando utilizar, quando evitar, alternativas
alimentares, prioridade.

### `followups`
Data, peso, medidas, adesão, fome, sono, energia, observações.

### `adjustments`
Alteração realizada, motivo, impacto esperado, resultado observado.

### `roadmap`
Fase atual, objetivo, próxima etapa, prazo, critérios para evolução.

### `knowledge_articles`
Biblioteca científica: título, resumo, categoria, nível de evidência, última atualização.

---

## Relacionamentos

```
Student
  ↓ Diagnosis
  ↓ Strategy
  ↓ Macros
  ↓ Meals
  ↓ Follow Up
  ↓ Adjustments
  ↓ Reports
```

**Toda a jornada deverá permanecer conectada.**

---

## Histórico

- Nenhum plano deverá ser sobrescrito.
- Toda alteração gera **nova versão**.
- Sempre preservar histórico.

## Auditoria

O sistema deverá responder:

- Quem alterou.
- Quando alterou.
- O que mudou.
- Por que mudou.

## Backup

Preparar arquitetura para **backups automáticos**. Nunca depender apenas da aplicação.

## Segurança

Nunca excluir definitivamente registros importantes. Utilizar **desativação lógica** quando apropriado.

## Escalabilidade

O banco deverá suportar futuramente, **sem necessidade de remodelagem estrutural**:

- Múltiplos profissionais.
- Múltiplas clínicas.
- Integrações.
- Aplicativo.
- API pública.

---

## Princípio Final

O banco de dados deverá refletir a filosofia do Montinho Nutrition Strategy.

Ele não armazenará apenas dietas.

> Ele armazenará **toda a inteligência construída ao longo da jornada de cada aluno**.
>
> Essa arquitetura será a fundação permanente do software.
