import { z } from "zod"
import {
  localizedMediaFilesSchema,
  localizedMediaPreviewsSchema,
  localizedMediaUrlsSchema,
} from "./localized-media"

export const LOCALES = ["ar", "en", "de"] as const
export type LocaleKey = (typeof LOCALES)[number]

const localizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
  de: z.string(),
})

export type LocalizedText = z.infer<typeof localizedTextSchema>

export type NewsFormMessages = {
  titleRequired: string
}

export function createNewsFormSchema(messages: NewsFormMessages) {
  return z.object({
    title: localizedTextSchema.refine((value) => Boolean(value.ar.trim() || value.en.trim() || value.de.trim()), {
      message: messages.titleRequired,
    }),
    description: localizedTextSchema,
    imageFiles: localizedMediaFilesSchema,
    imagePreviews: localizedMediaPreviewsSchema,
    existingImages: localizedMediaUrlsSchema,
  })
}

export type NewsFormValues = z.infer<ReturnType<typeof createNewsFormSchema>>
