# Módulo `supplements` — Suplementação estratégica

Suplemento nunca é protagonista (Documentos 00/04 Etapa 10; 03G — Biblioteca 3).

## Objetivo

Avaliar, a partir das **dificuldades reais** do aluno, quais suplementos realmente facilitam a
rotina — sempre depois de perguntar se a **comida** já resolve. Determinístico e explicável
(Documento 08).

## Primeiro a dificuldade, depois o suplemento

Para cada item do catálogo, o motor verifica se há uma dificuldade concreta que o justifique
(treino, praticidade da proteína, saciedade, dieta sem carne, sono, saúde). Só então indica —
respeitando a **abertura** do aluno e o **orçamento**. Cada cartão mostra qual dificuldade resolve
e a **alternativa alimentar primeiro**.

## Estrutura

- `constants/catalog.ts` — catálogo curado (espelha `montinho.supplements`): objetivo, problema
  que resolve, mecanismo, dose, timing, alternativa alimentar, evidência e custo-benefício.
- `constants/parameters.ts` — limiares, ordem e rótulos (Documento 08 — nada mágico na lógica).
- `services/supplementEngine.ts` — regras de indicação + resolução da situação (recomendado /
  avaliar / não necessário / não indicado).
- `components/` — índice, cartão do suplemento e a visão avaliada.
- `tests/` — cobertura das regras (dificuldade, abertura, orçamento, ordenação).

## Situações

- **Recomendado** — uma dificuldade concreta o justifica.
- **Avaliar** — pode ajudar, mas orçamento/abertura pedem cautela (exceto itens de alto valor,
  como creatina e B12, que seguem recomendados).
- **Não necessário** — nenhuma dificuldade atual o justifica.
- **Não indicado agora** — o aluno prefere resolver só pela comida.

Parte apenas do diagnóstico concluído; quando o Supabase for conectado, o catálogo vem de
`montinho.supplements` sem mudar a UI.
