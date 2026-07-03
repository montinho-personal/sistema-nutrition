import { describe, expect, it } from "vitest";

import {
  findKnowledge,
  getKnowledge,
  listKnowledge,
  referencesFor,
} from "@/modules/knowledge/services";
import { buildStrategy } from "@/modules/strategy/services";
import { computeScoreMap } from "@/modules/diagnosis/services";
import type { AnswerMap } from "@/modules/diagnosis/types";

describe("base de conhecimento", () => {
  it("tem entradas com ids únicos e fontes", () => {
    const all = listKnowledge();
    expect(all.length).toBeGreaterThanOrEqual(12);
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of all) {
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.principle.length).toBeGreaterThan(0);
      expect(e.application.length).toBeGreaterThan(0);
    }
  });

  it("busca tolerante a acento por tema, princípio ou fonte", () => {
    expect(findKnowledge("saciedade").some((e) => e.id === "protein-satiety")).toBe(true);
    expect(findKnowledge("refeed").some((e) => e.id === "refeed-diet-break")).toBe(true);
    // "hidratacao" sem acento encontra "Hidratação e apetite"
    expect(findKnowledge("hidratacao").some((e) => e.id === "hydration-appetite")).toBe(true);
  });

  it("getKnowledge devolve a entrada ou null", () => {
    expect(getKnowledge("protein-satiety")?.category).toBe("saciedade");
    expect(getKnowledge("inexistente")).toBeNull();
  });

  it("referencesFor resolve ids e ignora inexistentes", () => {
    const refs = referencesFor(["protein-satiety", "nada", "safe-deficit-pace"]);
    expect(refs.map((r) => r.id)).toEqual(["protein-satiety", "safe-deficit-pace"]);
    expect(refs[0].source.length).toBeGreaterThan(0);
    expect(referencesFor(undefined)).toEqual([]);
  });
});

describe("integridade da ligação estratégia → conhecimento", () => {
  it("todo knowledgeId usado nas decisões existe na base", () => {
    const answers: AnswerMap = { discipline: 7, supplement_openness: "sim" };
    const strategy = buildStrategy("weight_loss", computeScoreMap(answers), answers);
    const ids = strategy.decisions.flatMap((d) => d.knowledgeIds ?? []);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(getKnowledge(id), `knowledgeId órfão: ${id}`).not.toBeNull();
    }
  });
});
