import { LOCALES, type LocaleKey, type LocalizedText, type PartnerFormValues } from "./partner-form-schema"

export function emptyLocalizedText(): LocalizedText {
  return { ar: "", en: "", de: "" }
}

export function initialPartnerFormValues(): PartnerFormValues {
  return {
    name: emptyLocalizedText(),
    website_url: "",
    sort_order: "",
    logoFile: null,
    logoPreview: null,
    existingLogo: "",
  }
}

export function buildPartnerFormData(values: PartnerFormValues, id?: number): FormData {
  const formData = new FormData()
  if (id) formData.append("id", String(id))

  for (const lang of LOCALES) {
    const name = values.name[lang]?.trim()
    if (name) formData.append(`name[${lang}]`, name)
  }

  const website = values.website_url?.trim()
  if (website) formData.append("website_url", website)

  const sortOrder = values.sort_order?.trim()
  if (sortOrder) formData.append("sort_order", sortOrder)

  if (values.logoFile instanceof File) {
    formData.append("logo", values.logoFile, values.logoFile.name || "logo")
  }

  return formData
}

/**
 * Builds RHF default values from a partner record fetched for editing.
 * Edit page stitches ar/en/de under `__allLocales`.
 */
export function mapPartnerToFormDefaults(partner: any, locale: string): PartnerFormValues {
  const name = emptyLocalizedText()
  const allLocales = partner?.__allLocales as Record<string, any> | undefined

  if (allLocales) {
    for (const loc of LOCALES) {
      const item = allLocales[loc] ?? {}
      name[loc] = item.name ?? ""
    }
  } else {
    const loc = (locale as LocaleKey) in name ? (locale as LocaleKey) : "ar"
    name[loc] = partner?.name ?? ""
  }

  const existingLogo =
    partner?.logo_url ??
    partner?.logo ??
    allLocales?.ar?.logo_url ??
    allLocales?.ar?.logo ??
    ""

  return {
    name,
    website_url: partner?.website_url ?? "",
    sort_order:
      typeof partner?.sort_order === "number" ? String(partner.sort_order) : partner?.sort_order ?? "",
    logoFile: null,
    logoPreview: null,
    existingLogo: typeof existingLogo === "string" ? existingLogo : "",
  }
}
