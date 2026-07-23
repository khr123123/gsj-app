"use client";

import { BlogCard } from "@/components/blog-card";
import { formatDay } from "@/lib/format";
import type { BlogWithAuthor } from "@/convex/blogs";

// Group blogs by "YYYY-MM-DD"
function groupByDay(blogs: BlogWithAuthor[]) {
  const groups: { key: string; ts: number; items: BlogWithAuthor[] }[] = [];
  const map = new Map<string, number>();
  for (const b of blogs) {
    const d = new Date(b._creationTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) {
      map.set(key, groups.length);
      groups.push({ key, ts: b._creationTime, items: [] });
    }
    groups[map.get(key)!].items.push(b);
  }
  return groups;
}

export function Timeline({ blogs }: { blogs: BlogWithAuthor[] }) {
  const groups = groupByDay(blogs);

  return (
    <div className="relative">
      {/* vertical line */}
      <div className="absolute top-2 bottom-2 left-[76px] w-px bg-gradient-to-b from-border via-border to-transparent sm:left-[92px]" />

      <div className="space-y-10">
        {groups.map((group) => {
          const { day, month, year } = formatDay(group.ts);
          return (
            <div key={group.key} className="relative flex gap-4 sm:gap-6">
              {/* date marker */}
              <div className="relative flex w-[68px] shrink-0 flex-col items-end pt-1 text-right sm:w-[84px]">
                <span className="text-2xl font-bold tabular-nums sm:text-3xl">
                  {day}
                </span>
                <span className="text-xs text-muted-foreground">{month}</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {year}
                </span>
              </div>

              {/* dot */}
              <div className="relative z-10 mt-2 shrink-0">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border-4 border-background bg-primary shadow" />
              </div>

              {/* cards */}
              <div className="flex-1 space-y-4 pb-2">
                {group.items.map((b) => (
                  <BlogCard key={b._id} blog={b} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
