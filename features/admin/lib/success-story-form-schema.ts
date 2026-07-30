import { z } from "zod"
import {
  countCharsWithoutSpaces,
  TESTIMONIAL_QUOTE_MAX_CHARS,
} from "@/lib/quote-limits"
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

export type SuccessStoryFormMessages = {
  nameRequired: string
  locationRequired: string
  quoteMaxLength: string
}

function localizedQuoteSchema(message: string) {
  const localeQuote = z.string().refine(
    (value) => countCharsWithoutSpaces(value) <= TESTIMONIAL_QUOTE_MAX_CHARS,
    { message }
  )
  return z.object({
    ar: localeQuote,
    en: localeQuote,
    de: localeQuote,
  })
}

export function createSuccessStoryFormSchema(messages: SuccessStoryFormMessages) {
  return z.object({
    name: localizedTextSchema.refine((value) => Boolean(value.ar.trim() || value.en.trim() || value.de.trim()), {
      message: messages.nameRequired,
    }),
    role: localizedTextSchema,
    location: localizedTextSchema.refine((value) => Boolean(value.ar.trim() || value.en.trim() || value.de.trim()), {
      message: messages.locationRequired,
    }),
    quote: localizedQuoteSchema(messages.quoteMaxLength),
    imageFiles: localizedMediaFilesSchema,
    imagePreviews: localizedMediaPreviewsSchema,
    existingImages: localizedMediaUrlsSchema,
  })
}

export type SuccessStoryFormValues = z.infer<ReturnType<typeof createSuccessStoryFormSchema>>
