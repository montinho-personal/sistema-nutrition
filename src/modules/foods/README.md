# Módulo `foods` — Food Intelligence Engine (FIE)

Banco inteligente de alimentos (Documento 15). O alimento deixa de ser "calorias + macros" e
passa a ser conhecido em múltiplos perfis — nutricional, estratégico, comportamental, logístico.

## Objetivo

Base única de conhecimento sobre alimentos, consultada por todos os módulos. Nenhum alimento é
tratado apenas como calorias e macronutrientes.

## Estrutura

```
foods/
├── types/         # tipos de domínio (Food, atributos, alertas, critérios)
├── constants/     # limiares e rótulos configuráveis — sem números mágicos
├── validators/    # schemas Zod (filtros, importação)
├── data/          # dataset curado (fallback/demonstração; espelha o seed SQL)
├── services/      # TODA a regra de negócio (determinística, sem IA)
│   ├── foodMetrics.ts         # densidade energética, proteína/100 kcal, rótulos
│   ├── foodClassification.ts  # classificação estratégica automática + justificativas
│   ├── foodAlerts.ts          # alertas contextuais (nunca demonizam)
│   ├── foodFilters.ts         # busca, filtros combináveis e recomendação
│   ├── foodRepository.ts      # acesso a dados (Supabase ou dataset curado)
│   └── tbcaImport.ts          # importador tipado TBCA/TACO
├── components/    # UI (lista, filtros, perfil do alimento)
└── tests/         # testes unitários das regras
```

## Regras determinísticas (Documento 08)

A classificação estratégica, os rótulos qualitativos, os alertas e os filtros são **regras**,
não IA. Um `strategic_override` permite o profissional sobrescrever a classificação computada.

## Fontes de dados

Hierarquia: **TBCA → TACO → base internacional → estimativa** (sempre sinalizada). A composição
é armazenada por 100 g com origem rastreável (`source_code`, `data_confidence`).

## Importação em massa

`services/tbcaImport.ts` consome um export CSV/JSON já baixado da TBCA/TACO, valida com Zod e
produz linhas prontas para `insert into foods`. Não faz scraping.

## Schema

Migrações `0004` (base), `0014` (extensão FIE) e `0015` (seed curado). Ver
[`docs/database-schema.md`](../../../docs/database-schema.md).
