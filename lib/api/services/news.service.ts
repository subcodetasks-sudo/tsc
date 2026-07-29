import { api } from "../client"
import type { News, PaginationMeta } from "../types"

export interface NewsFilter {
  per_page?: number
  page?: number
  search?: string
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

function extractNewsList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.news)) return obj.news

  return []
}

function normalizeNews(item: unknown, index: number, locale?: string): News | null {
  if (!item || typeof item !== "object") return null

  const row = item as Record<string, unknown>
  const id = typeof row.id === "number" ? row.id : index + 1

  const title = pickLocalizedString(row.title, locale)
  const slug =
    (typeof row.slug === "string" && row.slug) ||
    (typeof row.id === "number" ? String(row.id) : `article-${index + 1}`)

  const excerpt = pickLocalizedString(row.excerpt ?? row.summary ?? row.description, locale)
  const content = pickLocalizedString(row.content ?? row.body, locale) || excerpt

  const published_at =
    (typeof row.published_at === "string" && row.published_at) ||
    (typeof row.created_at === "string" && row.created_at) ||
    new Date().toISOString()

  const image =
    pickLocalizedString(row.image ?? row.image_url ?? row.thumbnail, locale) || undefined

  if (!title && !excerpt) return null

  return {
    id,
    title: title || "—",
    slug,
    excerpt: excerpt || "",
    content: content || excerpt || "",
    image: image || undefined,
    published_at,
  }
}

function parseNewsResponse(response: unknown, locale?: string): {
  data: News[]
  meta?: PaginationMeta
} {
  if (!response || typeof response !== "object") {
    return { data: [] }
  }

  const root = response as Record<string, unknown>
  const meta = root.meta as PaginationMeta | undefined

  const candidates = [root.data, root, extractNewsList(root.data)]

  for (const candidate of candidates) {
    const list = extractNewsList(candidate)
    if (list.length === 0) continue

    const data = list
      .map((item, index) => normalizeNews(item, index, locale))
      .filter((item): item is News => item !== null)

    return { data, meta }
  }

  return { data: [], meta }
}

export async function getNews(
  filter: NewsFilter = {},
  locale = "ar"
): Promise<{ data: News[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value))
  })

  const query = params.toString() ? `?${params}` : ""
  const endpoints = [`/news${query}`, `/public/news${query}`]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        cache: "force-cache",
      })
      const parsed = parseNewsResponse(response, locale)
      if (parsed.data.length > 0) return parsed
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes("404") && !message.includes("could not be found")) {
        console.error(err)
      }
    }
  }

  return { data: [] }
}

export async function getAdminNews(
  token: string,
  filter: NewsFilter = {},
  locale = "ar"
): Promise<{ data: News[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value))
  })
  const query = params.toString() ? `?${params}` : ""
  const response = await api.get<unknown>(`/news${query}`, { token, locale })
  return parseNewsResponse(response, locale)
}

export async function deleteNewsItem(
  id: number,
  token: string,
  locale = "ar"
): Promise<void> {
  await api.delete(`/news/${id}`, { token, locale })
}

export async function createNewsItem(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<News> {
  const response = await api.post<unknown>(`/news`, formData, { token, locale })
  const parsed = parseNewsResponse(response, locale)
  return parsed.data[0] ?? { id: 0, title: "", slug: "", excerpt: "", content: "", published_at: "" }
}

export async function updateNewsItem(
  id: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<News> {
  const response = await api.post<unknown>(`/news/${id}`, formData, { token, locale })
  const parsed = parseNewsResponse(response, locale)
  return parsed.data[0] ?? { id, title: "", slug: "", excerpt: "", content: "", published_at: "" }
}

export async function getNewsItem(slug: string, locale = "ar"): Promise<News | null> {
  const endpoints = [`/news/${slug}`, `/public/news/${slug}`]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        cache: "force-cache",
      })

      if (!response || typeof response !== "object") continue

      const root = response as Record<string, unknown>
      const item = root.data ?? response
      const normalized = normalizeNews(item, 0, locale)
      if (normalized) return normalized
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes("404") && !message.includes("could not be found")) {
        console.error(err)
      }
    }
  }

  return null
}

export async function getAdminNewsItem(
  id: number | string,
  token: string,
  locale = "ar"
): Promise<News | null> {
  try {
    const response = await api.get<unknown>(`/news/${id}`, { token, locale })
    if (!response || typeof response !== "object") return null
    const root = response as Record<string, unknown>
    const item = root.data ?? response
    return normalizeNews(item, 0, locale)
  } catch (err) {
    console.error("[getAdminNewsItem] error:", err)
    return null
  }
}

// Return raw news item (un-normalized) for admin editors
export async function getAdminNewsItemRaw(
  id: number | string,
  token: string,
  locale = "ar"
): Promise<any | null> {
  try {
    const response = await api.get<unknown>(`/news/${id}`, { token, locale })
    if (!response || typeof response !== "object") return null
    const root = response as Record<string, unknown>
    const item = (root.data ?? response) as any
    return item
  } catch (err) {
    console.error("[getAdminNewsItemRaw] error:", err)
    return null
  }
}
