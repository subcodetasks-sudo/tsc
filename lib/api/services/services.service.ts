import { api } from "../client"

export interface ServiceFeature {
  id: number
  title: string
  description: string
  icon?: string
  sortOrder?: number
}

export interface Service {
  id: number
  title: string
  description: string
  icon?: string
  image?: string
  features: ServiceFeature[]
}

function pickLocalizedString(value: unknown, locale = "ar"): string {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return ""

  const map = value as Record<string, unknown>
  const priority = [locale, "ar", "en", "de"]

  for (const key of priority) {
    const candidate = map[key]
    if (typeof candidate === "string" && candidate.trim()) return candidate
  }

  for (const candidate of Object.values(map)) {
    if (typeof candidate === "string" && candidate.trim()) return candidate
  }

  return ""
}

function normalizeFeature(item: unknown, locale = "ar"): ServiceFeature | null {
  if (!item || typeof item !== "object") return null

  const row = item as Record<string, unknown>
  const title = pickLocalizedString(row.title, locale)
  const description = pickLocalizedString(row.description ?? row.content, locale)

  if (!title) return null

  return {
    id: typeof row.id === "number" ? row.id : 0,
    title,
    description,
    icon: pickLocalizedString(row.icon, locale) || undefined,
    sortOrder:
      typeof row.sortOrder === "number"
        ? row.sortOrder
        : typeof row.sort_order === "number"
          ? row.sort_order
          : undefined,
  }
}

function normalizeService(item: unknown, locale = "ar"): Service | null {
  if (!item || typeof item !== "object") return null

  const row = item as Record<string, unknown>
  const title = pickLocalizedString(row.title, locale)
  const description = pickLocalizedString(row.description ?? row.content, locale)

  if (!title) return null

  const rawFeatures = row.features
  const features: ServiceFeature[] = []
  if (Array.isArray(rawFeatures)) {
    for (const f of rawFeatures) {
      const parsed = normalizeFeature(f, locale)
      if (parsed) features.push(parsed)
    }
  }

  return {
    id: typeof row.id === "number" ? row.id : 0,
    title,
    description,
    icon: pickLocalizedString(row.icon ?? row.icon_url, locale) || undefined,
    image: pickLocalizedString(row.image ?? row.image_url, locale) || undefined,
    features,
  }
}

export async function getServices(locale = "ar"): Promise<Service[]> {
  try {
    const response = await api.get<unknown>("/service", { locale })
    if (!response || typeof response !== "object") return []

    const root = response as Record<string, unknown>
    const list = Array.isArray(root.data) ? root.data : Array.isArray(response) ? response : []

    return list
      .map((item) => normalizeService(item, locale))
      .filter((s): s is Service => s !== null)
  } catch (err) {
    console.error("[getServices] error:", err)
    return []
  }
}

// Get raw service data with all language versions preserved (for editing)
export async function getServicesRaw(locale?: string): Promise<any[]> {
  try {
    const response = await api.get<unknown>("/service", { locale })
    if (!response || typeof response !== "object") return []

    const root = response as Record<string, unknown>
    const list = Array.isArray(root.data) ? root.data : Array.isArray(response) ? response : []

    return list
  } catch (err) {
    console.error("[getServicesRaw] error:", err)
    return []
  }
}

/** Raw show payload for a single service (locale-scoped title/description strings). */
export async function getServiceRaw(
  id: number | string,
  locale = "ar"
): Promise<Record<string, unknown> | null> {
  try {
    const response = await api.get<unknown>(`/service/${id}`, {
      locale,
      cache: "no-store",
    })
    if (!response || typeof response !== "object") return null

    const root = response as Record<string, unknown>
    const data = root.data
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>
    }
    return root
  } catch (err) {
    console.error("[getServiceRaw] error:", err)
    return null
  }
}

function extractServiceId(response: unknown, fallback?: number): number | null {
  if (!response || typeof response !== "object") return fallback ?? null

  const root = response as Record<string, unknown>
  const data = root.data

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const id = (data as Record<string, unknown>).id
    if (typeof id === "number") return id
    if (typeof id === "string" && id.trim() && !Number.isNaN(Number(id))) return Number(id)
  }

  if (typeof root.id === "number") return root.id
  return fallback ?? null
}

export async function createServiceAdmin(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<{ id: number | null }> {
  formData.delete("id")
  const response = await api.post<unknown>("/service", formData, { token, locale })
  return { id: extractServiceId(response) }
}

export async function updateServiceAdmin(
  id: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<{ id: number }> {
  // Backend expects POST /service/{id} for multipart updates (not PUT/PATCH).
  // Path owns the id — strip any body id so this never hits the create route.
  formData.delete("id")
  const response = await api.post<unknown>(`/service/${id}`, formData, { token, locale })
  const returnedId = extractServiceId(response, id)
  if (returnedId == null) {
    throw new Error("Service update response did not include an id")
  }
  return { id: returnedId }
}

export async function deleteServiceAdmin(
  id: number,
  token: string,
  locale = "ar"
): Promise<void> {
  await api.delete(`/service/${id}`, { token, locale })
}
