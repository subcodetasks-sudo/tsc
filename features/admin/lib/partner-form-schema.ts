import { z } from "zod"

export const LOCALES = ["ar", "en", "de"] as const
export type LocaleKey = (typeof LOCALES)[number]

const localizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
  de: z.string(),
})

export type LocalizedText = z.infer<typeof localizedTextSchema>

export type PartnerFormMessages = {
  nameRequired: string
}

/** Recommended logo aspect ratio for the homepage partners marquee. */
export const PARTNER_LOGO_ASPECT_RATIO = "3:1"

export function createPartnerFormSchema(messages: PartnerFormMessages) {
  return z.object({
    name: localizedTextSchema.refine(
      (value) => Boolean(value.ar.trim() || value.en.trim() || value.de.trim()),
      { message: messages.nameRequired }
    ),
    website_url: z.string(),
    sort_order: z.string(),
    logoFile: z.custom<File | null | undefined>().optional().nullable(),
    logoPreview: z.string().nullable().optional(),
    existingLogo: z.string().optional(),
  })
}

export type PartnerFormValues = z.infer<ReturnType<typeof createPartnerFormSchema>>
