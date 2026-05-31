import Anthropic from "@anthropic-ai/sdk";
import type { ChatOptions, ChatProvider } from "./types";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const anthropicProvider: ChatProvider = {
  name: `anthropic:${DEFAULT_MODEL}`,
  async chat({ system, messages, maxTokens = 800 }: ChatOptions) {
    const res = await client().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    return text || null;
  },
};
