import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables (users, authAccounts, authSessions, etc.)
  ...authTables,

  // Extended profile info keyed to the auth user id
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    // Cached avatar url for convenience (may be null until uploaded)
    avatarUrl: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  blogs: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    // Rich content stored as HTML string produced by the editor
    content: v.string(),
    // Short excerpt for cards / timeline
    excerpt: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    // "public" | "hidden"
    visibility: v.union(v.literal("public"), v.literal("hidden")),
    published: v.boolean(),
    likeCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_visibility", ["visibility"])
    .index("by_author_and_visibility", ["authorId", "visibility"]),

  comments: defineTable({
    blogId: v.id("blogs"),
    authorId: v.id("users"),
    body: v.string(),
    // null for top-level comments; set for replies
    parentId: v.optional(v.id("comments")),
  })
    .index("by_blog", ["blogId"])
    .index("by_parent", ["parentId"]),

  // Presence: who is currently viewing a blog / the site
  presence: defineTable({
    userId: v.id("users"),
    // "home" or a blog id string
    room: v.string(),
    lastSeen: v.number(),
  })
    .index("by_room", ["room"])
    .index("by_user_and_room", ["userId", "room"]),

  likes: defineTable({
    blogId: v.id("blogs"),
    userId: v.id("users"),
  })
    .index("by_blog", ["blogId"])
    .index("by_blog_and_user", ["blogId", "userId"]),
});
