# DOCUMENTO 08 — Montinho Nutrition Strategy

## Master Software Architecture (MSA)

---

| Campo | Valor |
| --- | --- |
| **Classificação** | Master Architecture Document |
| **Versão** | V1.0 |
| **Prioridade** | Absoluta |

> Este documento define toda a **arquitetura técnica** do Montinho Nutrition Strategy.
>
> **Nenhum código deverá ser desenvolvido sem seguir estas diretrizes.**
> Todo novo módulo deverá respeitar este documento.

---

## Missão

Construir um software:

- Extremamente organizado.
- Modular.
- Escalável.
- Fácil de manter.
- Fácil de evoluir.
- Bonito.
- Rápido.
- Seguro.

Mesmo sendo inicialmente um projeto para uso exclusivo do Montinho Personal.

---

## Filosofia

Sempre pensar:

> "Como uma empresa avaliada em milhões desenvolveria esse software?"

Nunca pensar:

> "Como fazer funcionar rapidamente?"

---

## Princípios

Todo o projeto deverá seguir:

- Modularização
- Baixo acoplamento
- Alta coesão
- Código limpo
- Componentização
- Reutilização
- Legibilidade
- Escalabilidade

---

## Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Hook Form
- Zod
- TanStack Query

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions

### IA

- **Claude Code** como principal ambiente de desenvolvimento.
- Arquitetura preparada para integração futura com diferentes modelos.
- Toda lógica deverá ficar **desacoplada do provedor de IA**.

---

## Organização

O projeto deverá ser dividido **por domínio**. Nunca por tipo de arquivo. Exemplo:

```
modules/
├── diagnosis/
├── strategy/
├── nutrition/
├── foods/
├── supplementation/
├── reports/
├── followup/
├── settings/
└── shared/
```

---

## Componentização

- Todos os componentes deverão ser reutilizáveis.
- Nunca duplicar código.
- Cada componente deverá possuir **apenas uma responsabilidade**.

## Design System

Todos os elementos deverão utilizar um **único Design System**:

Botões, inputs, cards, tabelas, gráficos, alertas, badges, modais. **Tudo reutilizável.**

---

## Banco de Dados

Separar claramente:

- Dados do aluno
- Diagnóstico
- Estratégias
- Macros
- Alimentos
- Suplementação
- Acompanhamentos
- Roadmap
- Documentos
- Biblioteca de conhecimento

## Versionamento

Toda mudança importante deverá ser **rastreável**.

Permitir evolução futura sem quebrar módulos antigos.

## Autenticação

- Inicialmente: **somente Montinho**.
- Preparar arquitetura para múltiplos usuários no futuro. **Sem implementar agora.**

---

## Configurações

Todo cálculo deverá ser **parametrizável**. Exemplo:

- Proteína
- Velocidade do emagrecimento
- Déficits
- Superávits
- Fatores de atividade

**Nunca deixar valores fixos espalhados pelo código.**

## Bibliotecas

Todo banco de conhecimento deverá ser independente:

- Biblioteca de alimentos
- Biblioteca de estratégias
- Biblioteca de suplementos
- Biblioteca científica
- Biblioteca de casos

---

## Motor de Decisão

- **Nunca misturar regras de negócio com interface.**
- Toda inteligência deverá ficar isolada.
- Interface apenas apresenta resultados.

## Regra da IA (arquitetura)

Nunca depender exclusivamente da IA. Sempre combinar:

1. Base estruturada.
2. Regras.
3. Algoritmos.
4. IA.

---

## Segurança

- Validar entradas.
- Evitar inconsistências.
- Nunca perder dados.
- Auto Save.
- Histórico.
- Logs.
- Backup.

## Performance

- Carregamento rápido.
- Lazy Loading.
- Componentes leves.
- Consultas otimizadas.
- Cache inteligente.

## Testes

Cada módulo deverá possuir:

- Teste funcional
- Teste visual
- Teste lógico
- Teste de regras
- Teste de fluxo

---

## Padrão de Nomes

- Nomenclatura consistente.
- Nunca abreviações confusas.
- Nomes autoexplicativos.

## Documentação

Cada módulo deverá conter:

- Objetivo
- Entradas
- Saídas
- Dependências
- Fluxo
- Critérios de aceite

---

## Roadmap de Integrações

O software deverá ser **preparado** para futuras integrações — **sem implementar agora**,
apenas preparar arquitetura:

- Google Calendar
- WhatsApp
- Google Drive
- Google Fit
- Apple Health
- Wearables
- MFIT

---

## Regras de Desenvolvimento

### Princípio de Evolução
Toda nova funcionalidade deverá responder: *pode ser adicionada sem alterar módulos existentes?*
Se não → **reprojetar**.

### Regra do Código
Antes de escrever qualquer função, perguntar: *ela poderá ser reutilizada?*
Se sim → transformar em **serviço compartilhado**.

### Regra da Interface
Antes de criar qualquer tela, perguntar: *existe componente semelhante?*
Se sim → **reutilizar. Nunca duplicar.**

### Regra da IA
Antes de perguntar para a IA: *existe resposta determinística?*
Se existir → utilizar regra. **Usar IA apenas onde ela realmente agrega inteligência.**

---

## Princípio Final

O Montinho Nutrition Strategy deverá **parecer simples para o usuário**, mas possuir uma
arquitetura sólida, organizada e preparada para evoluir durante muitos anos.

O objetivo não é apenas construir um software.

> O objetivo é construir uma **plataforma capaz de crescer continuamente sem perder qualidade**.
