import { api } from "../client"
import type { PaginationMeta } from "../types"
import { normalizeRichTextHtml } from "@/lib/rich-text"

export type Faq = {
  id: number | string
  question?: string
  answer?: string
}

export interface FaqFilter {
  per_page?: number
  page?: number
}

function extractFaqList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.faqs)) return obj.faqs

  return []
}

function extractLocalizedString(val: unknown, locale = "ar") {
  if (!val) return ""
  if (typeof val === "string") return val
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>
    // direct locale keys
    if (typeof obj[locale] === "string") return obj[locale] as string
    // common language keys
    if (typeof obj.ar === "string") return obj.ar
    if (typeof obj.en === "string") return obj.en
    if (typeof obj.de === "string") return obj.de
    // fallback known properties
    if (typeof obj.title === "string") return obj.title
    if (typeof obj.name === "string") return obj.name
    // try to find any string property
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (typeof v === "string") return v
    }
  }
  return ""
}

function normalizeFaq(item: unknown, index: number, locale = "ar"): Faq | null {
  if (!item || typeof item !== "object") return null
  const row = item as Record<string, unknown>
  const id = typeof row.id === "number" ? row.id : index + 1
  const question = extractLocalizedString(row.question ?? row.title ?? row, locale)
  const answer = normalizeRichTextHtml(extractLocalizedString(row.answer ?? row.content ?? row, locale))
  if (!question && !answer) return null
  return { id, question: question || "", answer: answer || "" }
}

function parseFaqResponse(response: unknown, locale = "ar"): { data: Faq[]; meta?: PaginationMeta } {
  if (!response || typeof response !== "object") return { data: [] }
  const root = response as Record<string, unknown>
  const meta = root.meta as PaginationMeta | undefined
  const candidates = [root.data, root, extractFaqList(root.data)]

  for (const candidate of candidates) {
    const list = extractFaqList(candidate)
    if (list.length === 0) continue

    const data = list
      .map((item, index) => normalizeFaq(item, index, locale))
      .filter((item): item is Faq => item !== null)

    return { data, meta }
  }

  return { data: [], meta }
}

export async function getFaqs(filter: FaqFilter = {}, locale = "ar") {
  const params = new URLSearchParams()
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined) params.append(k, String(v))
  })
  const query = params.toString() ? `?${params}` : ""
  try {
    const response = await api.get<unknown>(`/faqs${query}`, { locale, cache: "force-cache" })
    return parseFaqResponse(response, locale)
  } catch (err) {
    console.error(err)
    return { data: [] }
  }
}

export async function getAdminFaqs(token: string, filter: FaqFilter = {}, locale = "ar") {
  const params = new URLSearchParams()
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined) params.append(k, String(v))
  })
  const query = params.toString() ? `?${params}` : ""
  const response = await api.get<unknown>(`/faqs${query}`, { token, locale })
  return parseFaqResponse(response, locale)
}

export async function getAdminFaqItem(id: number | string, token: string, locale = "ar") {
  try {
    const response = await api.get<unknown>(`/faqs/${id}`, { token, locale })
    if (!response || typeof response !== "object") return null
    const root = response as Record<string, unknown>
    const item = root.data ?? response
    return normalizeFaq(item, 0, locale)
  } catch (err) {
    console.error("[getAdminFaqItem]", err)
    return null
  }
}

export async function deleteFaq(id: number | string, token: string, locale = "ar") {
  await api.delete(`/faqs/${id}`, { token, locale })
}

export async function createFaq(formData: FormData, token: string, locale = "ar") {
  const response = await api.post<unknown>(`/faqs`, formData, { token, locale })
  const parsed = parseFaqResponse(response)
  return parsed.data[0] ?? { id: 0, question: "", answer: "" }
}

export async function updateFaq(id: number | string, formData: FormData, token: string, locale = "ar") {
  // Some backends accept POST to the resource URI for updates (observed working via Postman).
  // Use plain POST to `/faqs/{id}` rather than method-override to avoid backend PUT mismatch.
  const response = await api.post<unknown>(`/faqs/${id}`, formData, { token, locale })
  const parsed = parseFaqResponse(response)
  return parsed.data[0] ?? { id, question: "", answer: "" }
}
