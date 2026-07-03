# Módulo `knowledge` — Base de Conhecimento (V2 — #3)

O repositório de princípios e protocolos que **embasa as decisões do sistema**. As justificativas
deixam de ser texto solto no código e passam a apontar para uma fonte rastreável (Documento 00 —
transparência; Documento 12 — decisão sempre justificada).

## Estrutura

- `types/` — entrada de conhecimento, fonte (com tipo/força de evidência), referência enxuta.
- `data/knowledgeBase.ts` — dataset curado: princípio + como o sistema aplica + fontes + tags.
- `constants/` — rótulos das categorias e dos tipos de fonte (pt-BR).
- `services/` — consulta pura: `listKnowledge`, `getKnowledge`, `findKnowledge` (busca tolerante a
  acento) e `referencesFor(ids)` (monta as referências para anexar a uma decisão).
- `components/` — a base navegável (busca + categorias + cartões com fontes).
- `tests/` — integridade do dataset e a **ligação estratégia → conhecimento** (todo `knowledgeId`
  usado nas decisões existe na base).

## Como se conecta ao resto

Cada decisão do `strategyEngine` carrega `knowledgeIds`. O `strategy-result` resolve esses ids em
referências (`referencesFor`) e o `DecisionCard` exibe a seção **"Fundamentos"** com link para a
página `/knowledge`. Assim, toda escolha aponta para o princípio e a fonte que a sustentam.

## Sobre as fontes

Referências consolidadas da literatura (diretrizes, consensos, meta-análises, ensaios, revisões). O
objetivo é **rastreabilidade e transparência**, não citação acadêmica formal — a base é curada e
evolui como qualquer outro dado do sistema.
