"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/site-header";
import { Timeline } from "@/components/timeline";
import { Viewers } from "@/components/viewers";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function HomePage() {
  const blogs = useQuery(api.blogs.timeline);
  const { isAuthenticated } = useCurrentUser();

  // Build a list of unique recent authors for the sidebar.
  const authors = blogs
    ? Array.from(
        new Map(
          blogs
            .filter((b) => b.author)
            .map((b) => [b.author!._id, b.author!])
        ).values()
      ).slice(0, 8)
    : [];

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            每个人的故事,
            <br />
            都是一条流动的{" "}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              时间轴
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            按时间浏览大家发布的博客,点进去看看那些被记录下来的时光。
          </p>
          {!isAuthenticated && (
            <div className="mt-5 flex gap-3">
                <Link href="/signin">开始写作</Link>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
        {/* Timeline */}
        <div>
          {blogs === undefined ? (
            <TimelineSkeleton />
          ) : blogs.length === 0 ? (
            <EmptyState />
          ) : (
            <Timeline blogs={blogs} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden space-y-6 lg:block">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">谁正在看首页</h3>
              <Viewers room="home" label="正在浏览" />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold">活跃作者</h3>
              <div className="space-y-3">
                {authors.length === 0 && (
                  <p className="text-xs text-muted-foreground">还没有作者</p>
                )}
                {authors.map((a) => (
                  <Link
                    key={a._id}
                    href={`/u/${a._id}`}
                    className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={a.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {initials(a.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{a.displayName}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-6">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="mb-3 text-4xl">🕰️</div>
      <h3 className="text-lg font-semibold">时间轴还是空的</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        成为第一个在这里留下故事的人吧。
      </p>
        <Link href="/write">写第一篇博客</Link>
    </div>
  );
}
