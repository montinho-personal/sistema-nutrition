# DOCUMENTO 03A — Montinho Nutrition Strategy

## Módulo 1 — Arquitetura do Diagnóstico Estratégico Nutricional

---

| Campo | Valor |
| --- | --- |
| **Classificação** | Core Module |
| **Prioridade** | Máxima |

> Este documento define toda a estrutura do **Diagnóstico Estratégico Nutricional**.
>
> O objetivo deste módulo **NÃO** é coletar informações. O objetivo é **compreender profundamente o aluno**.
>
> Cada pergunta deverá existir para responder uma decisão futura. Se uma informação não
> influencia nenhuma decisão do software, ela **não deverá ser coletada**.

---

## Missão

Ao término do diagnóstico, o sistema deverá conhecer o aluno em um nível suficiente para responder:

- Qual estratégia possui maior probabilidade de sucesso?
- Quais obstáculos deverão surgir?
- Como evitá-los?
- Qual abordagem nutricional é mais indicada?
- Como maximizar aderência?

---

## Filosofia

O diagnóstico deverá funcionar como uma **conversa** entre um profissional altamente experiente e o aluno.

**Nunca** como:

- Um formulário.
- Uma ficha cadastral.
- Uma anamnese burocrática.

---

## Entrevista Inteligente

O sistema deverá utilizar **perguntas condicionais**. Cada resposta modifica automaticamente a
entrevista. Exemplo:

- Se o aluno disser que **trabalha em casa** → não perguntar sobre restaurante da empresa.
- Se disser que **nunca bebe álcool** → ocultar perguntas relacionadas.
- Se **não possui filhos** → ocultar perguntas sobre rotina familiar.

---

## Princípios

O sistema deverá descobrir:

- Quem é o aluno.
- Como vive.
- Como pensa.
- Como come.
- Como trabalha.
- Como treina.
- Como reage à fome.
- Como reage ao estresse.
- Como toma decisões.
- Como fracassa.
- Como teve sucesso anteriormente.

---

## Blocos do Diagnóstico

O diagnóstico será dividido em grandes áreas:

| # | Bloco |
| --- | --- |
| 1 | Objetivos |
| 2 | Histórico corporal |
| 3 | Histórico nutricional |
| 4 | Rotina |
| 5 | Comportamento alimentar |
| 6 | Psicologia alimentar |
| 7 | Saúde clínica |
| 8 | Treinamento |
| 9 | Sono e recuperação |
| 10 | Ambiente alimentar |
| 11 | Preferências alimentares |
| 12 | Orçamento |
| 13 | Suplementação atual |
| 14 | Disponibilidade para cozinhar |
| 15 | Motivação |
| 16 | Autoeficácia |
| 17 | Perfil comportamental |
| 18 | Histórico de aderência |
| 19 | Riscos |
| 20 | Oportunidades |

---

## Regras

**Cada bloco deverá responder pelo menos uma decisão futura.** Exemplos:

**Rotina** →
- Quantidade de refeições
- Horários
- Planejamento
- Praticidade

**Fome** →
- Distribuição dos alimentos
- Proteínas
- Fibras
- Volume alimentar
- Estratégias de saciedade

**Treinamento** →
- Distribuição de carboidratos
- Pré-treino
- Pós-treino
- Suplementação

---

## Scores

Cada bloco deverá gerar indicadores próprios. Exemplo:

- Score de aderência
- Score de disciplina
- Score de praticidade
- Score de motivação
- Score de organização
- Score de ambiente alimentar
- Score de risco de abandono
- Score de fome
- Score de flexibilidade
- Score financeiro
- Score de disponibilidade culinária
- Score de experiência nutricional

---

## Hipóteses

O sistema nunca deverá entregar apenas respostas. Ele deverá gerar **hipóteses**. Exemplos:

| # | Hipótese | Confiança |
| --- | --- | --- |
| 1 | Grande dificuldade será o período noturno. | 94% |
| 2 | Alta probabilidade de sucesso utilizando estratégia flexível. | 91% |
| 3 | Poucas refeições aumentarão aderência. | 87% |
| 4 | Controle do ambiente alimentar terá maior impacto do que reduzir calorias. | 95% |

### Padrões

Toda hipótese deverá conter:

- Problema.
- Justificativa.
- Nível de confiança.
- Impacto esperado.
- Plano preventivo.

---

## Decisões Que Este Módulo Precisa Responder

Ao finalizar o diagnóstico, o software obrigatoriamente deverá conseguir responder:

- Quem é este aluno?
- Qual seu verdadeiro objetivo?
- Qual sua motivação principal?
- Qual seu perfil psicológico?
- Qual sua maior dificuldade?
- Qual sua maior vantagem?
- Qual estratégia alimentar possui maior chance de sucesso?
- Qual velocidade de transformação é mais indicada?
- Quais serão os principais riscos?
- Quais suplementos poderão facilitar sua rotina?
- Qual quantidade de refeições tende a gerar maior aderência?
- Quais alimentos aumentarão a saciedade?
- Qual estratégia para finais de semana?
- Qual estratégia para viagens?
- Qual estratégia para eventos sociais?
- Qual estratégia para dias de trabalho intenso?
- Como reduzir o risco de abandono?

---

## Critério de Aprovação

O módulo será considerado concluído apenas quando o **Nutrition Decision Engine** possuir
informações suficientes para tomar decisões individualizadas **sem depender de suposições**.

Nenhuma decisão importante poderá ser baseada em "achismos". Toda estratégia deverá nascer do diagnóstico.

> Esse módulo é o alicerce de todo o Montinho Nutrition Strategy.
> Se o diagnóstico for excelente, todas as decisões seguintes terão qualidade superior.
