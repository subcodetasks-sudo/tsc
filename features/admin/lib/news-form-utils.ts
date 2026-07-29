import { LOCALES, type LocaleKey, type LocalizedText, type NewsFormValues } from "./news-form-schema"
import {
  appendLocalizedFiles,
  emptyLocalizedMediaFiles,
  emptyLocalizedMediaPreviews,
  emptyLocalizedMediaUrls,
  mapLocalizedMediaFromAllLocales,
} from "./localized-media"

export function emptyLocalizedText(): LocalizedText {
  return { ar: "", en: "", de: "" }
}

export function initialNewsFormValues(): NewsFormValues {
  return {
    title: emptyLocalizedText(),
    description: emptyLocalizedText(),
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages: emptyLocalizedMediaUrls(),
  }
}

export function buildNewsFormData(values: NewsFormValues, id?: number): FormData {
  const formData = new FormData()
  if (id) formData.append("id", String(id))

  for (const lang of LOCALES) {
    const title = values.title[lang]?.trim()
    const description = values.description[lang]?.trim()
    if (title) formData.append(`title[${lang}]`, title)
    if (description) formData.append(`description[${lang}]`, description)
  }

  appendLocalizedFiles(formData, "image", values.imageFiles)

  return formData
}

// Upstream news records shape title/description as a plain string, an
// `{ar, en, de}` object, or suffixed keys like `title_ar` — normalize any of
// those into a full LocalizedText for the given locale.
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
 * Builds RHF default values from a news record fetched for editing.
 *
 * The edit page fetches the raw ar/en/de news items separately and stitches
 * them together under `newsItem.__allLocales` so every language can be
 * edited from one form; this reconstructs a single localized shape from
 * that raw, per-locale API data.
 */
export function mapNewsToFormDefaults(newsItem: any, locale: string): NewsFormValues {
  const allLocales = newsItem?.__allLocales as Record<string, any> | undefined

  if (allLocales) {
    const title = emptyLocalizedText()
    const description = emptyLocalizedText()

    for (const loc of LOCALES) {
      const item = allLocales[loc] ?? {}
      title[loc] = parseLocalizedField(item.title ?? item.title_raw ?? item, loc)[loc] || ""
      description[loc] = parseLocalizedField(item.description ?? item.content ?? item, loc)[loc] || ""
    }

    return {
      title,
      description,
      imageFiles: emptyLocalizedMediaFiles(),
      imagePreviews: emptyLocalizedMediaPreviews(),
      existingImages: mapLocalizedMediaFromAllLocales(allLocales, ["image", "imageUrl", "image_url", "thumbnail"]),
    }
  }

  const title = parseLocalizedField(newsItem?.title, locale as LocaleKey)
  const fallbackDescription = newsItem?.content ?? newsItem?.excerpt ?? newsItem?.description
  const description = parseLocalizedField(fallbackDescription, locale as LocaleKey)
  const existingImages = emptyLocalizedMediaUrls()
  const sharedImage = newsItem?.image ?? newsItem?.image_url ?? ""
  if (sharedImage) {
    for (const loc of LOCALES) existingImages[loc] = sharedImage
  }

  return {
    title,
    description,
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages,
  }
}
