import { renderMarkdown } from "./markdown";

export type CoachSegment =
  | { kind: "markdown"; html: string }
  | { kind: "stretch"; id: string };

const STRETCH_RE = /^\[STRETCH:\s*([a-z0-9-]+)\s*\]$/i;

/**
 * Split a coach reply into a sequence of segments — markdown blocks and
 * inline StretchCard refs. Stretch tokens must sit alone on a line.
 */
export function parseCoachMessage(text: string): CoachSegment[] {
  const segments: CoachSegment[] = [];
  if (!text) return segments;
  const lines = text.split(/\r?\n/);
  let buffer: string[] = [];

  function flush() {
    if (buffer.length === 0) return;
    const md = buffer.join("\n").trim();
    if (md) segments.push({ kind: "markdown", html: renderMarkdown(md) });
    buffer = [];
  }

  for (const line of lines) {
    const m = STRETCH_RE.exec(line.trim());
    if (m) {
      flush();
      segments.push({ kind: "stretch", id: m[1].toLowerCase() });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return segments;
}
