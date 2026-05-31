import type { ChatOptions, ChatProvider } from "./providers/types";
import { anthropicProvider } from "./providers/anthropic";
import { ollamaProvider } from "./providers/ollama";

/**
 * Pick the AI provider based on env config.
 *
 *   AI_PROVIDER=ollama     → talk to a local/self-hosted Ollama daemon
 *   AI_PROVIDER=anthropic  → use the Claude API
 *   (unset)                → auto: prefer Anthropic if ANTHROPIC_API_KEY is
 *                            present, else Ollama if OLLAMA_HOST/OLLAMA_MODEL
 *                            looks configured, else disable AI entirely.
 *
 * If neither provider is reachable, narration falls back to the deterministic
 * `fallback*()` helpers — the app still renders, just without the AI voice.
 */
function selectProvider(): ChatProvider | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();

  if (explicit === "ollama") return ollamaProvider;
  if (explicit === "anthropic") {
    return process.env.ANTHROPIC_API_KEY ? anthropicProvider : null;
  }

  // Auto-detect when AI_PROVIDER is unset.
  if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;
  if (process.env.OLLAMA_HOST || process.env.OLLAMA_MODEL) return ollamaProvider;
  return null;
}

let _cached: ChatProvider | null | undefined;
function provider(): ChatProvider | null {
  if (_cached === undefined) _cached = selectProvider();
  return _cached;
}

export function hasAI(): boolean {
  return provider() !== null;
}

export function aiProviderName(): string {
  return provider()?.name ?? "fallback";
}

/**
 * Single entry-point used by narrate/analysis/coach. Returns trimmed model
 * text, or null on any failure — callers should then use their deterministic
 * fallback so the UI never breaks.
 */
export async function chat(opts: ChatOptions): Promise<string | null> {
  const p = provider();
  if (!p) return null;
  try {
    return await p.chat(opts);
  } catch (err) {
    console.error(`[ai/${p.name}] chat failed:`, err);
    return null;
  }
}
