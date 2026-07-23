"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function OnlineBadge() {
  const count = useQuery(api.presence.onlineCount);
  if (count === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="tabular-nums">{count} 人在线</span>
    </div>
  );
}
