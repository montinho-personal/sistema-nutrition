# DOCUMENTO 09 — Montinho Nutrition Strategy

## Main Workspace (Central de Decisão)

---

| Campo             | Valor                     |
| ----------------- | ------------------------- |
| **Classificação** | Engineering PRD — Core UI |
| **Prioridade**    | Absoluta                  |

> Este documento define a **principal tela** do Montinho Nutrition Strategy.
>
> A maior parte do trabalho do Montinho acontecerá nesta tela.
> Ela deverá ser extremamente rápida, organizada e inteligente.

---

## Missão

Criar um ambiente onde **todas as decisões nutricionais possam ser tomadas sem trocar
constantemente de tela**.

O objetivo é: reduzir cliques, reduzir tempo, aumentar foco.

## Filosofia

O software não deverá parecer um formulário. Também não deverá parecer um sistema hospitalar.

Ele deverá parecer um **ambiente de trabalho premium**.

---

## Layout — As 5 Áreas

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. HEADER — aluno • objetivo • status • ações                    │
├──────────┬────────────────────────────┬─────────────┬────────────┤
│ 2.       │ 3.                         │ 4.          │ 5.         │
│ SIDEBAR  │ WORKSPACE CENTRAL          │ INSIGHTS    │ AI STRATEGY│
│ ESQUERDA │ (todo conteúdo aqui,       │ PANEL       │ PANEL      │
│ Timeline │  nunca em nova página)     │ (tempo real)│ (exclusivo)│
└──────────┴────────────────────────────┴─────────────┴────────────┘
```

### 1 — Header

Mostrar:

- Nome do aluno.
- Objetivo.
- Status.
- Última atualização.
- Botão **gerar estratégia**.
- Botão **gerar documento**.
- Botão salvar.

### 2 — Sidebar Esquerda

Timeline completa:

- Diagnóstico
- Estratégia
- Macros
- Alimentos
- Suplementação
- Roadmap
- Acompanhamentos
- Documento
- Configurações

Cada item deverá mostrar status: **Concluído / Em andamento / Pendente**.

### 3 — Workspace Central

Principal área do sistema.

- Todo conteúdo aparece aqui.
- Cada módulo abre neste espaço.
- **Nunca abrir em nova página.**

### 4 — Insights Panel

**Sempre visível.** Mostrar, com atualização em tempo real:

- Hipóteses
- Riscos
- Oportunidades
- Recomendações
- Próximas decisões
- Alertas

### 5 — AI Strategy Panel

Exclusivo. Mostrar:

- Resumo do raciocínio da IA.
- Estratégias analisadas.
- Alternativas.
- Justificativas.
- Sugestões.
- Perguntas pendentes.

**Nunca ocultar completamente.**

---

## Navegação

- Nunca utilizar páginas longas.
- Utilizar **navegação modular**.
- Cada módulo abre imediatamente, **sem recarregar a aplicação**.

## Modo Foco

Ao editar: ocultar distrações, expandir Workspace.

## Salvamento

**Auto Save. Sempre.**

## Histórico

Cada alteração gera **versão**. Permitir voltar.

---

## Painel de Decisão

No topo do Workspace, mostrar sempre:

- Objetivo.
- Estratégia escolhida.
- Velocidade.
- Probabilidade de sucesso.
- Maior risco.
- Maior oportunidade.

---

## Motor de Insights

Atualizar automaticamente. Exemplos:

- "Adicionar mais fibras pode reduzir fome noturna."
- "Plano para sábado ainda não foi definido."
- "A meta parece agressiva para o prazo escolhido."

## Motor de Alertas

Detectar, **sempre sugerindo solução**:

- Inconsistências.
- Campos vazios.
- Riscos.
- Estratégias incompatíveis.

## Motor de Comparação

Permitir comparar:

```
Estratégia atual
  ↓ Estratégia alternativa
  ↓ Prós
  ↓ Contras
  ↓ Chance de aderência
```

---

## Dashboard Executivo

Mostrar o **resumo do caso em apenas alguns segundos**, sem necessidade de abrir outros módulos.

## Busca Global

Pesquisar em um único campo:

- Alimentos
- Estratégias
- Suplementos
- Protocolos
- Casos anteriores

## Atalhos

Criar atalhos de teclado para **todas as principais funções**.

## Performance

Mudanças instantâneas. Sem carregamentos desnecessários.

---

## Componentes

Cards, Timeline, Accordion, Tabs, Drawer, Modal, Side Sheet, Popover, Tooltip, Badges, Indicators.

**Sempre reutilizando o Design System.**

## Estilo

- Muito espaço em branco.
- Pouco texto.
- Ícones discretos.
- Informações bem organizadas.
- Visual premium.

## Princípio

O usuário deverá conseguir trabalhar **durante horas sem sentir fadiga visual**.

---

## Regra Final

Antes de adicionar qualquer componente, perguntar:

> Ele ajuda o Montinho a tomar melhores decisões?

Se não → **remover**.

---

## Missão Final

Esta tela deverá se tornar o **centro operacional** do Montinho Nutrition Strategy.

Todo o restante do software deverá existir para alimentar esta Central de Decisão.

> Quando o Montinho abrir um aluno, ele deverá sentir que possui todas as informações
> necessárias para construir uma estratégia de excelência sem precisar navegar por dezenas de telas.
