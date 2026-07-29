import { z } from "zod"

export const MEDIA_LOCALES = ["ar", "en", "de"] as const
export type MediaLocaleKey = (typeof MEDIA_LOCALES)[number]

export type LocalizedMediaFiles = Record<MediaLocaleKey, File | null>
export type LocalizedMediaPreviews = Record<MediaLocaleKey, string | null>
export type LocalizedMediaUrls = Record<MediaLocaleKey, string>

export const localizedMediaFilesSchema = z.object({
  ar: z.custom<File | null | undefined>().optional().nullable(),
  en: z.custom<File | null | undefined>().optional().nullable(),
  de: z.custom<File | null | undefined>().optional().nullable(),
})

export const localizedMediaPreviewsSchema = z.object({
  ar: z.string().nullable().optional(),
  en: z.string().nullable().optional(),
  de: z.string().nullable().optional(),
})

export const localizedMediaUrlsSchema = z.object({
  ar: z.string().optional(),
  en: z.string().optional(),
  de: z.string().optional(),
})

export function emptyLocalizedMediaFiles(): LocalizedMediaFiles {
  return { ar: null, en: null, de: null }
}

export function emptyLocalizedMediaPreviews(): LocalizedMediaPreviews {
  return { ar: null, en: null, de: null }
}

export function emptyLocalizedMediaUrls(): LocalizedMediaUrls {
  return { ar: "", en: "", de: "" }
}

/** Resolve a media URL for a locale from a string or `{ ar, en, de }` object. */
export function pickLocalizedMediaUrl(value: unknown, locale: string = "ar"): string {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return ""

  const map = value as Record<string, unknown>
  const priority = [locale, "ar", "en", "de"]
  for (const key of priority) {
    const candidate = map[key]
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  for (const candidate of Object.values(map)) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  return ""
}

/**
 * Build per-locale existing URLs from `__allLocales` (or a single item).
 * Tries each candidate field name on the locale row (e.g. `image`, `imageUrl`).
 * Handles Option A (resolved string per locale response) and Option B (`{ar,en,de}` maps).
 */
export function mapLocalizedMediaFromAllLocales(
  allLocales: Record<string, unknown> | undefined,
  fieldNames: string[],
  fallbackItem?: Record<string, unknown> | null
): LocalizedMediaUrls {
  const out = emptyLocalizedMediaUrls()

  for (const loc of MEDIA_LOCALES) {
    const row = (allLocales?.[loc] ?? fallbackItem) as Record<string, unknown> | undefined
    if (!row) continue

    for (const field of fieldNames) {
      const url = pickLocalizedMediaUrl(row[field], loc)
      if (url) {
        out[loc] = url
        break
      }
    }
  }

  // If only a shared string existed on the fallback item, seed empty locales from it.
  if (fallbackItem) {
    for (const field of fieldNames) {
      const shared = pickLocalizedMediaUrl(fallbackItem[field], "ar")
      if (!shared) continue
      for (const loc of MEDIA_LOCALES) {
        if (!out[loc]) out[loc] = shared
      }
      break
    }
  }

  return out
}

/** Append only newly selected files as `key[ar]`, `key[en]`, `key[de]`. */
export function appendLocalizedFiles(
  formData: FormData,
  key: string,
  files: Partial<LocalizedMediaFiles> | null | undefined
) {
  if (!files) return
  for (const loc of MEDIA_LOCALES) {
    const file = files[loc]
    if (file instanceof File) {
      formData.append(`${key}[${loc}]`, file, file.name || `${key}-${loc}`)
    }
  }
}
