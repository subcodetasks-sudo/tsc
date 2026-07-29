"use client"

import type {
  Control,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form"
import { Controller } from "react-hook-form"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export function AdminLocaleTextField<TFieldValues extends FieldValues>({
  label,
  locale,
  register,
  fieldPath,
  multiline = false,
  rich = false,
  control,
  required = false,
  requiredLocales = ["ar"],
  rows = 3,
}: {
  label: string
  locale: string
  register: UseFormRegister<TFieldValues>
  fieldPath: Path<TFieldValues>
  multiline?: boolean
  rich?: boolean
  control?: Control<TFieldValues>
  required?: boolean
  /** Locales that show the required asterisk when `required` is true. Defaults to Arabic only. */
  requiredLocales?: string[]
  rows?: number
}) {
  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <div className="block text-sm text-[#374151]">
      <span className="mb-1.5 flex items-center gap-1.5 font-medium">
        <span className="rounded bg-[#EAF4FB] px-1.5 py-0.5 text-xs font-bold text-[#006EA8]">
          {locale.toUpperCase()}
        </span>
        <span>{label}</span>
        {required && requiredLocales.includes(locale) && <span className="text-red-500">*</span>}
      </span>
      {rich && control ? (
        <Controller
          name={fieldPath}
          control={control}
          render={({ field }) => (
            <RichTextEditor
              key={`${String(fieldPath)}-${locale}`}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              dir={dir}
              minHeight={rows >= 4 ? "120px" : "96px"}
            />
          )}
        />
      ) : multiline ? (
        <textarea
          rows={rows}
          {...register(fieldPath)}
          dir={dir}
          className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] transition-colors"
        />
      ) : (
        <input
          type="text"
          {...register(fieldPath)}
          dir={dir}
          className="mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] transition-colors"
        />
      )}
    </div>
  )
}
