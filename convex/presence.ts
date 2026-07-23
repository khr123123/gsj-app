import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { getPublicUser, PublicUser } from "./users";

const ACTIVE_WINDOW_MS = 20_000; // considered "online" if seen within 20s

// Heartbeat: mark the current user as present in a room.
export const heartbeat = mutation({
  args: { room: v.string() },
  handler: async (ctx, { room }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_and_room", (q) =>
        q.eq("userId", userId).eq("room", room)
      )
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now });
    } else {
      await ctx.db.insert("presence", { userId, room, lastSeen: now });
    }
  },
});

// Who is currently viewing a room.
export const whoIsHere = query({
  args: { room: v.string() },
  handler: async (ctx, { room }): Promise<PublicUser[]> => {
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("room", room))
      .collect();
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    const active = rows.filter((r) => r.lastSeen >= cutoff);
    const users = await Promise.all(
      active.map((r) => getPublicUser(ctx, r.userId))
    );
    // dedupe by user id
    const seen = new Set<string>();
    const result: PublicUser[] = [];
    for (const u of users) {
      if (u && !seen.has(u._id as string)) {
        seen.add(u._id as string);
        result.push(u);
      }
    }
    return result;
  },
});

// Count online across whole site (home room + any blog).
export const onlineCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    const rows = await ctx.db.query("presence").collect();
    const active = rows.filter((r) => r.lastSeen >= cutoff);
    const ids = new Set(active.map((r) => r.userId as string));
    return ids.size;
  },
});
