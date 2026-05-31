import type { ChatOptions, ChatProvider } from "./types";

const DEFAULT_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

/**
 * Ollama chat provider. Talks to a running Ollama daemon over its HTTP API.
 *
 * Required environment:
 *   OLLAMA_HOST   default http://127.0.0.1:11434
 *   OLLAMA_MODEL  default qwen2.5:7b-instruct  (pull it once: `ollama pull qwen2.5:7b-instruct`)
 *
 * The `format: "json"` option is critical for the weekly analysis endpoint —
 * it forces the model to emit valid JSON instead of prose-wrapped JSON.
 *
 * Note: Ollama is local-first. When the app is deployed (Vercel etc.), set
 * OLLAMA_HOST to a publicly reachable URL — or fall back to Anthropic in prod.
 */
export const ollamaProvider: ChatProvider = {
  name: `ollama:${DEFAULT_MODEL}`,

  async chat({ system, messages, maxTokens = 800, format }: ChatOptions) {
    const body = {
      model: DEFAULT_MODEL,
      stream: false,
      // Ollama follows OpenAI-style message shape but the `system` role is
      // its own message at the head of the array.
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      // JSON mode — emits a single JSON object with no surrounding text.
      ...(format === "json" ? { format: "json" } : {}),
      options: {
        // Mirror our Anthropic max_tokens. Ollama calls this num_predict.
        num_predict: maxTokens,
        // A little determinism helps the JSON contract hold up.
        temperature: format === "json" ? 0.2 : 0.7,
      },
    };

    const res = await fetch(`${DEFAULT_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // No caching — every call is unique to the athlete's current data.
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`ollama ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    return text || null;
  },
};
