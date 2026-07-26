import { normalizeRichTextHtml } from "@/lib/rich-text"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://dashboardtalent.talent-sc.de/api/v1"

type Locale = "ar" | "en" | "de"

type FaqApiItem = {
  id?: number | string
  question?: string
  answer?: string
  sortOrder?: number
}

type SettingsEntry = {
  key?: string
  value?: unknown
}

type SettingsPayload = {
  data?: SettingsEntry[]
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export type LegalSection = {
  title: string
  content: string
}

export type LegalPageContent = {
  eyebrow: string
  title: string
  description: string
  sections: LegalSection[]
}

function normalizeLocale(locale: string): Locale {
  if (locale === "ar" || locale === "en") {
    return locale
  }

  return "de"
}

type NestedLegalContent = {
  title?: string
  content: string
}

/**
 * The admin "terms of service" / "privacy policy" settings store value as
 * `{ title: { ar, en, de }, content: { ar, en, de } }` (rich HTML per locale).
 * Detect that shape before falling back to the flat `{ ar, en, de }` string map.
 */
function pickNestedLegalContent(value: unknown, locale: string): NestedLegalContent | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  if (!("content" in record)) {
    return null
  }

  const content = pickLocalizedText(record.content, locale)
  if (!content) {
    return null
  }

  return {
    title: pickLocalizedText(record.title, locale),
    content,
  }
}

function pickLocalizedText(value: unknown, locale: string): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (!value || typeof value !== "object") {
    return undefined
  }

  const record = value as Record<string, unknown>

  for (const candidateLocale of [locale, "ar", "en", "de"]) {
    const candidate = record[candidateLocale]
    if (typeof candidate === "string") {
      const trimmed = candidate.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }

  return undefined
}

async function fetchJson<T>(path: string, locale: string): Promise<T | null> {
  try {
    const fullUrl = `${API_BASE}${path}`
    const response = await fetch(fullUrl, {
      headers: {
        Accept: "application/json",
        "Accept-Language": locale,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.debug(`[legal-content] ${path} returned ${response.status}`)
      return null
    }

    const text = await response.text()
    if (!text) {
      return null
    }

    try {
      return JSON.parse(text) as T
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error(`[legal-content] JSON parse error at ${fullUrl}:`, parseError)
      return null
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[legal-content] fetch error:`, err)
    return null
  }
}

function normalizeFaqItems(payload: unknown): FaqItem[] {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const record = payload as { data?: unknown }
  if (!Array.isArray(record.data)) {
    return []
  }

  return record.data
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const faq = item as FaqApiItem
      const question = faq.question?.trim()
      const answer = normalizeRichTextHtml(faq.answer)

      if (!question || !answer) {
        return null
      }

      return {
        id: String(faq.id ?? index + 1),
        question,
        answer,
      }
    })
    .filter((item): item is FaqItem => Boolean(item))
}

async function loadPublicSettings(locale: string): Promise<Record<string, unknown>> {
  const payload = await fetchJson<SettingsPayload>("/settings", locale)
  if (!payload?.data) {
    return {}
  }

  return payload.data.reduce<Record<string, unknown>>((accumulator, entry) => {
    if (entry?.key) {
      accumulator[entry.key] = entry.value
    }

    return accumulator
  }, {})
}

const MAX_FAQ_PAGES = 20

export async function loadFaqs(locale: string): Promise<FaqItem[]> {
  const normalizedLocale = normalizeLocale(locale)
  const items: FaqItem[] = []
  let page = 1
  let lastPage = 1

  do {
    const payload = await fetchJson<{ data?: unknown; meta?: { last_page?: number } }>(
      `/faqs?per_page=50&page=${page}`,
      normalizedLocale,
    )

    if (!payload) {
      break
    }

    items.push(...normalizeFaqItems(payload))
    lastPage = payload.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage && page <= MAX_FAQ_PAGES)

  return items
}

export async function loadLegalPageContent(locale: string, page: "terms" | "privacy"): Promise<LegalPageContent | null> {
  const normalizedLocale = normalizeLocale(locale)
  const settings = await loadPublicSettings(normalizedLocale)
  const keys = page === "terms"
    ? ["terms_of_service", "terms", "terms_and_conditions", "service_terms"]
    : ["privacy_policy", "privacy", "privacy_policy_text"]

  const fallbackTitle = page === "terms" ? "Terms of Service" : "Privacy Policy"

  for (const key of keys) {
    const value = settings[key]

    const nested = pickNestedLegalContent(value, normalizedLocale)
    if (nested) {
      const sectionTitle = nested.title || fallbackTitle
      return {
        eyebrow: page === "terms" ? "Terms" : "Privacy",
        title: sectionTitle,
        description: sectionTitle,
        sections: [
          {
            title: sectionTitle,
            content: normalizeRichTextHtml(nested.content),
          },
        ],
      }
    }

    const text = pickLocalizedText(value, normalizedLocale)
    if (!text) {
      continue
    }

    return {
      eyebrow: page === "terms" ? "Terms" : "Privacy",
      title: fallbackTitle,
      description: text,
      sections: [
        {
          title: fallbackTitle,
          content: normalizeRichTextHtml(text),
        },
      ],
    }
  }

  return null
}
