import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getPublicUser, PublicUser } from "./users";

export type CommentNode = Doc<"comments"> & {
  author: PublicUser | null;
  replies: CommentNode[];
};

export const listByBlog = query({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }): Promise<CommentNode[]> => {
    const all = await ctx.db
      .query("comments")
      .withIndex("by_blog", (q) => q.eq("blogId", blogId))
      .order("asc")
      .collect();

    const authorsCache = new Map<string, PublicUser | null>();
    async function author(id: Id<"users">) {
      const key = id as string;
      if (!authorsCache.has(key)) {
        authorsCache.set(key, await getPublicUser(ctx, id));
      }
      return authorsCache.get(key) ?? null;
    }

    const nodes = new Map<string, CommentNode>();
    for (const c of all) {
      nodes.set(c._id as string, {
        ...c,
        author: await author(c.authorId),
        replies: [],
      });
    }

    const roots: CommentNode[] = [];
    for (const c of all) {
      const node = nodes.get(c._id as string)!;
      if (c.parentId && nodes.has(c.parentId as string)) {
        nodes.get(c.parentId as string)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  },
});

export const add = mutation({
  args: {
    blogId: v.id("blogs"),
    body: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const body = args.body.trim();
    if (!body) throw new Error("留言不能为空");
    return await ctx.db.insert("comments", {
      blogId: args.blogId,
      authorId: userId,
      body,
      parentId: args.parentId,
    });
  },
});

export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const comment = await ctx.db.get(commentId);
    if (!comment) return;
    if (comment.authorId !== userId) throw new Error("无权限");
    // Delete direct replies too.
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", commentId))
      .collect();
    for (const r of replies) await ctx.db.delete(r._id);
    await ctx.db.delete(commentId);
  },
});
