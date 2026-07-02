"use client";

import * as React from "react";

import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { createStudent, deleteStudent } from "@/modules/students/services/studentRepository";
import type { Student, StudentInput } from "@/modules/students/types";

const EMPTY: Student[] = [];

/**
 * Lista reativa de alunos (store local). Mutações escrevem no repositório,
 * que notifica a store — a UI atualiza sem `setState` em efeitos.
 */
export function useStudents() {
  const raw = useLocalCollection<Student[]>("students", EMPTY);
  const students = React.useMemo(
    () => [...raw].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [raw],
  );

  const add = React.useCallback((input: StudentInput) => createStudent(input), []);
  const remove = React.useCallback((id: string) => deleteStudent(id), []);

  return { students, add, remove };
}
