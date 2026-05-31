// Minimal markdown → HTML renderer for the AI coach's structured replies.
// HTML-escapes input before parsing so output is safe for dangerouslySetInnerHTML.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return (
    s
      // Bold first — greedy on a single line.
      .replace(/\*\*(.+?)\*\*/g, '<strong class="md-b">$1</strong>')
      // Italic — single * not adjacent to another *
      .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em class="md-i">$2</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  );
}

/** Match "Before the ride:" / "During the ride:" — short capitalised label ending in colon. */
function isSubLabel(line: string): boolean {
  if (!line.endsWith(":")) return false;
  const body = line.slice(0, -1);
  if (body.length < 3 || body.length > 50) return false;
  if (!/^[A-Z]/.test(body)) return false;
  // Plain words only — no commas/periods/quotes which would suggest a sentence.
  if (/[.,?!"”]/.test(body)) return false;
  return true;
}

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const escaped = escapeHtml(input.trim());
  const lines = escaped.split(/\r?\n/);

  let html = "";
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html += `<p class="md-p">${paragraph.map(inline).join("<br />")}</p>`;
    paragraph = [];
  }

  function closeList() {
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trim();

    // Blank line — close any open paragraph or list block.
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^(?:---+|\*\*\*+|___+)$/.test(line)) {
      flushParagraph();
      closeList();
      html += '<hr class="md-hr" />';
      continue;
    }

    // Headings — #, ##, ### all render as the same eyebrow-style mark.
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const tag = level === 1 ? "h2" : level === 2 ? "h2" : "h3";
      const cls = level >= 3 ? "md-h3" : "md-h2";
      html += `<${tag} class="${cls}">${inline(heading[2])}</${tag}>`;
      continue;
    }

    // Sub-label ("Before the ride:", "Pre-ride:") — small grey-ink chip
    if (isSubLabel(line)) {
      flushParagraph();
      closeList();
      html += `<div class="md-sub">${inline(line.slice(0, -1))}</div>`;
      continue;
    }

    // Bullet list item
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        html += '<ul class="md-ul">';
        listType = "ul";
      }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
      continue;
    }

    // Ordered list item
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        html += '<ol class="md-ol">';
        listType = "ol";
      }
      html += `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushParagraph();
      closeList();
      html += `<blockquote class="md-quote">${inline(line.replace(/^>\s?/, ""))}</blockquote>`;
      continue;
    }

    // Normal paragraph text — close any open list so we don't leak items into <p>
    if (listType) closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html;
}
