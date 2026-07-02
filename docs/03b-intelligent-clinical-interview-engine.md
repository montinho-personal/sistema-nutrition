# DOCUMENTO 03B — Montinho Nutrition Strategy

## Intelligent Clinical Interview Engine (ICIE)

---

| Campo             | Valor          |
| ----------------- | -------------- |
| **Classificação** | Core AI Module |
| **Prioridade**    | Máxima         |

> Este documento define **como a entrevista clínica deverá funcionar**.
>
> O objetivo **NÃO** é preencher uma ficha. O objetivo é **compreender profundamente o aluno**.

---

## Filosofia

O sistema deverá se comportar como um **nutricionista esportivo extremamente experiente**.

- Nunca seguirá uma sequência fixa.
- Nunca fará perguntas desnecessárias.
- Nunca desperdiçará tempo do profissional.

Cada pergunta deverá existir porque ela **poderá mudar uma decisão futura**.

---

## Regra Principal

Nenhuma pergunta poderá existir apenas por curiosidade.

Toda pergunta deverá responder pelo menos uma decisão nutricional futura.

Se uma informação não altera nenhuma estratégia, ela **não deverá ser coletada**.

---

## Entrevista Adaptativa

A entrevista será dinâmica. Cada resposta modifica automaticamente o restante da consulta.

**Exemplo — home office:**

```
Aluno informa que trabalha em home office
  ↓ Ocultar perguntas sobre restaurante da empresa
  ↓ Aprofundar perguntas sobre acesso à cozinha
  ↓ Perguntar sobre beliscos durante o expediente
  ↓ Perguntar sobre rotina doméstica
```

**Exemplo — treino às 5h:**

```
Aluno informa: treina às 5h
  ↓ Treina em jejum?
  ↓ Consegue comer antes?
  ↓ Quanto tempo possui?
  ↓ Como se sente durante o treino?
  ↓ Já testou outras estratégias?
```

**Exemplo — compulsão alimentar:**

```
Aluno informa: tem compulsão alimentar
  ↓ Abrir automaticamente um bloco específico
  (Nunca seguir normalmente)
```

---

## Entrevista em Árvore

Cada resposta poderá gerar novos ramos. O sistema nunca terá uma ordem rígida. Exemplo:

```
Fome
  ↓ Quando acontece?
  ↓ Qual intensidade?
  ↓ Quais alimentos?
  ↓ Em quais dias?
  ↓ Qual emoção estava presente?
  ↓ Como resolveu?
  ↓ Funcionou?
  → Isso modifica o plano alimentar.
```

---

## Profundidade

O sistema deverá aprofundar apenas onde existe **potencial impacto**. Não desperdiçar tempo com
perguntas irrelevantes.

---

## Motor de Investigação

O software deverá pensar constantemente:

> "O que ainda não sei que pode mudar a estratégia?"

- Enquanto existir dúvida importante → continuar investigando.
- Quando houver confiança suficiente → encerrar aquele tema.

---

## Grau de Confiança

Cada bloco deverá possuir um indicador de **confiança**. Exemplo:

| Bloco     | Confiança |
| --------- | --------- |
| Sono      | 98%       |
| Rotina    | 95%       |
| Compulsão | 42%       |

Enquanto o nível de confiança estiver baixo, o sistema continua perguntando.

---

## Detecção de Inconsistências

Comparar respostas. Exemplo:

```
Aluno responde: "Nunca sente fome."
Depois responde: "Belisca cinco vezes por dia."
  ↓ Sistema identifica possível inconsistência
  ↓ Pergunta novamente
  ↓ Esclarece
```

---

## Investigação dos Gatilhos

Sempre procurar **quando, onde, com quem, como e por quê** o gatilho acontece.

Nunca registrar apenas "sente fome".

---

## Investigação dos Sucessos

O sistema também deverá descobrir quando o aluno **consegue** seguir dieta e o que existia naquele período:

- Qual rotina.
- Qual estratégia.
- Qual ambiente.
- Quais refeições.
- Qual treino.
- Qual motivação.

O sistema deverá **reutilizar sucessos anteriores**.

---

## Investigação dos Fracassos

Nunca perguntar apenas "por que abandonou?". Investigar:

- Qual momento.
- Qual dificuldade.
- Qual emoção.
- Qual ambiente.
- Qual alimento.
- Qual evento.
- Qual estratégia estava utilizando.
- O que poderia ter evitado.

---

## Motor de Curiosidade Clínica

Sempre perguntar:

> "Existe algo importante que ainda não descobrimos?"

Caso exista → continuar investigando.

---

## Limitador

A entrevista nunca poderá ficar cansativa. O sistema deverá medir:

- Tempo.
- Quantidade de perguntas.
- Valor das respostas.
- Fadiga.

Quando perceber repetição → **encerrar**.

---

## Priorização

Sempre investigar primeiro:

1. Objetivo.
2. Segurança.
3. Aderência.
4. Rotina.
5. Psicologia.
6. Alimentação.
7. Estratégias.
8. Detalhes.

---

## Motor de Hipóteses

Enquanto entrevista, o sistema deverá construir hipóteses e ajustar sua confiança em tempo real:

```
"Provavelmente este aluno abandonará por excesso de restrição." — Confiança 88%
  ↓ Nova resposta
Confiança sobe para 97%
  ↓ Hipótese validada
```

---

## Motor de Personalização

Cada aluno deverá sentir que a entrevista foi criada **exclusivamente para ele**.

Nenhum aluno fará exatamente a mesma sequência de perguntas.

---

## Memória Interna

Durante toda entrevista o sistema deverá armazenar, sempre atualizando em tempo real:

- Hipóteses.
- Dúvidas.
- Pontos fortes.
- Pontos fracos.
- Riscos.
- Oportunidades.
- Estratégias possíveis.

---

## Resultado Final

Ao término da entrevista, o **Nutrition Decision Engine** deverá possuir confiança suficiente para
construir uma estratégia individualizada:

- Não baseada em médias.
- Não baseada em protocolos.
- Mas baseada na **realidade daquele aluno**.

---

## Princípio Final

O aluno nunca deverá sentir que respondeu um questionário.

Ele deverá sentir que conversou com **um dos melhores nutricionistas esportivos do mundo**.

> Essa será a missão da Intelligent Clinical Interview Engine.
