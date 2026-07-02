"use client";

import * as React from "react";

import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from "@/modules/sync/services/cloudSync";

/** Status reativo da sincronização na nuvem. */
export function useSyncStatus(): SyncStatus {
  return React.useSyncExternalStore(subscribeSyncStatus, getSyncStatus, () => "off");
}
