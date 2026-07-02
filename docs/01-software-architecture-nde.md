# DOCUMENTO 01 — Montinho Nutrition Strategy

## Software Architecture & Nutrition Decision Engine (NDE)

---

| Campo             | Valor                    |
| ----------------- | ------------------------ |
| **Classificação** | Documento de Arquitetura |
| **Versão**        | V1.0                     |
| **Prioridade**    | Máxima                   |

> Este documento define **como o software deverá pensar**.
>
> Ele não descreve telas. Ele descreve o **cérebro do sistema**.
>
> Todos os módulos deverão utilizar obrigatoriamente esta arquitetura.

---

## Filosofia

O Montinho Nutrition Strategy **NÃO constrói dietas**.

O Montinho Nutrition Strategy **constrói estratégias**.

A dieta será apenas uma consequência.

Todo processamento seguirá exatamente esta sequência:

```
ALUNO
  ↓
COLETA DE DADOS
  ↓
DIAGNÓSTICO
  ↓
ANÁLISE
  ↓
HIPÓTESES
  ↓
DECISÃO
  ↓
ESTRATÉGIA
  ↓
IMPLEMENTAÇÃO
  ↓
MONITORAMENTO
  ↓
AJUSTES
  ↓
DOCUMENTO PREMIUM
```

---

## Nutrition Decision Engine (NDE)

O NDE é o **cérebro do software**.

- Nenhuma decisão poderá ignorá-lo.
- Todo módulo envia informações ao NDE.
- O NDE cruza todas as variáveis.
- Depois devolve decisões justificadas.

---

## Principais Entradas

O NDE deverá receber informações de:

### Perfil

- Idade
- Sexo
- Peso
- Altura
- Circunferências
- Objetivo
- Prazo

### Histórico

- Dietas anteriores
- Sucessos
- Fracassos
- Peso sanfona
- Experiência

### Rotina

- Horário
- Trabalho
- Treino
- Sono
- Família
- Viagens
- Mercado
- Restaurantes
- Delivery

### Psicologia

- Compulsão
- Ansiedade
- Emoção
- Fome
- Motivação
- Disciplina
- Autoeficácia
- Tudo-ou-nada

### Alimentação

- Preferências
- Restrições
- Intolerâncias
- Alergias
- Hábitos
- Cultura
- Religião

### Saúde

- Doenças
- Medicamentos
- Exames
- Digestão
- Constipação
- Refluxo

### Treinamento

- Musculação
- Cardio
- Passos
- Esportes
- Competições

### Ambiente

- Quem cozinha
- Quem compra
- Geladeira
- Empresa
- Filhos
- Parceiro

---

## Processamento

O NDE **nunca toma decisões imediatamente**. Ele executa várias camadas.

### Camada 1 — Diagnóstico

Quem é este aluno?

### Camada 2 — Identificação dos problemas

Quais são os verdadeiros obstáculos?

### Camada 3 — Identificação das oportunidades

Quais pequenas mudanças gerarão maior impacto?

### Camada 4 — Análise de aderência

O aluno realmente conseguirá seguir esta estratégia?

### Camada 5 — Análise de riscos

- Fome
- Abandono
- Perda muscular
- Baixa recuperação
- Orçamento
- Rotina
- Tempo

### Camada 6 — Comparação de estratégias

O sistema compara automaticamente todas as estratégias disponíveis. Exemplo:

- Déficit moderado
- Jejum
- Baixa frequência alimentar
- Alta frequência
- Alta proteína
- Flexível
- Contagem de macros
- Método das porções
- Low Carb
- Cetogênica
- Refeeds
- Diet Break
- Mini Cut
- Bulk
- Recomposição
- Manutenção

### Camada 7 — Pontuação

Cada estratégia recebe uma nota. Exemplo:

| Métrica                  | Valor |
| ------------------------ | ----- |
| Compatibilidade          | 93%   |
| Aderência                | 96%   |
| Praticidade              | 91%   |
| Probabilidade de sucesso | 94%   |
| Risco                    | Baixo |

### Camada 8 — Escolha

O sistema escolhe. Mas **explica. Sempre.**

---

## Regra Obrigatória

Toda decisão deverá responder:

- Por que escolhemos esta estratégia?
- Por que **NÃO** escolhemos as outras?
- Quais riscos existem?
- Como reduzir esses riscos?

---

## Banco de Decisões

O software deverá possuir um banco de decisões. Cada decisão deverá registrar:

- Qual problema foi encontrado.
- Qual estratégia foi escolhida.
- Qual justificativa foi utilizada.
- Quais alternativas foram descartadas.

---

## Banco de Estratégias

Cada estratégia deverá possuir obrigatoriamente:

- Nome
- Objetivo
- Indicação
- Contraindicação
- Benefícios
- Limitações
- Nível de evidência
- Perfil ideal
- Perfil inadequado
- Impacto esperado
- Chance de aderência
- Chance de sucesso
- Necessidade de acompanhamento

---

## Banco de Alimentos

Cada alimento possuirá atributos **além dos macros**. Exemplo:

- Saciedade
- Digestibilidade
- Praticidade
- Tempo de preparo
- Congela bem
- Bom para marmitas
- Bom para viagens
- Bom para hipertrofia
- Bom para emagrecimento
- Bom para quem trabalha fora
- Bom para poucas refeições
- Bom para muita fome
- Custo-benefício

---

## Banco de Suplementação

Cada suplemento deverá conter:

- Objetivo
- Problema que resolve
- Nível de evidência
- Quando considerar
- Quando evitar
- Alternativas alimentares
- Impacto esperado
- Prioridade
- Custo-benefício

---

## Motor de Aderência

A aderência será tratada como **variável principal**. O sistema deverá prever:

- Chance de abandono
- Chance de sucesso
- Principais gatilhos
- Momentos críticos
- Plano preventivo
- Plano B

---

## Motor de Oportunidades

O software deverá procurar automaticamente **pequenas mudanças de grande impacto**. Exemplo:

- Adicionar whey
- Trocar refrigerante
- Melhor horário
- Maior proteína
- Mais fibras
- Mais praticidade
- Maior saciedade

---

## Motor de Aprendizado

O sistema deverá aprender com os próprios atendimentos:

- Criar histórico
- Comparar casos
- Identificar padrões
- Evoluir continuamente

**Sem comprometer a privacidade dos alunos.**

---

## Fluxo Geral do Software

1. Diagnóstico.
2. Estratégia.
3. Definição da velocidade da transformação.
4. Escolha da abordagem nutricional.
5. Construção dos macros.
6. Estrutura das refeições.
7. Seleção inteligente dos alimentos.
8. Estratégias comportamentais.
9. Estratégias nutricionais complementares.
10. Plano de contingência.
11. Plano de ajustes.
12. Documento premium.

---

## Regra Final

Nenhum cálculo será realizado apenas porque é matematicamente correto.

Toda decisão deverá ser:

- Fisiologicamente adequada.
- Psicologicamente sustentável.
- Compatível com a rotina.
- Financeiramente viável.
- Baseada em evidências.
- Individualizada.
- Justificada.
- E **fácil de ser aplicada na vida real**.

> Essa será a essência do Montinho Nutrition Strategy.
