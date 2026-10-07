"use client";

import { useEffect } from "react";
import { nextAutoPlayAction } from "./autoplay";
import { dispatchClinic, getClinicState } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

export function AutoPlayRunner() {
  const state = useClinicStore();

  useEffect(() => {
    if (!state.autoPlay) return;
    const tick = () => {
      if (document.hidden) return;
      const s = getClinicState();
      if (!s.autoPlay) return;
      const action = nextAutoPlayAction(s);
      if (action) dispatchClinic(action);
    };
    const id = window.setInterval(tick, 3500);
    return () => window.clearInterval(id);
  }, [state.autoPlay]);

  return null;
}
