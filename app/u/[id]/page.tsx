"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/site-header";
import { BlogCard } from "@/components/blog-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/format";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = id as Id<"users">;
  const profile = useQuery(api.users.getUser, { userId });
  const blogs = useQuery(api.blogs.byAuthor, { authorId: userId });

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      {/* Banner */}
      <div className="h-40 w-full bg-gradient-to-r from-primary/15 via-chart-2/10 to-chart-4/10" />

      <main className="mx-auto max-w-4xl px-4">
        <div className="-mt-12 flex flex-col items-center text-center">
          {profile === undefined ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {initials(profile?.displayName ?? "?")}
              </AvatarFallback>
            </Avatar>
          )}
          <h1 className="mt-4 text-2xl font-bold">
            {profile?.displayName ?? "…"}
          </h1>
          {profile?.bio && (
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="mt-10 pb-16">
          <h2 className="mb-5 text-lg font-semibold">
            博客 {blogs ? `(${blogs.length})` : ""}
          </h2>
          {blogs === undefined ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          ) : blogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有发布博客</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {blogs.map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
