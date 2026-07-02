# DOCUMENTO 11 — Montinho Nutrition Strategy

## Project Foundation & Engineering Standards (PFES)

---

| Campo             | Valor                  |
| ----------------- | ---------------------- |
| **Classificação** | Master Engineering PRD |
| **Prioridade**    | Absoluta               |

> Este documento define os **padrões obrigatórios de engenharia, arquitetura e organização** do projeto.
>
> Todos os módulos deverão seguir rigorosamente estas diretrizes. **Nenhuma exceção será permitida.**

---

## Missão

Construir um software que continue organizado mesmo após milhares de linhas de código.

O projeto deverá ser fácil de entender, fácil de manter e fácil de evoluir.

## Filosofia

Sempre escrever código pensando no **próximo desenvolvedor** — mesmo que esse desenvolvedor
seja você daqui a dois anos.

O código deverá **explicar sua intenção**. Não apenas funcionar.

---

## Princípios de Engenharia

- Cada módulo deve possuir apenas uma responsabilidade.
- Cada função deve resolver apenas um problema.
- Cada componente deve ter uma finalidade clara.
- Evitar dependências desnecessárias.
- Evitar lógica duplicada.
- Evitar acoplamento.

---

## Estrutura do Projeto

```
/src
├── /modules
├── /shared
│   ├── /components
│   ├── /hooks
│   ├── /services
│   ├── /lib
│   ├── /types
│   └── /utils
├── /config
├── /database
├── /prompts
├── /knowledge-base
└── /tests
/public
```

## Padrão dos Módulos

Cada módulo deverá conter:

- UI
- Components
- Hooks
- Services
- Types
- Validators
- Constants
- Tests
- README

**Nunca misturar responsabilidades.**

---

## Padrões de Código

### Componentes

Cada componente deverá ser: **pequeno, reutilizável, tipado, documentado, testável**.
Nunca criar componentes gigantes.

### Services

Toda regra de negócio ficará em Services.
**Nunca colocar regras importantes dentro dos componentes React.**

### Hooks

Todo comportamento reutilizável deverá ser extraído para Hooks.

### Types

Todo tipo deverá ficar centralizado. Nunca repetir interfaces.

### Validators

Toda validação deverá utilizar **Zod**. Nenhuma validação espalhada pelo projeto.

### Erros

Toda exceção deverá possuir: mensagem clara, contexto, possível solução.
Nunca lançar erros genéricos.

### Logs

Registrar: erro, aviso, ação importante.
**Nunca registrar informações sensíveis.**

---

## Padrão dos Prompts

Todos os prompts internos deverão ficar **centralizados** (`/prompts`).
Nunca escrever prompts diretamente dentro do código.

Cada prompt deverá possuir:

- Nome
- Objetivo
- Entradas
- Saídas
- Versão
- Histórico

## Padrão da Base de Conhecimento

Separar: alimentos, estratégias, suplementos, regras, protocolos. **Nunca misturar.**

---

## Padrão dos Testes

Cada módulo deverá possuir:

- Teste unitário
- Teste de integração
- Teste de fluxo
- Teste visual quando necessário

## Padrão das Migrações

Toda alteração no banco deverá gerar **migração**. Nunca alterar tabelas manualmente.

---

## Padrão de Nomenclatura

Nomes claros, sem abreviações, sem nomes genéricos.

| ✔ Correto                      | ✘ Nunca  |
| ------------------------------ | -------- |
| `calculateProteinTarget()`     | `calc()` |
| `generateNutritionStrategy()`  | `run()`  |
| `buildTransformationRoadmap()` | `data()` |

## Padrão de Documentação

Todo módulo deverá possuir README contendo:

- Objetivo
- Fluxo
- Entradas
- Saídas
- Dependências
- Exemplos

---

## Padrão de Performance

- Evitar renderizações desnecessárias.
- Lazy Loading.
- Memoização quando apropriado.
- Consultas otimizadas.
- Componentes leves.

## Padrão de Acessibilidade

Todos os componentes deverão possuir:

- Labels.
- Contraste adequado.
- Navegação por teclado.
- Feedback visual.

## Padrão de Segurança

**Nunca confiar em dados do cliente.** Sempre validar. Sempre sanitizar. Sempre proteger.

## Padrão de Configuração

Todos os parâmetros estratégicos deverão ser configuráveis.
**Nunca deixar números mágicos espalhados pelo código.**

## Padrão de IA

A IA deverá ser utilizada **apenas para decisões que realmente exigem interpretação**.
Cálculos determinísticos deverão ser implementados por código.

---

## Padrão de Qualidade

Antes de considerar um módulo concluído, responder:

- É reutilizável?
- É escalável?
- É testável?
- É documentado?
- É intuitivo?
- Segue o Design System?

## Checklist de Pull Request

Antes de finalizar qualquer módulo, verificar:

- [ ] Código limpo
- [ ] Sem duplicação
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Componentes reutilizáveis
- [ ] Performance adequada
- [ ] Acessibilidade
- [ ] Responsividade
- [ ] Segurança

---

## Visão Futura

A arquitetura deverá permitir, **sem necessidade de reconstrução**:

- Aplicativo mobile.
- API pública.
- Integração com wearables.
- Integração com IA avançada.
- Dashboard analítico.

---

## Princípio Final

A qualidade do Montinho Nutrition Strategy não será medida apenas pela inteligência das
estratégias nutricionais.

Ela será medida também pela **excelência da engenharia de software**.

Cada linha de código deverá refletir organização, clareza, robustez e capacidade de evolução.

> Este documento deverá servir como o **manual oficial de engenharia** do projeto.
