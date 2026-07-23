import { query, mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getPublicUser, PublicUser } from "./users";

export type BlogWithAuthor = Doc<"blogs"> & {
  author: PublicUser | null;
  coverUrl?: string;
  likeCount: number;
  commentCount: number;
};

async function decorate(
  ctx: QueryCtx,
  blog: Doc<"blogs">
): Promise<BlogWithAuthor> {
  const author = await getPublicUser(ctx, blog.authorId);
  let coverUrl = blog.coverUrl;
  if (!coverUrl && blog.coverStorageId) {
    coverUrl = (await ctx.storage.getUrl(blog.coverStorageId)) ?? undefined;
  }
  const likes = await ctx.db
    .query("likes")
    .withIndex("by_blog", (q) => q.eq("blogId", blog._id))
    .collect();
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_blog", (q) => q.eq("blogId", blog._id))
    .collect();
  return {
    ...blog,
    author,
    coverUrl,
    likeCount: likes.length,
    commentCount: comments.length,
  };
}

// Public timeline: all published + public blogs, newest first.
export const timeline = query({
  args: {},
  handler: async (ctx): Promise<BlogWithAuthor[]> => {
    const blogs = await ctx.db
      .query("blogs")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .collect();
    const published = blogs.filter((b) => b.published);
    return Promise.all(published.map((b) => decorate(ctx, b)));
  },
});

// A single user's blogs. Owner sees hidden ones too.
export const byAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, { authorId }): Promise<BlogWithAuthor[]> => {
    const viewerId = await getAuthUserId(ctx);
    const blogs = await ctx.db
      .query("blogs")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .order("desc")
      .collect();
    const visible = blogs.filter(
      (b) => b.published && (b.visibility === "public" || viewerId === authorId)
    );
    return Promise.all(visible.map((b) => decorate(ctx, b)));
  },
});

// Current user's own blogs (including drafts + hidden).
export const myBlogs = query({
  args: {},
  handler: async (ctx): Promise<BlogWithAuthor[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const blogs = await ctx.db
      .query("blogs")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();
    return Promise.all(blogs.map((b) => decorate(ctx, b)));
  },
});

export const get = query({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }): Promise<BlogWithAuthor | null> => {
    const blog = await ctx.db.get(blogId);
    if (!blog) return null;
    const viewerId = await getAuthUserId(ctx);
    if (blog.visibility === "hidden" && viewerId !== blog.authorId) {
      return null;
    }
    if (!blog.published && viewerId !== blog.authorId) {
      return null;
    }
    return decorate(ctx, blog);
  },
});

function makeExcerpt(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 160);
}

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("hidden")),
    published: v.boolean(),
  },
  handler: async (ctx, args): Promise<Id<"blogs">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    let coverUrl: string | undefined;
    if (args.coverStorageId) {
      coverUrl = (await ctx.storage.getUrl(args.coverStorageId)) ?? undefined;
    }
    return await ctx.db.insert("blogs", {
      authorId: userId,
      title: args.title.trim() || "无标题",
      content: args.content,
      excerpt: makeExcerpt(args.content),
      coverStorageId: args.coverStorageId,
      coverUrl,
      visibility: args.visibility,
      published: args.published,
      likeCount: 0,
      viewCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    blogId: v.id("blogs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("hidden"))),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const blog = await ctx.db.get(args.blogId);
    if (!blog) throw new Error("博客不存在");
    if (blog.authorId !== userId) throw new Error("无权限");

    const patch: Partial<Doc<"blogs">> = {};
    if (args.title !== undefined) patch.title = args.title.trim() || "无标题";
    if (args.content !== undefined) {
      patch.content = args.content;
      patch.excerpt = makeExcerpt(args.content);
    }
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.published !== undefined) patch.published = args.published;
    if (args.coverStorageId !== undefined) {
      patch.coverStorageId = args.coverStorageId;
      patch.coverUrl =
        (await ctx.storage.getUrl(args.coverStorageId)) ?? undefined;
    }
    await ctx.db.patch(args.blogId, patch);
  },
});

export const toggleVisibility = mutation({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const blog = await ctx.db.get(blogId);
    if (!blog) throw new Error("博客不存在");
    if (blog.authorId !== userId) throw new Error("无权限");
    await ctx.db.patch(blogId, {
      visibility: blog.visibility === "public" ? "hidden" : "public",
    });
  },
});

export const remove = mutation({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const blog = await ctx.db.get(blogId);
    if (!blog) throw new Error("博客不存在");
    if (blog.authorId !== userId) throw new Error("无权限");
    // Delete comments and likes.
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_blog", (q) => q.eq("blogId", blogId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_blog", (q) => q.eq("blogId", blogId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);
    await ctx.db.delete(blogId);
  },
});

// Like toggling.
export const toggleLike = mutation({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_blog_and_user", (q) =>
        q.eq("blogId", blogId).eq("userId", userId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("likes", { blogId, userId });
    return true;
  },
});

export const hasLiked = query({
  args: { blogId: v.id("blogs") },
  handler: async (ctx, { blogId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_blog_and_user", (q) =>
        q.eq("blogId", blogId).eq("userId", userId)
      )
      .unique();
    return !!existing;
  },
});
