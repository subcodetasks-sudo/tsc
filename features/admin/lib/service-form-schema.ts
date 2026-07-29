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

const serviceFeatureSchema = z.object({
  id: z.number().optional(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  icon: z.string(),
  iconFile: z.custom<File | null | undefined>().optional(),
  iconPreview: z.string().nullable().optional(),
})

export type ServiceFeatureFormValues = z.infer<typeof serviceFeatureSchema>

export type ServiceFormMessages = {
  titleRequired: string
  descriptionRequired: string
}

function hasRichTextContent(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0
}

export function createServiceFormSchema(messages: ServiceFormMessages) {
  return z.object({
    title: localizedTextSchema.refine(
      (value) => Boolean(value.ar.trim() && value.de.trim()),
      { message: messages.titleRequired }
    ),
    description: localizedTextSchema.refine(
      (value) => hasRichTextContent(value.ar) && hasRichTextContent(value.de),
      { message: messages.descriptionRequired }
    ),
    imageFiles: localizedMediaFilesSchema,
    imagePreviews: localizedMediaPreviewsSchema,
    existingImages: localizedMediaUrlsSchema,
    iconFiles: localizedMediaFilesSchema,
    iconPreviews: localizedMediaPreviewsSchema,
    existingIcons: localizedMediaUrlsSchema,
    features: z.array(serviceFeatureSchema),
  })
}

export type ServiceFormValues = z.infer<ReturnType<typeof createServiceFormSchema>>
