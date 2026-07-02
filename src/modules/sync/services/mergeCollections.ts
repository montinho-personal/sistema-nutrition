/**
 * Fusão determinística de coleções na sincronização (Sprint A — Persistência).
 *
 * Ao restaurar da nuvem, precisamos unir o que está no navegador com o que está
 * no banco sem perder nada — inclusive quando o mesmo usuário editou em dois
 * dispositivos. Regra: união por identificador, o registro mais recente vence.
 * Puro e testável (Documento 08).
 */

type Row = Record<string, unknown>;

/** Identificador de um registro (id, ou studentId para coleções por aluno). */
function rowKey(row: Row): string | null {
  const id = row.id ?? row.studentId;
  return typeof id === "string" ? id : null;
}

/** "Idade" do registro para desempate (mais recente vence). */
function rowTime(row: Row): string {
  const t = row.updatedAt ?? row.createdAt ?? row.updated_at ?? "";
  return typeof t === "string" ? t : "";
}

function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null;
}

/** Une dois arrays de registros por identificador, mantendo o mais recente. */
export function mergeRecordArrays(local: unknown, cloud: unknown): Row[] {
  const localArr = Array.isArray(local) ? local.filter(isRow) : [];
  const cloudArr = Array.isArray(cloud) ? cloud.filter(isRow) : [];
  const byKey = new Map<string, Row>();

  // Cloud primeiro; depois local (em empate de horário, o local prevalece).
  for (const row of [...cloudArr, ...localArr]) {
    const key = rowKey(row);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || rowTime(row) >= rowTime(existing)) byKey.set(key, row);
  }
  return [...byKey.values()];
}

/**
 * Funde uma coleção conforme o tipo:
 * - array de registros → união por id (mais recente vence);
 * - objeto/valor único (ex.: settings) → mantém o local se existir, senão o da nuvem.
 */
export function mergeCollection(kind: "array" | "object", local: unknown, cloud: unknown): unknown {
  if (kind === "array") return mergeRecordArrays(local, cloud);
  // Objeto único: o local (deste navegador) prevalece quando presente.
  return local ?? cloud ?? null;
}
