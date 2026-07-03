import { describe, expect, it } from "vitest";

import { deriveStepState, firstActionableStep } from "@/modules/flow/services/flowProgress";
import { FLOW_STEPS, flowStepIndex } from "@/modules/flow/constants/steps";

describe("fluxo — sequenciamento das etapas", () => {
  it("tem 7 etapas em ordem", () => {
    expect(FLOW_STEPS).toHaveLength(7);
    expect(FLOW_STEPS.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(flowStepIndex("estrategia")).toBe(2);
  });

  it("nada concluído: só a anamnese é alcançável", () => {
    const s = deriveStepState({ anamneseComplete: false, hasGoal: false, estrategiaComplete: false });
    expect(s.anamnese.reachable).toBe(true);
    expect(s.diagnostico.reachable).toBe(false);
    expect(s.estrategia.reachable).toBe(false);
    expect(firstActionableStep(s)).toBe("anamnese");
  });

  it("anamnese feita sem objetivo: diagnóstico abre, estratégia não", () => {
    const s = deriveStepState({ anamneseComplete: true, hasGoal: false, estrategiaComplete: false });
    expect(s.anamnese.done).toBe(true);
    expect(s.diagnostico.reachable).toBe(true);
    expect(s.estrategia.reachable).toBe(false);
    // Sem objetivo, a estratégia fica travada; a etapa alcançável mais à frente
    // é o diagnóstico (onde o objetivo pode ser definido).
    expect(firstActionableStep(s)).toBe("diagnostico");
  });

  it("anamnese + objetivo: estratégia abre; etapas seguintes ainda travadas", () => {
    const s = deriveStepState({ anamneseComplete: true, hasGoal: true, estrategiaComplete: false });
    expect(s.estrategia.reachable).toBe(true);
    expect(s.estrategia.done).toBe(false);
    expect(s.cardapio.reachable).toBe(false);
    expect(firstActionableStep(s)).toBe("estrategia");
  });

  it("estratégia completa: destrava alimentar, cardápio, validação e documento", () => {
    const s = deriveStepState({ anamneseComplete: true, hasGoal: true, estrategiaComplete: true });
    for (const id of ["alimentar", "cardapio", "validacao", "documento"] as const) {
      expect(s[id].reachable, id).toBe(true);
    }
    expect(s.estrategia.done).toBe(true);
    // Nenhuma das etapas finais é "concluída" ainda (sprints futuras).
    expect(firstActionableStep(s)).toBe("alimentar");
  });
});
