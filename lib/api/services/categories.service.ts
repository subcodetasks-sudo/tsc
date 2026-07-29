// lib/api/services/categories.service.ts
import { api } from "../client"
import { getHomeData } from "./home.service"
import type { ApiResponse, Category, SubCategory } from "../types"

function pickName(item: Record<string, unknown>, locale: string): string {
  if (typeof item.name === "string") return item.name
  const names = item.name as Record<string, string> | undefined
  if (names && typeof names === "object") {
    return names[locale] || names.en || names.ar || names.de || ""
  }
  const title = item.title
  if (typeof title === "string") return title
  if (title && typeof title === "object") {
    const map = title as Record<string, string>
    return map[locale] || map.en || map.ar || map.de || ""
  }
  return String(item.label || "")
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>

  if (Array.isArray(obj.categories)) return obj.categories
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.items)) return obj.items

  const data = obj.data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>
    if (Array.isArray(nested.categories)) return nested.categories
    if (Array.isArray(nested.data)) return nested.data
    if (Array.isArray(nested.items)) return nested.items
  }

  return []
}

function parseSubCategory(raw: Record<string, unknown>, locale: string): SubCategory | null {
  const id = Number(raw.id)
  if (!Number.isFinite(id) || id <= 0) return null

  const name = pickName(raw, locale)
  if (!name) return null

  return {
    id,
    name,
    slug: typeof raw.slug === "string" ? raw.slug : undefined,
  }
}

function pickLocalizedMedia(value: unknown, locale: string): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (!value || typeof value !== "object") return undefined
  const map = value as Record<string, unknown>
  for (const key of [locale, "ar", "en", "de"]) {
    const candidate = map[key]
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }
  for (const candidate of Object.values(map)) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }
  return undefined
}

function parseCategory(raw: Record<string, unknown>, locale: string): Category | null {
  const id = Number(raw.id)
  if (!Number.isFinite(id) || id <= 0) return null

  const name = pickName(raw, locale)
  if (!name) return null

  const subs =
    raw.sub_categories ??
    raw.subCategories ??
    raw.subcategories ??
    raw.sub_categories_list ??
    raw.children ??
    raw.subs

  let sub_categories: SubCategory[] | undefined

  if (Array.isArray(subs)) {
    sub_categories = subs
      .map((s) => parseSubCategory(s as Record<string, unknown>, locale))
      .filter((s): s is SubCategory => s !== null)
  }

  return {
    id,
    name,
    slug: String(raw.slug || ""),
    icon: pickLocalizedMedia(raw.icon ?? raw.icon_url, locale),
    jobs_count:
      raw.jobs_count != null
        ? Number(raw.jobs_count)
        : raw.jobsCount != null
          ? Number(raw.jobsCount)
          : raw.vacancyCount != null
            ? Number(raw.vacancyCount)
            : raw.vacancy_count != null
              ? Number(raw.vacancy_count)
              : undefined,
    sub_categories: sub_categories?.length ? sub_categories : undefined,
  }
}

function parseCategoriesResponse(response: unknown, locale: string): Category[] {
  if (!response) return []

  const root = response as Record<string, unknown>
  const candidates = [root.data, root, extractList(root.data), extractList(root)]

  for (const candidate of candidates) {
    const list = extractList(candidate)
    if (list.length === 0) continue

    const parsed = list
      .map((item) => parseCategory(item as Record<string, unknown>, locale))
      .filter((item): item is Category => item !== null)

    if (parsed.length > 0) return parsed
  }

  return []
}

async function fetchCategoriesFromEndpoint(
  endpoint: string,
  locale: string,
  token?: string
): Promise<Category[]> {
  const response = await api.get<unknown>(endpoint, {
    locale,
    token,
    next: { revalidate: 300 },
    timeout: 8000,
  })
  return parseCategoriesResponse(response, locale)
}

export async function getCategories(
  locale = "ar",
  token?: string
): Promise<Category[]> {
  const endpoints = ["/categories", "/public/categories"]

  for (const endpoint of endpoints) {
    try {
      const parsed = await fetchCategoriesFromEndpoint(endpoint, locale, token)
      if (parsed.length > 0) return parsed
    } catch (err) {
      console.error(err)
      // try next endpoint
    }
  }

  try {
    const response = await api.get<ApiResponse<unknown>>("/public/categories", {
      locale,
      token,
      next: { revalidate: 60 },
      timeout: 15000, // Increase timeout for slow categories endpoint
    })
    const parsed = parseCategoriesResponse(response, locale)
    if (parsed.length > 0) return parsed
  } catch (err) {
    console.error(err)
    // fall through
  }

  return []
}

// Get raw categories with all fields preserved (for admin editors)
export async function getCategoriesRaw(locale?: string, token?: string): Promise<any[]> {
  try {
    const response = await api.get<unknown>("/categories", { locale, token, timeout: 15000 })
    if (!response || typeof response !== "object") return []

    const root = response as Record<string, unknown>
    
    // Try to extract the data array from various possible response structures
    let list: any[] = []
    
    if (Array.isArray(root.data)) {
      list = root.data
    } else if (Array.isArray(response)) {
      list = response as any[]
    } else if (Array.isArray(root)) {
      list = root as any[]
    }
    
    // Ensure each item has sub_categories initialized if not present
    return list.map((item) => ({
      ...item,
      sub_categories: item.sub_categories || item.subCategories || item.subcategories || item.children || [],
    }))
  } catch (err) {
    console.error("[getCategoriesRaw] error:", err)
    return []
  }
}

/** Categories for forms: parallel API fetch, then home payload fallback. */
export async function getCategoriesForForm(
  locale = "ar",
  token?: string
): Promise<Category[]> {
  const endpoints = ["/categories", "/public/categories"]
  const results = await Promise.allSettled(
    endpoints.map((endpoint) => fetchCategoriesFromEndpoint(endpoint, locale, token))
  )

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      return result.value
    }
  }

  try {
    const home = await getHomeData(locale)
    if (home.categories?.length) return home.categories
  } catch {
    // ignore
  }

  return []
}

/** Admin: create a new category */
export async function createCategoryAdmin(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<void> {
  await api.post<unknown>("/categories", formData, { token, locale })
}

/** Admin: update an existing category */
export async function updateCategoryAdmin(
  id: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<void> {
  // Backend expects POST /categories/:id for updates (per Postman collection)
  // Remove any stale id field from FormData to avoid conflicts
  formData.delete("id")
  await api.post<unknown>(`/categories/${id}`, formData, { token, locale })
}

/** Admin: delete a category */
export async function deleteCategoryAdmin(
  id: number,
  token: string,
  locale = "ar"
): Promise<void> {
  await api.delete(`/categories/${id}`, { token, locale })
}
