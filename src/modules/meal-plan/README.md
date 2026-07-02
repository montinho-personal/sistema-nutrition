# Módulo `meal-plan` — Plano Alimentar (cardápio)

A dieta é **consequência** das decisões estratégicas (Documento 00) — nunca o ponto de partida.

## Objetivo

Montar o cardápio do dia a partir da **Estratégia + Macros** e do **Banco de Alimentos**:
distribuir as calorias nas N refeições da estratégia, escolher os alimentos e calcular as gramas
para bater o alvo de cada refeição. Determinístico e auditável (Documento 08 — regra, não IA).

## A cadeia

Diagnóstico concluído → Estratégia (velocidade, nº de refeições, táticas) → Macros (peso) →
**Plano Alimentar**. Sem qualquer elo, o cardápio não é gerado.

## Estrutura

- `constants/parameters.ts` — **todos os parâmetros**: distribuição das refeições (3–6),
  composição por slot, faixas de porção, limiares de classificação, pesos de ranqueamento.
  Documento 08: nenhum número mágico na lógica.
- `types/` — plano, refeição, item, papéis.
- `services/`:
  - `mealPlanEngine.ts` — classifica o papel do alimento (proteína/carbo/gordura/vegetal),
    ranqueia por aderência ao objetivo + timing + saciedade/praticidade/orçamento, escolhe os
    alimentos (variante determinística) e resolve as porções com um **solver de resíduo
    iterativo** (Gauss-Seidel): cada alimento é ajustado para o alvo do seu macro *menos* o que
    os outros já contribuem — proteína e gordura são alvos duros, o carboidrato fecha as calorias
    restantes. Elimina o overshoot da dupla contagem (a proteína dos cereais/gorduras não estoura
    o alvo).
  - `dietaryFilters.ts` — restrições da anamnese (vegetariano/vegano/sem lactose/sem glúten).
  - `mealPlanRepository.ts` — persiste só a **variante** escolhida (local-first).
- `hooks/use-meal-plan-variant.ts` — variante reativa ("gerar outra opção").
- `components/` — índice (escolher aluno), cartão de refeição, visão completa do cardápio.
- `tests/` — cobertura do motor (papéis, estrutura, restrições, determinismo).

## Reuso

Reaproveita o Banco de Alimentos (`curatedFoods`, `goalFitScore`, `COST_ORDER`) e os motores de
Estratégia e Macros — nada é reconstruído (AEC Regra 8). Quando o Supabase for conectado, os
alimentos vêm da view `foods_enriched` sem mudar a UI.
