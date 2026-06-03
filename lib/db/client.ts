import "server-only";
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function rawClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is not set. Add it to .env.local and Vercel env.",
      );
    }
    _client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

/**
 * Lazy schema bootstrap — runs once per process. SQLite `CREATE TABLE IF NOT
 * EXISTS` is cheap, so the only real cost is one round-trip on cold start.
 */
async function initSchema(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const c = rawClient();
    await c.batch(
      [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          username TEXT,
          avatar_url TEXT,
          created_at INTEGER NOT NULL,
          last_active_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          sport TEXT NOT NULL,
          metric TEXT NOT NULL,
          event_target REAL NOT NULL,
          event_date TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          archived_at INTEGER
        )`,
        `CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`,
        `CREATE TABLE IF NOT EXISTS goal_tips (
          goal_id TEXT NOT NULL,
          tip_date TEXT NOT NULL,
          user_id TEXT NOT NULL,
          tip_json TEXT NOT NULL,
          saved_at INTEGER NOT NULL,
          PRIMARY KEY (goal_id, tip_date)
        )`,
        `CREATE TABLE IF NOT EXISTS analysis_cache (
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          count INTEGER NOT NULL,
          data_json TEXT NOT NULL,
          saved_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, date)
        )`,
        `CREATE TABLE IF NOT EXISTS debrief_cache (
          user_id TEXT NOT NULL,
          activity_id TEXT NOT NULL,
          debrief_json TEXT,
          plan_json TEXT,
          saved_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, activity_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_debrief_user_saved ON debrief_cache(user_id, saved_at DESC)`,
      ],
      "write",
    );
  })();
  return _initPromise;
}

/** Get a libSQL client. Schema is guaranteed initialised by the time this resolves. */
export async function db(): Promise<Client> {
  await initSchema();
  return rawClient();
}
