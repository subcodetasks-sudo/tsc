/** Per-locale setting keys avoid MySQL TEXT (~64KB) limit on monolithic legal JSON. */
export const LEGAL_LOCALES = ["ar", "en", "de"] as const
export type LegalLocale = (typeof LEGAL_LOCALES)[number]

export function legalLocaleSettingKey(baseKey: string, locale: LegalLocale | string) {
  return `${baseKey}_${locale}`
}

export function allLegalLocaleSettingKeys(baseKey: string) {
  return LEGAL_LOCALES.map((locale) => legalLocaleSettingKey(baseKey, locale))
}

export type LegalDocumentState = {
  titleAr: string
  titleEn: string
  titleDe: string
  contentAr: string
  contentEn: string
  contentDe: string
}

export function emptyLegalDocument(): LegalDocumentState {
  return {
    titleAr: "",
    titleEn: "",
    titleDe: "",
    contentAr: "",
    contentEn: "",
    contentDe: "",
  }
}

function parseMaybeJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Read one locale blob: `{ title: string, content: string }`. */
function pickLocaleDocument(raw: unknown): { title: string; content: string } | null {
  const parsed = parseMaybeJson(raw)
  if (!parsed || typeof parsed !== "object") return null
  const record = parsed as Record<string, unknown>
  const title = typeof record.title === "string" ? record.title : ""
  const content = typeof record.content === "string" ? record.content : ""
  if (!title && !content) return null
  return { title, content }
}

/**
 * Prefer per-locale keys (`privacy_policy_ar`, …); fall back to monolithic
 * `{ title: {ar,en,de}, content: {ar,en,de} }` for older data.
 */
export function parseLegalDocumentFromSettings(
  settings: Array<{ key: string; value: unknown }> | Record<string, unknown>,
  baseKey: string
): LegalDocumentState {
  const get = (key: string): unknown => {
    if (Array.isArray(settings)) {
      return settings.find((item) => item.key === key)?.value
    }
    return settings[key]
  }

  const doc = emptyLegalDocument()
  let foundLocaleKey = false

  for (const locale of LEGAL_LOCALES) {
    const localeDoc = pickLocaleDocument(get(legalLocaleSettingKey(baseKey, locale)))
    if (!localeDoc) continue
    foundLocaleKey = true
    if (locale === "ar") {
      doc.titleAr = localeDoc.title
      doc.contentAr = localeDoc.content
    } else if (locale === "en") {
      doc.titleEn = localeDoc.title
      doc.contentEn = localeDoc.content
    } else {
      doc.titleDe = localeDoc.title
      doc.contentDe = localeDoc.content
    }
  }

  if (foundLocaleKey) return doc

  const raw = get(baseKey)
  const parsed = parseMaybeJson(raw)
  if (!parsed || typeof parsed !== "object") return doc

  const record = parsed as Record<string, unknown>
  const title =
    record.title && typeof record.title === "object"
      ? (record.title as Record<string, string>)
      : {}
  const content =
    record.content && typeof record.content === "object"
      ? (record.content as Record<string, string>)
      : {}

  return {
    titleAr: title.ar || "",
    titleEn: title.en || "",
    titleDe: title.de || "",
    contentAr: content.ar || "",
    contentEn: content.en || "",
    contentDe: content.de || "",
  }
}
