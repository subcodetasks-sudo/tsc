import {
  LOCALES,
  type LocaleKey,
  type LocalizedText,
  type ServiceFeatureFormValues,
  type ServiceFormValues,
} from "./service-form-schema"
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

function toPositiveId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    const n = Number(value)
    if (n > 0) return n
  }
  return undefined
}

// Icon URL text is preview-only — the backend only accepts an uploaded icon
// file, so a typed URL is never submitted (mirrors the original form's
// behavior to avoid sending un-validated plain strings as the icon field).
//
// Nested keys match Laravel multipart: title[en], features[0][id], etc.
// Never put a top-level `id` here — create uses POST /service, update uses
// POST /service/{id} (path owns the id).
export function buildServiceFormData(values: ServiceFormValues): FormData {
  const formData = new FormData()

  for (const lang of LOCALES) {
    const title = values.title[lang]?.trim() ?? ""
    const description = values.description[lang]?.trim() ?? ""
    formData.append(`title[${lang}]`, title)
    formData.append(`description[${lang}]`, description)
  }

  appendLocalizedFiles(formData, "image", values.imageFiles)
  appendLocalizedFiles(formData, "icon", values.iconFiles)

  values.features.forEach((feature, index) => {
    // Existing feature DB ids MUST be sent on update so Laravel updates
    // in place instead of recreating features.
    if (typeof feature.id === "number" && feature.id > 0) {
      formData.append(`features[${index}][id]`, String(feature.id))
    }
    formData.append(`features[${index}][sort_order]`, String(index))

    for (const lang of LOCALES) {
      const title = feature.title[lang]?.trim() ?? ""
      const description = feature.description[lang]?.trim() ?? ""
      formData.append(`features[${index}][title][${lang}]`, title)
      formData.append(`features[${index}][description][${lang}]`, description)
    }
    if (feature.iconFile) formData.append(`features[${index}][icon]`, feature.iconFile)
  })

  return formData
}

export function initialServiceFormValues(): ServiceFormValues {
  return {
    title: emptyLocalizedText(),
    description: emptyLocalizedText(),
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages: emptyLocalizedMediaUrls(),
    iconFiles: emptyLocalizedMediaFiles(),
    iconPreviews: emptyLocalizedMediaPreviews(),
    existingIcons: emptyLocalizedMediaUrls(),
    features: [],
  }
}

// Upstream service records shape title/description as a plain string, an
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
 * Builds RHF default values from a service record fetched for editing.
 *
 * The edit page fetches the ar/en/de service lists separately and stitches
 * them together under `service.__allLocales` so every language can be
 * edited from one form; this reconstructs a single localized shape (and
 * merges each language's features by id, falling back to index order) from
 * that raw, per-locale API data.
 */
export function mapServiceToFormDefaults(service: any, locale: string): ServiceFormValues {
  const allLocales = service?.__allLocales as Record<string, any> | undefined

  if (allLocales) {
    const title = emptyLocalizedText()
    const description = emptyLocalizedText()

    for (const loc of LOCALES) {
      const item = allLocales[loc] ?? {}
      title[loc] = parseLocalizedField(item.title ?? item.title_raw ?? item, loc)[loc] || ""
      description[loc] = parseLocalizedField(item.description ?? item.content ?? item, loc)[loc] || ""
    }

    const featuresByLocale: Record<string, any[]> = {}
    for (const loc of LOCALES) {
      featuresByLocale[loc] = Array.isArray(allLocales[loc]?.features) ? allLocales[loc].features : []
    }

    const idSet = new Set<number>()
    for (const loc of LOCALES) {
      for (const f of featuresByLocale[loc]) {
        const fid = toPositiveId(f?.id)
        if (fid != null) idSet.add(fid)
      }
    }

    const features: ServiceFeatureFormValues[] = []
    if (idSet.size > 0) {
      for (const id of idSet) {
        features.push(buildFeatureAcrossLocales(featuresByLocale, (f) => toPositiveId(f?.id) === id, id))
      }
    } else {
      const maxLen = Math.max(0, ...LOCALES.map((l) => featuresByLocale[l].length))
      for (let i = 0; i < maxLen; i++) {
        features.push(buildFeatureAcrossLocales(featuresByLocale, undefined, undefined, i))
      }
    }

    return {
      title,
      description,
      imageFiles: emptyLocalizedMediaFiles(),
      imagePreviews: emptyLocalizedMediaPreviews(),
      existingImages: mapLocalizedMediaFromAllLocales(allLocales, ["image", "imageUrl", "image_url"]),
      iconFiles: emptyLocalizedMediaFiles(),
      iconPreviews: emptyLocalizedMediaPreviews(),
      existingIcons: mapLocalizedMediaFromAllLocales(allLocales, ["icon", "iconUrl", "icon_url"]),
      features,
    }
  }

  // Fallback: single-locale shaped service (no __allLocales metadata attached).
  const title = parseLocalizedField(service?.title ?? service?.title_raw ?? service, locale as LocaleKey)
  const description = parseLocalizedField(service?.description ?? service?.content ?? service, locale as LocaleKey)

  const features: ServiceFeatureFormValues[] = Array.isArray(service?.features)
    ? service.features.map((f: any) => ({
        id: toPositiveId(f.id),
        title: parseLocalizedField(f.title ?? f.title_raw ?? f, locale as LocaleKey),
        description: parseLocalizedField(f.description ?? f.content ?? f, locale as LocaleKey),
        icon: f.icon ?? "",
      }))
    : []

  const existingImages = emptyLocalizedMediaUrls()
  const existingIcons = emptyLocalizedMediaUrls()
  const sharedImage = service?.image ?? ""
  const sharedIcon = service?.icon ?? ""
  if (sharedImage) {
    for (const loc of LOCALES) existingImages[loc] = sharedImage
  }
  if (sharedIcon) {
    for (const loc of LOCALES) existingIcons[loc] = sharedIcon
  }

  return {
    title,
    description,
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages,
    iconFiles: emptyLocalizedMediaFiles(),
    iconPreviews: emptyLocalizedMediaPreviews(),
    existingIcons,
    features,
  }
}

function buildFeatureAcrossLocales(
  featuresByLocale: Record<string, any[]>,
  matchById?: (f: any) => boolean,
  id?: number,
  index?: number
): ServiceFeatureFormValues {
  const title = emptyLocalizedText()
  const description = emptyLocalizedText()
  let icon = ""

  for (const loc of LOCALES) {
    const f = matchById ? featuresByLocale[loc].find(matchById) : featuresByLocale[loc][index as number]
    title[loc] = parseLocalizedField(f?.title ?? f?.title_raw ?? f, loc)[loc] || ""
    description[loc] = parseLocalizedField(f?.description ?? f?.content ?? f, loc)[loc] || ""
    if (!icon && f?.icon) icon = f.icon
  }

  return { id, title, description, icon }
}
