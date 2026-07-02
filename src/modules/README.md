# Módulos de Domínio

Cada módulo é um **produto independente** (Documento 12 — Regra Nº 10), organizado por domínio
(Documento 08), nunca por tipo de arquivo.

## Anatomia padrão de um módulo (Documento 11)

```
/modules/<nome-do-modulo>
├── components/   # UI específica do módulo
├── hooks/        # comportamento reutilizável
├── services/     # TODA a regra de negócio (nunca em componentes React)
├── types/        # tipos do domínio
├── validators/   # schemas Zod
├── constants/    # constantes do domínio
├── tests/        # testes do módulo
└── README.md     # objetivo, fluxo, entradas, saídas, dependências, exemplos
```

## Módulos previstos (Documento 08)

| Módulo            | Documentos de referência      | Status         |
| ----------------- | ----------------------------- | -------------- |
| `diagnosis`       | 03A, 03B, 06, 07              | Próxima sprint |
| `strategy`        | 03C, 03D, 03H, 04             | Planejado      |
| `nutrition`       | 01 (macros), 04               | Planejado      |
| `foods`           | 03G (Biblioteca 2), 10        | Planejado      |
| `supplementation` | 03G (Biblioteca 3)            | Planejado      |
| `reports`         | 02 (Documento Final)          | Planejado      |
| `followup`        | 03E, 03F, 05                  | Planejado      |
| `settings`        | 08 (parâmetros configuráveis) | Planejado      |

Componentes, hooks e serviços **compartilhados** vivem em `src/shared/`.
