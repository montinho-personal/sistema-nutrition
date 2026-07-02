# Montinho Nutrition Strategy

> Um **Sistema Inteligente de Decisão Nutricional** para uso profissional — não um gerador de dietas.

O software existe para responder: **"Qual é a melhor estratégia nutricional para ESTA pessoa?"**
A dieta é apenas uma consequência das decisões — nunca o ponto de partida. O sistema nunca
substitui o julgamento profissional: ele o **potencializa**.

📚 Toda a filosofia, arquitetura e especificações vivem em [`docs/`](docs/README.md).
O documento de maior autoridade de produto é o
[Documento 00 — Vision & Product Philosophy](docs/00-vision-product-philosophy.md).

---

## Tecnologias

| Camada                     | Stack                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| Frontend                   | Next.js (App Router) • React • TypeScript • Tailwind CSS v4       |
| Design System              | shadcn/ui (vendorizado) • Radix UI • Framer Motion • lucide-react |
| Formulários & validação    | React Hook Form • Zod                                             |
| Dados & estado de servidor | TanStack Query                                                    |
| Backend                    | Supabase (PostgreSQL, Auth, Storage)                              |

## Como instalar

```bash
npm install
```

## Como executar

```bash
# 1. Configure o ambiente (opcional para visualizar a interface)
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase

# 2. Aplique as migrações (supabase/migrations) no seu projeto Supabase

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Sem Supabase configurado a interface roda normalmente (sem autenticação) — útil para
desenvolvimento visual. Com Supabase configurado, o login é obrigatório.

Outros comandos:

```bash
npm run build    # build de produção
npm run lint     # ESLint
npm run format   # Prettier
```

## Estrutura do projeto

```
├── docs/                  # Documentos de produto e arquitetura (00–13)
├── supabase/migrations/   # Migrações SQL (única forma de alterar o banco)
├── src/
│   ├── app/               # Rotas (App Router) — apenas apresentação
│   │   ├── (app)/         # Espaço autenticado: Central de Decisão
│   │   └── (auth)/        # Login
│   ├── modules/           # Módulos de domínio (diagnosis, strategy, ...)
│   ├── shared/
│   │   ├── components/    # Componentes globais (ScoreCard, InsightCard, ...)
│   │   │   ├── ui/        # Design System (button, card, dialog, ...)
│   │   │   └── layout/    # App Shell de 5 áreas (Documento 09)
│   │   ├── hooks/         # Hooks compartilhados
│   │   ├── services/      # Logger, erros e serviços compartilhados
│   │   ├── lib/           # Utilitários base (cn)
│   │   └── types/         # Tipos globais
│   ├── config/            # Env (validado com Zod), app, navegação
│   ├── database/          # Clientes Supabase (browser/server)
│   ├── prompts/           # Prompts centralizados e versionados
│   ├── knowledge-base/    # Bibliotecas de conhecimento estruturado
│   └── proxy.ts           # Sessão + proteção de rotas (Next 16)
```

## Arquitetura

- **Organização por domínio**, nunca por tipo de arquivo (Documento 08).
- **Regras de negócio somente em services** — componentes React apenas apresentam
  (Documento 11).
- **Base estruturada → regras → algoritmos → IA**, nesta ordem. A IA entra apenas onde
  realmente agrega interpretação (Documento 08).
- **Banco**: UUID, auditoria em toda tabela, soft delete, RLS, migrações sempre
  (Documento 10).
- **Hierarquia em conflito de documentos**: AEC (12) → MSA (08) → Vision (00) → demais PRDs
  (Documento 13).

## Padrões

- Validação sempre com **Zod** — nenhuma validação espalhada.
- Nomes autoexplicativos (`calculateProteinTarget`, nunca `calc`).
- Nenhum número mágico: parâmetros estratégicos são configuráveis.
- Todo componente: pequeno, tipado, documentado, com responsabilidade única.
- Prompts centralizados em `src/prompts/`, versionados.
- Paleta premium: branco, preto, cinzas e **dourado discreto** apenas para destaques
  estratégicos (Documento 02).
