import { normalizeRichTextHtml } from "@/lib/rich-text"
import { LOCALES, type LocaleKey, type LocalizedText, type FaqFormValues } from "./faq-form-schema"

export function emptyLocalizedText(): LocalizedText {
  return { ar: "", en: "", de: "" }
}

export function initialFaqFormValues(): FaqFormValues {
  return {
    question: emptyLocalizedText(),
    answer: emptyLocalizedText(),
  }
}

export function buildFaqFormData(values: FaqFormValues, id?: number): FormData {
  const formData = new FormData()
  if (id) formData.append("id", String(id))

  for (const lang of LOCALES) {
    const question = values.question[lang]?.trim()
    const answer = normalizeRichTextHtml(values.answer[lang])
    if (question) formData.append(`question[${lang}]`, question)
    if (answer) formData.append(`answer[${lang}]`, answer)
  }

  return formData
}

// Upstream FAQ records shape question/answer as a plain string, an
// `{ar, en, de}` object, or suffixed keys like `question_ar` — normalize any
// of those into a full LocalizedText for the given locale.
export function parseLocalizedField(value: unknown, locale: LocaleKey): LocalizedText {
  const out = emptyLocalizedText()
  if (!value) return out

  if (typeof value === "string") {
    out[locale] = value
    return out
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.ar === "string" || typeof obj.en === "string" || typeof obj.de === "string") {
      out.ar = typeof obj.ar === "string" ? obj.ar : ""
      out.en = typeof obj.en === "string" ? obj.en : ""
      out.de = typeof obj.de === "string" ? obj.de : ""
      return out
    }

    for (const key of Object.keys(obj)) {
      const match = key.match(/_?(ar|en|de)$/)
      if (match) {
        const loc = match[1] as LocaleKey
        const v = obj[key]
        if (typeof v === "string") out[loc] = v
      }
    }
  }

  return out
}

/**
 * Builds RHF default values from a FAQ record fetched for editing.
 *
 * The edit page fetches the ar/en/de FAQ items separately and stitches them
 * together under `faq.__allLocales` so every language can be edited from one
 * form; this reconstructs a single localized shape from that raw, per-locale
 * API data.
 */
export function mapFaqToFormDefaults(faq: any, locale: string): FaqFormValues {
  const allLocales = faq?.__allLocales as Record<string, any> | undefined

  if (allLocales) {
    const question = emptyLocalizedText()
    const answer = emptyLocalizedText()

    for (const loc of LOCALES) {
      const item = allLocales[loc] ?? {}
      question[loc] = parseLocalizedField(item.question ?? item, loc)[loc] || ""
      answer[loc] = normalizeRichTextHtml(parseLocalizedField(item.answer ?? item, loc)[loc] || "")
    }

    return { question, answer }
  }

  const question = parseLocalizedField(faq?.question, locale as LocaleKey)
  const answer = parseLocalizedField(faq?.answer, locale as LocaleKey)
  for (const loc of LOCALES) {
    answer[loc] = normalizeRichTextHtml(answer[loc])
  }

  return { question, answer }
}
