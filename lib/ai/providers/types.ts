/**
 * Provider-agnostic chat interface. Every backend (Anthropic, Ollama, …)
 * implements this single function so callers — debrief, analysis, coach —
 * don't need to know which one is wired in.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  system: string;
  messages: ChatMessage[];
  /** Soft cap on the model's reply length. */
  maxTokens?: number;
  /**
   * Hint to the provider that the output must be valid JSON.
   * Ollama uses this to set `format: "json"`; Anthropic ignores it
   * (the prompt already instructs JSON-only output).
   */
  format?: "json" | "text";
}

export interface ChatProvider {
  /** Human label used in logs / debug. */
  name: string;
  /** Run a single completion. Returns trimmed text or null on failure. */
  chat(opts: ChatOptions): Promise<string | null>;
}
