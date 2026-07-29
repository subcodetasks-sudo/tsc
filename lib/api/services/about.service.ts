import { api } from "../client"
import type { ApiResponse } from "../types"

export type AboutFeature = {
  id: number | string
  title: string
  description: string
}

export type AboutPageContent = {
  title: string
  descriptionLeft: string
  descriptionRight: string
  secondTitle: string
  secondDescription: string
  image?: string | null
  secondImage?: string | null
  video?: string | null
  features: AboutFeature[]
}

function pickLocalizedString(value: unknown, locale = "ar"): string {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return ""

  const map = value as Record<string, unknown>
  const candidate = map[locale]
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim()

  return ""
}

function pickLocalizedField(
  row: Record<string, unknown>,
  field: string,
  locale = "ar"
): string {
  const direct = pickLocalizedString(row[field], locale)
  if (direct) return direct

  const priority = [`${field}_${locale}`, `${field}${locale}`]
  const fallbacks = [`${field}_ar`, `${field}_en`, `${field}_de`, `${field}ar`, `${field}en`, `${field}de`]

  for (const key of priority) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  for (const key of fallbacks) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  return ""
}

function extractData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null

  const root = raw as Record<string, unknown>
  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>
  }

  return root
}

function normalizeFeatures(raw: unknown, locale = "ar"): AboutFeature[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null

      const row = item as Record<string, unknown>
      const title = pickLocalizedField(row, "title", locale)
      const description =
        pickLocalizedField(row, "description", locale) ||
        pickLocalizedField(row, "content", locale)

      if (!title && !description) return null

      return {
        id:
          typeof row.id === "number"
            ? row.id
            : typeof row.id === "string"
              ? row.id
              : index + 1,
        title: title || "—",
        description: description || "",
      }
    })
    .filter((row): row is AboutFeature => row !== null)
}

function normalizeAbout(raw: unknown, locale = "ar"): AboutPageContent | null {
  const data = extractData(raw)
  if (!data) return null

  const title = pickLocalizedField(data, "title", locale)

  const descriptionLeft =
    pickLocalizedField(data, "description_left", locale) ||
    pickLocalizedField(data, "descriptionLeft", locale) ||
    pickLocalizedField(data, "description", locale)
  const descriptionRight =
    pickLocalizedField(data, "description_right", locale) ||
    pickLocalizedField(data, "descriptionRight", locale) ||
    pickLocalizedField(data, "description_left", locale)

  // The API returns secondSection as a nested object
  const secondSection = data.secondSection as Record<string, unknown> | undefined

  const secondTitle =
    pickLocalizedField(data, "second_title", locale) ||
    pickLocalizedField(data, "secondTitle", locale) ||
    pickLocalizedField(secondSection ?? {}, "title", locale) ||
    title
  const secondDescription =
    pickLocalizedField(data, "second_description", locale) ||
    pickLocalizedField(data, "secondDescription", locale) ||
    pickLocalizedField(secondSection ?? {}, "description", locale) ||
    pickLocalizedField(data, "description_right", locale) ||
    pickLocalizedField(data, "description_left", locale)

  const image =
    pickLocalizedString(data.imageUrl ?? data.image ?? data.image_url, locale) || null

  // secondImage: from secondSection.imageUrl
  const secondImage =
    pickLocalizedString(
      secondSection?.imageUrl ??
        data.second_image ??
        data.second_image_url ??
        data.secondImage,
      locale
    ) || null

  // video: API returns videoUrl
  const video =
    typeof data.videoUrl === "string"
      ? data.videoUrl
      : typeof data.video === "string"
        ? data.video
        : null

  const features = normalizeFeatures(data.features, locale)

  if (
    !title &&
    !descriptionLeft &&
    !descriptionRight &&
    !secondTitle &&
    !secondDescription &&
    features.length === 0
  ) {
    return null
  }

  return {
    title: title || "",
    descriptionLeft: descriptionLeft || "",
    descriptionRight: descriptionRight || "",
    secondTitle: secondTitle || title || "",
    secondDescription: secondDescription || descriptionLeft || "",
    image,
    secondImage,
    video,
    features,
  }
}

export async function getAbout(locale = "ar"): Promise<AboutPageContent | null> {
  // Try authenticated-style endpoint first, then public
  const endpoints = ["/about", "/public/about"]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        next: { revalidate: 60 },
      })
      const normalized = normalizeAbout(response, locale)
      if (normalized) return normalized
    } catch (err) {
      console.error(`[getAbout] ${endpoint} failed:`, err)
    }
  }

  return null
}

export async function getAdminAbout(
  token: string,
  locale = "ar"
): Promise<AboutPageContent | null> {
  const response = await api.get<unknown>("/about", { token, locale })
  return normalizeAbout(response, locale)
}

export async function updateAbout(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<AboutPageContent | null> {
  const response = await api.post<ApiResponse<unknown>>("/about", formData, { token, locale })
  return normalizeAbout(response, locale)
}
