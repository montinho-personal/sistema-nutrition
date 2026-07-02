import { describe, expect, it } from "vitest";

import { mergeCollection, mergeRecordArrays } from "@/modules/sync/services/mergeCollections";

describe("mergeRecordArrays", () => {
  it("une por id sem perder registros de nenhum lado", () => {
    const local = [{ id: "a", updatedAt: "2026-01-02" }];
    const cloud = [{ id: "b", updatedAt: "2026-01-01" }];
    const merged = mergeRecordArrays(local, cloud);
    expect(merged.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("no conflito, o registro mais recente vence", () => {
    const local = [{ id: "a", updatedAt: "2026-03-10", weightKg: 90 }];
    const cloud = [{ id: "a", updatedAt: "2026-01-01", weightKg: 95 }];
    const merged = mergeRecordArrays(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].weightKg).toBe(90);
  });

  it("registro só na nuvem é restaurado (navegador novo)", () => {
    const merged = mergeRecordArrays([], [{ id: "x", createdAt: "2026-01-01" }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("x");
  });

  it("também funde por studentId (coleções por aluno)", () => {
    const local = [{ studentId: "s1", updatedAt: "2026-02-01" }];
    const cloud = [
      { studentId: "s1", updatedAt: "2026-01-01" },
      { studentId: "s2", updatedAt: "2026-01-01" },
    ];
    const merged = mergeRecordArrays(local, cloud);
    expect(merged.map((r) => r.studentId).sort()).toEqual(["s1", "s2"]);
    expect(merged.find((r) => r.studentId === "s1")?.updatedAt).toBe("2026-02-01");
  });
});

describe("mergeCollection", () => {
  it('kind "array" funde os registros', () => {
    const merged = mergeCollection("array", [{ id: "a" }], [{ id: "b" }]);
    expect(Array.isArray(merged)).toBe(true);
    expect((merged as unknown[]).length).toBe(2);
  });

  it('kind "object" mantém o local quando presente', () => {
    expect(mergeCollection("object", { fatGPerKg: 1 }, { fatGPerKg: 2 })).toEqual({ fatGPerKg: 1 });
  });

  it('kind "object" usa a nuvem quando o local está ausente', () => {
    expect(mergeCollection("object", null, { fatGPerKg: 2 })).toEqual({ fatGPerKg: 2 });
  });
});
