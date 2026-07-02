# DOCUMENTO 07 — Montinho Nutrition Strategy

## Módulo 1 — UX • Interface • Fluxo da Entrevista

---

| Campo             | Valor                                          |
| ----------------- | ---------------------------------------------- |
| **Classificação** | Engineering PRD                                |
| **Prioridade**    | Máxima                                         |
| **Módulo**        | Módulo 1 — Diagnóstico Estratégico Nutricional |

> Este documento define toda a experiência da **Entrevista Estratégica**.
>
> O objetivo é permitir que o Claude Code implemente este módulo praticamente
> **sem necessidade de interpretação**.

---

## Filosofia

O usuário nunca deverá sentir que está preenchendo um formulário.

Ele deverá sentir que está conduzindo uma **consultoria premium**.

Cada clique deverá aproximá-lo da estratégia final.

---

## Estrutura Geral

Layout dividido em **três áreas**:

```
┌────────────────┬──────────────────────────┬────────────────────┐
│  Navigation    │        Workspace         │ Strategic Insights │
│  Panel         │   (uma pergunta por vez) │  (tempo real)      │
│  (esquerda)    │        (centro)          │    (direita)       │
└────────────────┴──────────────────────────┴────────────────────┘
```

### Coluna Esquerda — Navigation Panel

Mostrar:

- Etapas.
- Status.
- Progresso.
- Tempo estimado.
- Etapa atual.

Permitir **voltar para etapas concluídas**.

### Área Central — Workspace

Onde a entrevista acontece.

- Mostrar **apenas uma pergunta por vez**.
- Nunca exibir dezenas de campos simultaneamente.
- Cada pergunta deverá ocupar o centro da tela.

### Coluna Direita — Strategic Insights

Atualização em **tempo real**. Mostrar:

- Hipóteses.
- Riscos.
- Oportunidades.
- Score parcial.

**Nunca mostrar dados técnicos ao aluno. Somente ao Montinho.**

---

## Cabeçalho

Sempre mostrar:

- Nome do aluno.
- Objetivo.
- Data.
- Tempo de entrevista.
- Status do salvamento.

## Rodapé

- Botão voltar.
- Botão continuar.
- Salvar automaticamente.
- Indicador de progresso.

## Progresso

Nunca utilizar porcentagem apenas. Mostrar:

- Etapa atual.
- Etapas restantes.
- Tempo estimado.

---

## Componentes

Utilizar:

Cards, Stepper, Progress Bar, Accordion, Dropdown, Toggle, Slider, Radio Group, Checkbox,
Input inteligente, Busca, Autocomplete, Date Picker, Upload, Notas.

---

## Apresentação das Perguntas

Sempre:

1. **Uma pergunta principal.**
2. Abaixo: descrição curta.
3. Exemplo, caso necessário.

Nunca apresentar blocos gigantes de texto.

## Respostas

Sempre priorizar: **clique, seleção, escalas, botões, chips, ícones**.

Evitar digitação quando possível.

## Escalas

Sempre utilizar, quando aplicável:

- 0–10
- Baixa / Moderada / Alta / Muito alta

---

## Perguntas Condicionais

```
Responder
  ↓
Sistema decide
  ↓
Próxima pergunta
```

**Nunca sequência fixa.**

---

## Auto Save

Salvar automaticamente **a cada alteração**. Sem botão salvar.

## Estados

Cada pergunta deverá possuir:

- Não respondida
- Respondida
- Em análise
- Concluída
- Revisada

## Validação

Nunca permitir inconsistências óbvias. Exemplo:

```
Objetivo: ganhar massa
  ↓
Meta: perder 20 kg
  ↓
Solicitar confirmação
```

## Modo Foco

Enquanto responde: ocultar distrações, priorizar leitura.

---

## Motor de Insights

Enquanto entrevista, mostrar discretamente. Exemplo:

- "O sistema identificou alta probabilidade de boa aderência."
- "Investigando comportamento alimentar."
- "Analisando rotina."

**Isso transmite inteligência.**

## Hipóteses

- Nunca mostrar todas.
- Mostrar apenas as mais relevantes.
- Atualizar automaticamente.

## Score Parcial

Mostrar, sempre como **indicadores visuais**:

- Aderência
- Motivação
- Organização
- Praticidade
- Risco

---

## Interrupção

Caso o usuário saia: **salvar** e **retornar exatamente ao ponto anterior**.

## Resumo da Etapa

Ao concluir cada etapa, mostrar:

- O que foi aprendido.
- Quais dúvidas permanecem.
- Qual será a próxima etapa.

## Resumo Final

Ao terminar, mostrar **Dashboard**:

- Perfil.
- Principais riscos.
- Principais oportunidades.
- Hipóteses.
- Scores.
- Próximos passos.

**Nunca mostrar macros. Nunca mostrar dieta.**

---

## Microinterações

Todas as transições deverão ser suaves. Sem excesso de animações. Sensação premium.

## Desempenho

A interface deverá responder **imediatamente**, mesmo em entrevistas longas.

## Responsividade

- Desktop prioritário.
- Tablet completo.
- Mobile funcional.

## Acessibilidade

- Contraste elevado.
- Boa tipografia.
- Atalhos de teclado.
- Navegação intuitiva.

---

## Critérios de Aceitação

O módulo será aprovado apenas se:

- ✔ A entrevista parecer uma conversa.
- ✔ O usuário nunca sentir fadiga.
- ✔ O progresso for claro.
- ✔ As respostas forem rápidas.
- ✔ As hipóteses aparecerem em tempo real.
- ✔ O resumo executivo for gerado automaticamente.
- ✔ O sistema transmitir sensação de software premium.

---

## Princípio Final

O maior diferencial do Montinho Nutrition Strategy não será apenas sua inteligência.

Será a **experiência de utilizar essa inteligência**.

Cada tela deverá transmitir organização, confiança e sofisticação.

> Essa experiência deverá refletir o padrão de um software desenvolvido por uma empresa global de tecnologia.
