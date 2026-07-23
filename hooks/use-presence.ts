"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

// Send a heartbeat every 10s while mounted, and read who's here.
export function usePresence(room: string) {
  const { isAuthenticated } = useConvexAuth();
  const heartbeat = useMutation(api.presence.heartbeat);
  const whoIsHere = useQuery(api.presence.whoIsHere, { room });

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const beat = () => {
      if (active) heartbeat({ room }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 10_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [room, isAuthenticated, heartbeat]);

  return whoIsHere ?? [];
}
