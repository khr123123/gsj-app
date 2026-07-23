"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { CommentNode } from "@/convex/comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initials, timeAgo } from "@/lib/format";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

function CommentComposer({
  blogId,
  parentId,
  onDone,
  placeholder = "写下你的留言…",
  compact,
}: {
  blogId: Id<"blogs">;
  parentId?: Id<"comments">;
  onDone?: () => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const add = useMutation(api.comments.add);
  const { isAuthenticated } = useCurrentUser();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/signin" className="text-primary hover:underline">
          登录
        </Link>{" "}
        后即可留言
      </p>
    );
  }

  async function submit() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await add({ blogId, body, parentId });
      setBody("");
      onDone?.();
    } catch {
      toast.error("发送失败");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone}>
            取消
          </Button>
        )}
        <Button size="sm" disabled={sending || !body.trim()} onClick={submit}>
          {sending ? "发送中…" : "发送"}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  blogId,
  depth = 0,
}: {
  comment: CommentNode;
  blogId: Id<"blogs">;
  depth?: number;
}) {
  const { user } = useCurrentUser();
  const remove = useMutation(api.comments.remove);
  const [replying, setReplying] = useState(false);
  const isMine = user?._id === comment.authorId;

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.author?.avatarUrl} />
        <AvatarFallback className="text-xs">
          {initials(comment.author?.displayName ?? "?")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.author?.displayName ?? "匿名"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment._creationTime)}
          </span>
          {isMine && (
            <button
              className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
              onClick={async () => {
                await remove({ commentId: comment._id });
              }}
              title="删除"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap text-foreground/90">
          {comment.body}
        </p>
        <div className="flex items-center gap-3 pt-0.5">
          {depth < 2 && (
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setReplying((v) => !v)}
            >
              回复
            </button>
          )}
        </div>

        {replying && (
          <div className="pt-2">
            <CommentComposer
              blogId={blogId}
              parentId={comment._id}
              compact
              placeholder={`回复 ${comment.author?.displayName ?? ""}…`}
              onDone={() => setReplying(false)}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-4 border-l border-border/60 pl-4">
            {comment.replies.map((r) => (
              <CommentItem
                key={r._id}
                comment={r}
                blogId={blogId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentsSection({ blogId }: { blogId: Id<"blogs"> }) {
  const comments = useQuery(api.comments.listByBlog, { blogId });
  const total = comments?.reduce(
    (n, c) => n + 1 + c.replies.length,
    0
  );

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">
        留言 {total !== undefined ? `(${total})` : ""}
      </h2>
      <CommentComposer blogId={blogId} />
      <div className="space-y-6">
        {comments?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            还没有留言,来说点什么吧。
          </p>
        )}
        {comments?.map((c) => (
          <CommentItem key={c._id} comment={c} blogId={blogId} />
        ))}
      </div>
    </section>
  );
}
