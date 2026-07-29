import { api } from "../client"
import type { ApiResponse, PaginationMeta, SuccessStory } from "../types"

export type SuccessStoryFilter = {
  per_page?: number
  page?: number
}

function pickLocalizedString(value: unknown, locale?: string): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const map = value as Record<string, string>
    if (locale && map[locale]) return map[locale]
    return map.ar ?? map.en ?? map.de ?? Object.values(map).find((v) => typeof v === "string") ?? ""
  }
  return ""
}

function extractStoriesList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.success_stories)) return obj.success_stories

  return []
}

function normalizeSuccessStory(item: unknown, index: number, locale?: string): SuccessStory | null {
  if (!item || typeof item !== "object") return null

  const row = item as Record<string, unknown>
  const id = typeof row.id === "number" ? row.id : index + 1

  const name = pickLocalizedString(row.name, locale)
  const role = pickLocalizedString(row.role ?? row.position, locale)
  const quote = pickLocalizedString(row.quote ?? row.content ?? row.description, locale)
  const location = pickLocalizedString(row.location, locale)

  if (!name && !role && !quote) return null

  return {
    id,
    name: name || "—",
    role: role || location || "",
    location: location || undefined,
    quote: quote || "",
    image: pickLocalizedString(row.image, locale) || null,
    image_url:
      pickLocalizedString(row.image_url ?? row.avatar ?? row.image, locale) || null,
    is_active: row.is_active as boolean | undefined,
    sort_order: row.sort_order as number | undefined,
  }
}

function parseSuccessStoriesResponse(response: unknown, locale?: string): {
  data: SuccessStory[]
  meta?: PaginationMeta
} {
  if (!response || typeof response !== "object") {
    return { data: [] }
  }

  const root = response as Record<string, unknown>
  const meta = root.meta as PaginationMeta | undefined

  const candidates = [
    root.data,
    root,
    extractStoriesList(root.data),
  ]

  for (const candidate of candidates) {
    const list = extractStoriesList(candidate)
    if (list.length === 0) continue

    const data = list
      .map((item, index) => normalizeSuccessStory(item, index, locale))
      .filter((item): item is SuccessStory => item !== null)

    return { data, meta }
  }

  return { data: [], meta }
}

export async function getSuccessStories(
  locale = "ar",
  filter: SuccessStoryFilter = {}
): Promise<{ data: SuccessStory[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  if (filter.per_page) params.set("per_page", String(filter.per_page))
  if (filter.page) params.set("page", String(filter.page))
  const query = params.toString() ? `?${params}` : ""

  const endpoints = [`/success-stories${query}`, `/public/success-stories${query}`]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        cache: "force-cache",
      })
      const parsed = parseSuccessStoriesResponse(response, locale)
      if (parsed.data.length > 0) return parsed
    } catch (err) {
      console.error(err)
    }
  }

  return { data: [] }
}

export async function getAdminSuccessStories(
  token: string,
  locale = "ar",
  filter: SuccessStoryFilter = {}
): Promise<{ data: SuccessStory[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  if (filter.per_page) params.set("per_page", String(filter.per_page))
  if (filter.page) params.set("page", String(filter.page))
  const query = params.toString() ? `?${params}` : ""

  const response = await api.get<unknown>(`/success-stories${query}`, {
    token,
    locale,
  })
  return parseSuccessStoriesResponse(response, locale)
}

export async function deleteSuccessStory(id: number, token: string, locale = "ar"): Promise<void> {
  await api.delete(`/success-stories/${id}`, { token, locale })
}

export async function createSuccessStory(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<SuccessStory> {
  const response = await api.post<ApiResponse<unknown>>(`/success-stories`, formData, {
    token,
    locale,
  })
  const parsed = parseSuccessStoriesResponse(response, locale)
  return parsed.data[0] ?? { id: 0, name: "", role: "", quote: "" }
}

export async function updateSuccessStory(
  id: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<SuccessStory> {
  const response = await api.post<ApiResponse<unknown>>(`/success-stories/${id}`, formData, {
    token,
    locale,
  })
  const parsed = parseSuccessStoriesResponse(response, locale)
  return parsed.data[0] ?? { id, name: "", role: "", quote: "" }
}

export async function getAdminSuccessStory(
  id: number | string,
  token: string,
  locale = "ar"
): Promise<SuccessStory | null> {
  try {
    const response = await api.get<unknown>(`/success-stories/${id}`, { token, locale })
    if (!response || typeof response !== "object") return null
    const root = response as Record<string, unknown>
    const item = root.data ?? response
    return normalizeSuccessStory(item, 0, locale)
  } catch (err) {
    console.error("[getAdminSuccessStory] error:", err)
    return null
  }
}
