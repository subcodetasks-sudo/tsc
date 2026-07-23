/**
 * Decode a single pass of common HTML entities.
 * `&amp;` is resolved last so sequences like `&amp;lt;` become `&lt;`.
 */
function unescapeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&#160;/g, "\u00a0")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/gi, "&")
}

/** Unwrap redundant outer `<p>…</p>` shells left by multi-encoded CMS payloads. */
function unwrapRedundantParagraphs(html: string): string {
  let current = html.trim()

  for (let i = 0; i < 4; i++) {
    if (!/^<p(\s[^>]*)?>\s*<p/i.test(current) || !/<\/p>\s*<\/p>$/i.test(current)) {
      break
    }
    current = current.replace(/^<p(\s[^>]*)?>\s*/i, "").replace(/\s*<\/p>$/i, "").trim()
  }

  return current
}

/**
 * Some upstream FAQ/CMS payloads nest entity-escaped HTML inside a real
 * `<p>` wrapper (sometimes 2–3 layers). TipTap then treats the escaped markup
 * as plain text. Decode and unwrap until real tags are restored.
 */
export function normalizeRichTextHtml(html: string | null | undefined): string {
  let current = (html ?? "").trim()
  if (!current) return ""

  for (let i = 0; i < 4; i++) {
    if (!/&lt;\/?[a-zA-Z]|&amp;lt;/i.test(current)) break
    current = unescapeHtmlEntities(current).trim()
  }

  return unwrapRedundantParagraphs(current)
}
