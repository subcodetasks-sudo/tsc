import { api } from "../client"
import type { ApiResponse, PaginationMeta, Partner } from "../types"

export type PartnerFilter = {
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

function extractPartnersList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.partners)) return obj.partners

  return []
}

function normalizePartner(item: unknown, index: number, locale?: string): Partner | null {
  if (!item || typeof item !== "object") return null

  const row = item as Record<string, unknown>
  const id = typeof row.id === "number" ? row.id : index + 1
  const name = pickLocalizedString(row.name, locale)
  const logo =
    pickLocalizedString(row.logo_url ?? row.logo ?? row.image_url ?? row.image, locale) || null

  if (!name && !logo) return null

  const website =
    typeof row.website_url === "string"
      ? row.website_url
      : typeof row.website === "string"
        ? row.website
        : typeof row.url === "string"
          ? row.url
          : null

  return {
    id,
    name: name || "—",
    logo,
    logo_url: logo,
    website_url: website,
    is_active: row.is_active as boolean | undefined,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : undefined,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  }
}

function parsePartnersResponse(
  response: unknown,
  locale?: string
): { data: Partner[]; meta?: PaginationMeta } {
  if (!response || typeof response !== "object") {
    return { data: [] }
  }

  const root = response as Record<string, unknown>
  const meta = root.meta as PaginationMeta | undefined

  const candidates = [root.data, root, extractPartnersList(root.data)]

  for (const candidate of candidates) {
    const list = extractPartnersList(candidate)
    if (list.length === 0) continue

    const data = list
      .map((item, index) => normalizePartner(item, index, locale))
      .filter((item): item is Partner => item !== null)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    return { data, meta }
  }

  return { data: [], meta }
}

export async function getPartners(
  locale = "ar",
  filter: PartnerFilter = {}
): Promise<{ data: Partner[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  if (filter.per_page) params.set("per_page", String(filter.per_page))
  if (filter.page) params.set("page", String(filter.page))
  const query = params.toString() ? `?${params}` : ""

  const endpoints = [`/partners${query}`, `/public/partners${query}`]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        cache: "force-cache",
      })
      const parsed = parsePartnersResponse(response, locale)
      if (parsed.data.length > 0) return parsed
    } catch (err) {
      console.error(err)
    }
  }

  return { data: [] }
}

export async function getAdminPartners(
  token: string,
  locale = "ar",
  filter: PartnerFilter = {}
): Promise<{ data: Partner[]; meta?: PaginationMeta }> {
  const params = new URLSearchParams()
  if (filter.per_page) params.set("per_page", String(filter.per_page))
  if (filter.page) params.set("page", String(filter.page))
  const query = params.toString() ? `?${params}` : ""

  const response = await api.get<unknown>(`/partners${query}`, {
    token,
    locale,
  })
  return parsePartnersResponse(response, locale)
}

export async function getAdminPartner(
  id: number | string,
  token: string,
  locale = "ar"
): Promise<Partner | null> {
  try {
    const response = await api.get<unknown>(`/partners/${id}`, { token, locale })
    if (!response || typeof response !== "object") return null
    const root = response as Record<string, unknown>
    const item = root.data ?? response
    return normalizePartner(item, 0, locale)
  } catch (err) {
    console.error("[getAdminPartner] error:", err)
    return null
  }
}

export async function createPartner(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<Partner> {
  const response = await api.post<ApiResponse<unknown>>(`/partners`, formData, {
    token,
    locale,
  })
  const parsed = parsePartnersResponse(response, locale)
  return parsed.data[0] ?? { id: 0, name: "" }
}

export async function updatePartner(
  id: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<Partner> {
  const response = await api.post<ApiResponse<unknown>>(`/partners/${id}`, formData, {
    token,
    locale,
  })
  const parsed = parsePartnersResponse(response, locale)
  return parsed.data[0] ?? { id, name: "" }
}

export async function deletePartner(id: number, token: string, locale = "ar"): Promise<void> {
  await api.delete(`/partners/${id}`, { token, locale })
}
