# Módulo `students`

Cadastro e gestão de alunos (Documento 10 — Domain Students).

## Objetivo

Perfil permanente do aluno — o ponto de partida de toda a jornada. Do cadastro nasce o
Diagnóstico Estratégico (módulo `diagnosis`).

## Estrutura

- `types/` — `Student`, `StudentInput`, objetivos e sexo.
- `validators/` — schema Zod do formulário.
- `constants/` — rótulos pt-BR.
- `services/studentRepository.ts` — CRUD **local-first** (store reativa em `localStorage`),
  pronto para uma implementação Supabase atrás da mesma interface.
- `hooks/use-students.ts` — lista reativa (`useSyncExternalStore`).
- `components/` — formulário (dialog) e lista.

## Persistência

Hoje grava no navegador (funciona sem backend). Quando o Supabase for conectado, os dados
migram para `montinho.students` sem mudar a UI.
