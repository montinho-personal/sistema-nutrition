/** Serviços de Sincronização na nuvem (Sprint A — Persistência). */

export {
  configureSync,
  setSyncEnabled,
  hydrateFromCloud,
  getSyncStatus,
  subscribeSyncStatus,
  type SyncStatus,
} from "./cloudSync";
export { mergeCollection, mergeRecordArrays } from "./mergeCollections";
