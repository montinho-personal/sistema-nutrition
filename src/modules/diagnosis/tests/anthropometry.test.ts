import { describe, expect, it } from "vitest";

import {
  readAnthropometry,
  resolveAgeYears,
  resolveHeightCm,
} from "@/modules/diagnosis/services";

describe("readAnthropometry — peso, altura e idade da anamnese", () => {
  it("lê os três valores quando presentes e válidos", () => {
    const out = readAnthropometry({ current_weight_kg: 82, height_cm: 172, age_years: 34 });
    expect(out).toEqual({ weightKg: 82, heightCm: 172, ageYears: 34 });
  });

  it("aceita números digitados como texto (respostas vindas de input)", () => {
    const out = readAnthropometry({ current_weight_kg: "82", height_cm: "172", age_years: "34" });
    expect(out).toEqual({ weightKg: 82, heightCm: 172, ageYears: 34 });
  });

  it("valores absurdos (erro de digitação) viram ausentes — nunca contaminam os macros", () => {
    const out = readAnthropometry({ current_weight_kg: 8200, height_cm: 17, age_years: 340 });
    expect(out).toEqual({ weightKg: null, heightCm: null, ageYears: null });
  });

  it("respostas ausentes ou não numéricas viram null, sem NaN", () => {
    const out = readAnthropometry({ current_weight_kg: "oitenta" });
    expect(out.weightKg).toBeNull();
    expect(out.heightCm).toBeNull();
    expect(out.ageYears).toBeNull();
  });
});

describe("resolveAgeYears / resolveHeightCm — o cadastro vence, a anamnese cobre", () => {
  it("com cadastro completo, usa o cadastro mesmo com anamnese diferente", () => {
    const student = { birthDate: "1990-05-10", heightCm: 178 };
    const answers = { age_years: 50, height_cm: 160 };
    // A idade exata depende da data atual — só garantimos que veio do nascimento.
    expect(resolveAgeYears(student, answers)).not.toBe(50);
    expect(resolveHeightCm(student, answers)).toBe(178);
  });

  it("sem cadastro, usa a anamnese", () => {
    const student = { birthDate: null, heightCm: null };
    const answers = { age_years: 34, height_cm: 172 };
    expect(resolveAgeYears(student, answers)).toBe(34);
    expect(resolveHeightCm(student, answers)).toBe(172);
  });

  it("sem cadastro e sem anamnese, retorna null (o motor cai no fallback declarado)", () => {
    expect(resolveAgeYears({ birthDate: null }, {})).toBeNull();
    expect(resolveHeightCm({ heightCm: null }, {})).toBeNull();
    expect(resolveAgeYears(null, undefined)).toBeNull();
    expect(resolveHeightCm(null, null)).toBeNull();
  });
});
