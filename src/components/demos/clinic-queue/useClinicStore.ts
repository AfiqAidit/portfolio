"use client";

import { useSyncExternalStore } from "react";
import { getClinicState, subscribeClinic } from "./queue-store";

const serverSnapshot = getClinicState;

export function useClinicStore() {
  return useSyncExternalStore(subscribeClinic, getClinicState, serverSnapshot);
}
