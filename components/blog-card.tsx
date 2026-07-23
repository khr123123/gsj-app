"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, timeAgo } from "@/lib/format";
import type { BlogWithAuthor } from "@/convex/blogs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  Comment01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

export function BlogCard({ blog }: { blog: BlogWithAuthor }) {
  return (
    <Link
      href={`/blog/${blog._id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
    >
      {blog.coverUrl && (
        <div className="relative h-44 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blog.coverUrl}
            alt={blog.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={blog.author?.avatarUrl} />
            <AvatarFallback className="text-[10px]">
              {initials(blog.author?.displayName ?? "?")}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">
            {blog.author?.displayName ?? "匿名"}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(blog._creationTime)}
          </span>
          {blog.visibility === "hidden" && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              仅自己可见
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight group-hover:text-primary">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {blog.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={FavouriteIcon} size={14} />
            {blog.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Comment01Icon} size={14} />
            {blog.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
