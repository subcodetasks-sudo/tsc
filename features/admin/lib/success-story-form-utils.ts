import { type LocaleKey, type LocalizedText, type SuccessStoryFormValues } from "./success-story-form-schema"
import { LOCALES } from "./success-story-form-schema"
import {
  TESTIMONIAL_QUOTE_MAX_CHARS,
  truncateWithoutSpaces,
} from "@/lib/quote-limits"
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

export function initialSuccessStoryFormValues(): SuccessStoryFormValues {
  return {
    name: emptyLocalizedText(),
    role: emptyLocalizedText(),
    location: emptyLocalizedText(),
    quote: emptyLocalizedText(),
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages: emptyLocalizedMediaUrls(),
  }
}

export function buildSuccessStoryFormData(values: SuccessStoryFormValues, id?: number): FormData {
  const formData = new FormData()
  if (id) formData.append("id", String(id))

  for (const lang of LOCALES) {
    const name = values.name[lang]?.trim()
    const role = values.role[lang]?.trim()
    const location = values.location[lang]?.trim()
    const quote = values.quote[lang]?.trim()
    if (name) formData.append(`name[${lang}]`, name)
    if (role) formData.append(`role[${lang}]`, role)
    if (location) formData.append(`location[${lang}]`, location)
    if (quote) formData.append(`quote[${lang}]`, truncateWithoutSpaces(quote, TESTIMONIAL_QUOTE_MAX_CHARS))
  }

  appendLocalizedFiles(formData, "image", values.imageFiles)

  return formData
}

/**
 * Builds RHF default values from a success story record fetched for editing.
 *
 * The edit page fetches the ar/en/de story separately and stitches them under
 * `story.__allLocales` so every language tab can be pre-filled.
 */
export function mapStoryToFormDefaults(story: any, locale: string): SuccessStoryFormValues {
  const name = emptyLocalizedText()
  const role = emptyLocalizedText()
  const location = emptyLocalizedText()
  const quote = emptyLocalizedText()

  const allLocales = story?.__allLocales as Record<string, any> | undefined

  if (allLocales) {
    for (const loc of LOCALES) {
      const item = allLocales[loc] ?? {}
      name[loc] = item.name ?? ""
      role[loc] = item.role ?? ""
      location[loc] = item.location ?? ""
      quote[loc] = truncateWithoutSpaces(item.quote ?? "", TESTIMONIAL_QUOTE_MAX_CHARS)
    }

    return {
      name,
      role,
      location,
      quote,
      imageFiles: emptyLocalizedMediaFiles(),
      imagePreviews: emptyLocalizedMediaPreviews(),
      existingImages: mapLocalizedMediaFromAllLocales(allLocales, ["image_url", "image", "avatar"]),
    }
  }

  const loc = (locale as LocaleKey) in name ? (locale as LocaleKey) : "ar"
  name[loc] = story?.name ?? ""
  role[loc] = story?.role ?? ""
  location[loc] = story?.location ?? ""
  quote[loc] = truncateWithoutSpaces(story?.quote ?? "", TESTIMONIAL_QUOTE_MAX_CHARS)

  const existingImages = emptyLocalizedMediaUrls()
  const sharedImage = story?.image_url ?? story?.image ?? ""
  if (sharedImage) {
    for (const l of LOCALES) existingImages[l] = sharedImage
  }

  return {
    name,
    role,
    location,
    quote,
    imageFiles: emptyLocalizedMediaFiles(),
    imagePreviews: emptyLocalizedMediaPreviews(),
    existingImages,
  }
}
