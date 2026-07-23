"use client";

import { usePresence } from "@/hooks/use-presence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Tracks presence in `room` AND renders the stacked avatars of who's here.
export function Viewers({
  room,
  className,
  label = "正在看",
}: {
  room: string;
  className?: string;
  label?: string;
}) {
  const viewers = usePresence(room);

  if (viewers.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/40" />
        </span>
        <span>暂无其他人在看</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex -space-x-2">
        {viewers.slice(0, 5).map((u) => (
          <Tooltip key={u._id}>
            <TooltipTrigger >
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarImage src={u.avatarUrl} alt={u.displayName} />
                <AvatarFallback className="text-[10px]">
                  {initials(u.displayName)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{u.displayName}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {viewers.length > 5 ? `${viewers.length} 人${label}` : label}
      </span>
    </div>
  );
}
