import "server-only";
import { db } from "./client";

export interface UserRow {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  createdAt: number;
  lastActiveAt: number;
}

/**
 * Upsert the user row and bump `last_active_at`. Called from the JWT callback
 * after the athlete id is resolved — fires on every session refresh, so the
 * timestamp tracks any meaningful auth touch (not just first sign-in).
 */
export async function touchUser(opts: {
  id: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}): Promise<void> {
  if (!opts.id) return;
  const now = Date.now();
  const c = await db();
  await c.execute({
    sql: `INSERT INTO users (id, name, username, avatar_url, created_at, last_active_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = COALESCE(excluded.name, users.name),
            username = COALESCE(excluded.username, users.username),
            avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
            last_active_at = excluded.last_active_at`,
    args: [
      opts.id,
      opts.name ?? null,
      opts.username ?? null,
      opts.avatarUrl ?? null,
      now,
      now,
    ],
  });
}
