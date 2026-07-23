import { query, mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

export type PublicUser = {
  _id: Id<"users">;
  name: string;
  email?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

async function buildPublicUser(
  ctx: QueryCtx,
  user: Doc<"users">
): Promise<PublicUser> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();

  let avatarUrl = profile?.avatarUrl;
  if (!avatarUrl && profile?.avatarStorageId) {
    avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
  }

  return {
    _id: user._id,
    name: user.name ?? "",
    email: user.email,
    displayName: profile?.displayName ?? user.name ?? user.email ?? "匿名用户",
    bio: profile?.bio,
    avatarUrl,
  };
}

export async function getPublicUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<PublicUser | null> {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return buildPublicUser(ctx, user);
}

export const currentUser = query({
  args: {},
  handler: async (ctx): Promise<PublicUser | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return getPublicUser(ctx, userId);
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<PublicUser | null> => {
    return getPublicUser(ctx, userId);
  },
});

// Ensure a profile row exists for the current user; create default if missing.
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;
    const user = await ctx.db.get(userId);
    return await ctx.db.insert("profiles", {
      userId,
      displayName: user?.name ?? user?.email ?? "新用户",
      bio: "",
    });
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      const user = await ctx.db.get(userId);
      const id = await ctx.db.insert("profiles", {
        userId,
        displayName: args.displayName ?? user?.name ?? "新用户",
        bio: args.bio ?? "",
      });
      return id;
    }
    await ctx.db.patch(profile._id, {
      ...(args.displayName !== undefined ? { displayName: args.displayName } : {}),
      ...(args.bio !== undefined ? { bio: args.bio } : {}),
    });
    return profile._id;
  },
});

// Generate an upload URL for avatar/cover/content images.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    return await ctx.storage.generateUploadUrl();
  },
});

export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("未登录");
    const url = (await ctx.storage.getUrl(storageId)) ?? undefined;
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("profiles", {
        userId,
        displayName: user?.name ?? "新用户",
        bio: "",
        avatarStorageId: storageId,
        avatarUrl: url,
      });
      return url;
    }
    await ctx.db.patch(profile._id, {
      avatarStorageId: storageId,
      avatarUrl: url,
    });
    return url;
  },
});

// Resolve a storage id to a served URL (used by the image upload flow).
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
