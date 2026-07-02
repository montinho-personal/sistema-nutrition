# Módulo `roadmap` — Roadmap da Transformação

O sistema entrega um **caminho**, não uma dieta (Documento 03E — Transformation Roadmap Engine).

## Objetivo

Mostrar a jornada do aluno em **7 fases** (Diagnóstico → Preparação → Implementação →
Consolidação → Otimização → Transição → Manutenção), com o Painel da Transformação e a linha do
tempo — onde começou, onde está e o próximo passo.

## Avanço por sinais, nunca só por tempo

A fase atual é derivada de forma determinística do estado real (Documento 03E — critérios de
evolução): diagnóstico concluído, estratégia definida, nº de acompanhamentos, semanas decorridas
e direção do objetivo. Nunca avança apenas porque o tempo passou.

## Estrutura

- `constants/phases.ts` — as 7 fases (objetivo, problema, por que existe, quando termina,
  indicador de sucesso) + limiares de avanço e cadência de revisão. Documento 08: nenhum número
  mágico na lógica.
- `types/` — fases, painel, jornada.
- `services/roadmapEngine.ts` — determina a fase atual, os status das 7 fases, o Painel
  (desafio/oportunidade/próxima meta/próxima revisão) e a linha do tempo.
- `components/` — índice, Painel da Transformação, linha do tempo das fases (reusa o `Timeline`
  do Design System).
- `tests/` — cobertura do motor (fase por sinais, painel, cadência).

## Reuso

Não persiste nada próprio: lê o estado dos outros módulos e **reaproveita** os motores de
Diagnóstico (resumo executivo), Estratégia/Macros (direção, velocidade, revisão) e
Acompanhamentos (evolução). No futuro, materializa em `montinho.roadmaps` sem mudar a UI.

## Limite honesto

Transição e Manutenção dependem de "objetivo atingido", que ainda não é medido (falta um peso-alvo
explícito). Para déficit/superávit, a jornada é acompanhada até a Otimização; objetivos de
manutenção alcançam a fase Manutenção. As fases seguintes aparecem como próximos passos.
