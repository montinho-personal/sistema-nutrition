import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `local-store.ts` decide se está "no navegador" checando `window` em tempo de
 * chamada — simulamos esse objeto aqui (ambiente de teste é "node", sem DOM)
 * para exercitar os caminhos de sucesso e de falha da escrita, incluindo o
 * aviso ao usuário quando a gravação falha (Documento 02 — nunca esconder um
 * risco em silêncio; auditoria de produção — dado "sumindo" sem explicação).
 */

function installFakeStorage(overrides: Partial<Storage> = {}): Map<string, string> {
  const store = new Map<string, string>();
  const fakeStorage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    ...overrides,
  };
  vi.stubGlobal("window", { localStorage: fakeStorage, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  return store;
}

describe("local-store — leitura e escrita", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("grava e lê de volta o mesmo valor", async () => {
    installFakeStorage();
    const { readLocal, writeLocal } = await import("@/shared/lib/local-store");
    writeLocal("students", [{ id: "s1" }]);
    expect(readLocal<{ id: string }[]>("students", [])).toEqual([{ id: "s1" }]);
  });

  it("sem window (SSR), lê/grava sem erro e devolve o fallback", async () => {
    const { readLocal, writeLocal } = await import("@/shared/lib/local-store");
    expect(() => writeLocal("students", [{ id: "s1" }])).not.toThrow();
    expect(readLocal("students", [])).toEqual([]);
  });

  it("notifica onLocalWrite a cada gravação bem-sucedida", async () => {
    installFakeStorage();
    const { onLocalWrite, writeLocal } = await import("@/shared/lib/local-store");
    const spy = vi.fn();
    const unsubscribe = onLocalWrite(spy);
    writeLocal("settings", { theme: "dark" });
    expect(spy).toHaveBeenCalledWith("settings", { theme: "dark" });
    unsubscribe();
  });
});

describe("local-store — falha de escrita é visível, nunca silenciosa", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("quando o navegador rejeita a gravação (ex.: cota esgotada), onLocalWriteError dispara", async () => {
    installFakeStorage({
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
    });
    const { onLocalWriteError, writeLocal } = await import("@/shared/lib/local-store");
    const spy = vi.fn();
    const unsubscribe = onLocalWriteError(spy);
    writeLocal("meal_plan_prefs", [{ studentId: "s1" }]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe("meal_plan_prefs");
    unsubscribe();
  });

  it("uma escrita que falha não fica em cache como se tivesse sido salva", async () => {
    let shouldFail = false;
    const store = new Map<string, string>();
    installFakeStorage({
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        if (shouldFail) throw new Error("disco cheio");
        store.set(key, value);
      },
    });
    const { onLocalWriteError, readLocal, writeLocal } = await import("@/shared/lib/local-store");
    writeLocal("students", [{ id: "s1" }]);
    shouldFail = true;
    const errors = vi.fn();
    onLocalWriteError(errors);
    writeLocal("students", [{ id: "s1" }, { id: "s2" }]);
    expect(errors).toHaveBeenCalled();
    // A leitura não reflete a escrita que falhou (nada foi persistido de fato).
    expect(readLocal<{ id: string }[]>("students", [])).toEqual([{ id: "s1" }]);
  });
});
