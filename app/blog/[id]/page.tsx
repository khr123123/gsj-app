"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/site-header";
import { CommentsSection } from "@/components/comments-section";
import { Viewers } from "@/components/viewers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials, formatDate } from "@/lib/format";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FavouriteIcon,
  MoreHorizontalIcon,
  ViewOffIcon,
  ViewIcon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";

export default function BlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const blogId = id as Id<"blogs">;
  const router = useRouter();
  const blog = useQuery(api.blogs.get, { blogId });
  const liked = useQuery(api.blogs.hasLiked, { blogId });
  const toggleLike = useMutation(api.blogs.toggleLike);
  const toggleVisibility = useMutation(api.blogs.toggleVisibility);
  const removeBlog = useMutation(api.blogs.remove);
  const { user } = useCurrentUser();

  if (blog === undefined) {
    return (
      <div className="min-h-svh bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (blog === null) {
    return (
      <div className="min-h-svh bg-background">
        <SiteHeader />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
          <div className="mb-3 text-4xl">🚫</div>
          <h1 className="text-xl font-semibold">找不到这篇博客</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            它可能已被删除,或者作者设为了私密。
          </p>
            <Link href="/">返回首页</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === blog.authorId;

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-8">
        {/* Presence */}
        <div className="mb-6 flex items-center justify-between">
          <Viewers room={blogId} label="正在看" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={`/write?id=${blogId}`}>
                    <HugeiconsIcon icon={PencilEdit01Icon} size={15} />
                    编辑
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await toggleVisibility({ blogId });
                    toast.success(
                      blog.visibility === "public"
                        ? "已隐藏,仅自己可见"
                        : "已公开"
                    );
                  }}
                >
                  <HugeiconsIcon
                    icon={
                      blog.visibility === "public" ? ViewOffIcon : ViewIcon
                    }
                    size={15}
                  />
                  {blog.visibility === "public" ? "隐藏博客" : "设为公开"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("确定删除这篇博客吗?")) {
                      await removeBlog({ blogId });
                      toast.success("已删除");
                      router.push("/");
                    }
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={15} />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Cover */}
        {blog.coverUrl && (
          <div className="mb-8 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.coverUrl}
              alt={blog.title}
              className="max-h-[420px] w-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="space-y-5">
          {blog.visibility === "hidden" && (
            <Badge variant="secondary">仅自己可见</Badge>
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {blog.title}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/u/${blog.author?._id}`}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={blog.author?.avatarUrl} />
                <AvatarFallback>
                  {initials(blog.author?.displayName ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-sm font-medium">
                  {blog.author?.displayName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(blog._creationTime)}
                </div>
              </div>
            </Link>
          </div>
        </header>

        <Separator className="my-8" />

        {/* Body */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Like bar */}
        <div className="mt-10 flex items-center justify-center">
          <Button
            variant={liked ? "default" : "outline"}
            size="lg"
            className="gap-2 rounded-full"
            onClick={async () => {
              try {
                await toggleLike({ blogId });
              } catch {
                toast.error("请先登录");
              }
            }}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={18} />
            {blog.likeCount} 喜欢
          </Button>
        </div>

        <Separator className="my-10" />

        <CommentsSection blogId={blogId} />
      </article>
    </div>
  );
}
