# DOCUMENTO 13 — Montinho Nutrition Strategy

## Sprint 1.1 — Foundation Setup (Primeiro Prompt de Implementação)

---

| Campo             | Valor                   |
| ----------------- | ----------------------- |
| **Classificação** | Sprint de Implementação |
| **Sprint**        | 1.1 — Foundation Setup  |

> **Missão:** iniciar o desenvolvimento do software Montinho Nutrition Strategy.
>
> Não criar apenas protótipos. Construir um **software real, profissional, modular e escalável**,
> seguindo rigorosamente todos os documentos anteriores do projeto.

### Prioridade em caso de conflito entre documentos

1. AI Engineering Constitution (Doc 12)
2. Master Software Architecture (Doc 08)
3. Vision & Product Philosophy (Doc 00)
4. Demais PRDs

---

## Objetivo desta Sprint

Construir toda a **fundação** do projeto.

**Nenhuma regra de negócio deverá ser implementada nesta Sprint.**

O objetivo é deixar o projeto preparado para crescer.

---

## Stack (obrigatória)

Next.js • React • TypeScript • Tailwind CSS • shadcn/ui • Framer Motion • React Hook Form •
Zod • TanStack Query • Supabase • PostgreSQL

---

## Criar o Projeto

- Inicializar projeto.
- Configurar lint.
- Configurar prettier.
- Configurar aliases.
- Configurar organização de pastas.
- Configurar variáveis de ambiente.
- Configurar tema.
- Configurar fontes.
- Configurar Dark Mode.
- Preparar internacionalização futura.

## Estrutura de Pastas

Criar estrutura organizada por domínio. Exemplo:

```
/src
├── /modules
├── /shared
│   ├── /components
│   ├── /services
│   ├── /hooks
│   ├── /types
│   └── /utils
├── /config
├── /database
├── /prompts
├── /knowledge-base
├── /tests
└── /assets
```

## Design System

Implementar Design System completo — todos reutilizáveis:

Botões, Cards, Inputs, Select, Combobox, Accordion, Drawer, Modal, Dialog, Toast, Badge,
Tabs, Timeline, Progress, Indicators, Score Cards.

## Tema Visual

Criar identidade **premium**, inspirada em: Linear, Notion, Stripe, Raycast, Vercel.

Paleta: branco, preto, cinzas, **dourado discreto apenas para destaques estratégicos**.

Muito espaço em branco. Tipografia moderna. Interface extremamente limpa.

## Layout Base

Construir layout principal: Sidebar, Header, Workspace, Painel de Insights, Painel de IA,
Footer discreto. Preparar para módulos futuros.

## Navegação

Criar sistema de navegação — mesmo que algumas telas estejam vazias, preparar toda a navegação:

Dashboard, Alunos, Diagnóstico, Estratégia, Plano Alimentar, Alimentos, Suplementação,
Roadmap, Acompanhamentos, Relatórios, Configurações.

## Autenticação

Implementar autenticação utilizando **Supabase Auth**.

Inicialmente apenas um usuário. Preparar arquitetura para múltiplos usuários.

## Banco

- Conectar Supabase.
- Criar primeiras migrações.
- **Não criar todas as tabelas ainda.** Criar apenas estrutura inicial.

## Utilitários

Criar: Sistema de Logs, Sistema de Erros, Sistema de Configuração, Helpers, Constantes,
Tipos Globais.

## Componentes Globais

Criar: Loading Screen, Skeleton, Error Boundary, Empty State, Page Header, Section Header,
Status Badge, Metric Card, Insight Card, Decision Card, Score Card.

## Padrões

Todo componente deverá possuir: tipagem, documentação, responsabilidade única, preparação
para testes.

## Responsividade

Desktop prioritário. Tablet completo. Mobile funcional.

## Performance

Preparar: Lazy Loading, Code Splitting, Cache. Sem otimizações prematuras — mas arquitetura
preparada.

## Documentação

Criar README contendo: como instalar, como executar, estrutura do projeto, tecnologias,
arquitetura, padrões.

---

## Não Implementar Ainda

Não criar nesta Sprint (serão implementados nas próximas):

- Diagnóstico.
- Cálculo de macros.
- Plano alimentar.
- Banco de alimentos.
- Motor de IA.
- Entrevista.
- Roadmap.

---

## Entregáveis

- ✔ Estrutura profissional.
- ✔ Design System completo.
- ✔ Layout principal.
- ✔ Navegação funcionando.
- ✔ Tema visual premium.
- ✔ Supabase conectado.
- ✔ Autenticação funcionando.
- ✔ Arquitetura pronta para crescimento.
- ✔ Documentação inicial.

## Critérios de Aceitação

Esta Sprint será aprovada apenas se:

- A estrutura estiver organizada.
- A interface transmitir qualidade premium.
- O código estiver limpo.
- Todos os componentes forem reutilizáveis.
- A arquitetura estiver preparada para suportar os próximos módulos **sem refatorações significativas**.

---

## Mentalidade

Você não está criando um MVP improvisado.

Você está construindo a **fundação de um software que deverá evoluir durante muitos anos**.

Cada decisão arquitetural deverá refletir excelência em engenharia, organização e experiência
do usuário.

> Se existir dúvida entre rapidez e qualidade arquitetural, escolha a arquitetura que permita
> evolução contínua sem complexidade desnecessária.
