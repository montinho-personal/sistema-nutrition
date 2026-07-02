# DOCUMENTO 15 — Montinho Nutrition Strategy

## Sprint 1.3 — Food Intelligence Engine (FIE) — Banco Inteligente de Alimentos

---

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| **Classificação** | Sprint de Implementação        |
| **Sprint**        | 1.3 — Food Intelligence Engine |

> **Missão:** construir o banco inteligente de alimentos. Este NÃO será apenas um banco
> nutricional — será um **motor de conhecimento alimentar** utilizado por todos os módulos.
> Cada alimento possui características nutricionais, estratégicas, comportamentais e práticas.

---

## Objetivo

Criar uma base única de conhecimento sobre alimentos. Toda decisão envolvendo refeições consulta
obrigatoriamente este banco. **Nenhum alimento é tratado apenas como calorias e macros.**

## Fontes dos Dados (hierarquia obrigatória)

1. **TBCA** (Tabela Brasileira de Composição de Alimentos) — fonte principal.
2. **TACO** — apenas quando necessário.
3. **Base internacional reconhecida** — só quando o alimento não existir nas bases brasileiras.
4. **Estimativas** — último recurso, sempre sinalizado.

## Filosofia

O banco deverá **conhecer o alimento** — não apenas seus nutrientes.

---

## Perfis de Cada Alimento

- **Identificação:** nome, categoria, grupo alimentar, subgrupo, descrição, sinônimos, fonte.
- **Valores nutricionais:** energia, proteínas, carboidratos, gorduras, fibras, água, vitaminas,
  minerais, sódio, potássio, perfil lipídico (quando disponível).
- **Medidas:** 100 g, unidade, colher, xícara, fatia, concha, copo, medidas caseiras.
- **Classificação estratégica** (automática): excelente / bom / neutro / pouco indicado / depende do contexto.
- **Saciedade:** muito alta / alta / moderada / baixa / muito baixa — justificada.
- **Praticidade:** tempo de preparo, cozimento, congela, transporta, consumir frio, preparo
  antecipado, marmitas, viagens, trabalho.
- **Financeiro:** muito barato → muito caro (ajustável por região).
- **Digestibilidade:** muito fácil / fácil / moderada / lenta / depende da preparação.
- **Utilização:** pré-treino, pós-treino, ceia, café da manhã, lanche, jantar, emergência, viagens.
- **Objetivo:** excelente para emagrecimento / hipertrofia / recomposição / performance / manutenção.
- **Comportamental:** saciedade, palatabilidade, risco de exagero, controle da fome, poucas
  refeições, alta frequência.
- **Logístico:** refrigeração, fora da geladeira, congela bem, estraga rápido, transporte.
- **Substituição:** equivalentes, econômicos, vegetarianos, veganos, mais práticos, mais saciantes.
- **Restrições:** sem lactose, sem glúten, vegetariano, vegano, kosher, halal, e classificações futuras.
- **Popularidade:** frequência de uso, aceitação, facilidade de compra, disponibilidade.
- **Científico:** origem dos dados, última atualização, nível de confiança.

## Tags

Alta proteína, alta fibra, alta saciedade, pré-treino, pós-treino, rápido preparo, baixo custo,
portátil, congelável, baixa caloria, alta densidade energética.

---

## Motores

- **Busca:** por nome, categoria, objetivo, tag, nutriente, preço, praticidade, saciedade, tempo
  de preparo.
- **Filtros:** combináveis — ex.: ricos em proteína → baixo custo → alta saciedade → preparo < 10
  min → adequados para marmitas.
- **Recomendação:** com base em objetivo, rotina, orçamento, preferências, histórico, aderência.
- **Alertas:** baixa proteína, muito processado, alto sódio, baixa saciedade — sempre
  contextualizando. **Nunca demonizar alimentos.**

---

## Evolução

Adicionar novos alimentos, atualizar informações e criar novos atributos **sem alterar a
arquitetura**.

## Não Implementar Nesta Sprint

Receitas, plano alimentar, IA, substituições automáticas — módulos que **utilizarão** este banco depois.

## Entregáveis

- ✔ Banco estruturado.
- ✔ Importação preparada para TBCA.
- ✔ Estrutura preparada para TACO.
- ✔ Sistema de categorias, tags, filtros e atributos estratégicos.
- ✔ Base pronta para integração com o Nutrition Decision Engine.

## Critérios de Aceitação

- Crescimento contínuo; classificação por dezenas de atributos; busca rápida; filtros intuitivos;
  estrutura suportando milhares de alimentos sem perda de desempenho.
- O banco deixa de ser uma tabela nutricional e se torna uma **Base Inteligente de Alimentos**.

## Princípio Final

> O Food Intelligence Engine deverá pensar como um nutricionista experiente — não apenas informar
> nutrientes, mas compreender **quando, como e por que** um alimento faz sentido para cada estratégia.
