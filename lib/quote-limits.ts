/** Max non-whitespace characters for testimonial / success-story quotes. */
export const TESTIMONIAL_QUOTE_MAX_CHARS = 270

/** Non-whitespace chars shown in card/hover previews before “Show more”. */
export const TESTIMONIAL_QUOTE_PREVIEW_CHARS = 120

export function countCharsWithoutSpaces(value: string): number {
  return value.replace(/\s/g, "").length
}

/** Keep spaces, but stop accepting non-whitespace once `max` is reached. */
export function truncateWithoutSpaces(value: string, max: number): string {
  let count = 0
  let result = ""
  for (const char of value) {
    if (/\s/.test(char)) {
      result += char
      continue
    }
    if (count >= max) break
    result += char
    count += 1
  }
  return result
}

/** Preview text plus ellipsis when the full quote exceeds the preview limit. */
export function previewQuoteWithoutSpaces(
  value: string,
  previewMax = TESTIMONIAL_QUOTE_PREVIEW_CHARS,
  hardMax = TESTIMONIAL_QUOTE_MAX_CHARS
): { full: string; preview: string; canShowMore: boolean } {
  const full = truncateWithoutSpaces(value, hardMax)
  const canShowMore = countCharsWithoutSpaces(full) > previewMax
  const preview = canShowMore
    ? `${truncateWithoutSpaces(full, previewMax).trimEnd()}…`
    : full
  return { full, preview, canShowMore }
}
