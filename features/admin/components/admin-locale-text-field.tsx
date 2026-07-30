"use client"

import type {
  Control,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form"
import { Controller } from "react-hook-form"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  countCharsWithoutSpaces,
  truncateWithoutSpaces,
} from "@/lib/quote-limits"

const fieldClassName =
  "mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] transition-colors"

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
  maxCharsWithoutSpaces,
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
  /** When set with `control`, caps non-whitespace characters and shows a counter. */
  maxCharsWithoutSpaces?: number
}) {
  const dir = locale === "ar" ? "rtl" : "ltr"
  const enforceCharLimit =
    typeof maxCharsWithoutSpaces === "number" && maxCharsWithoutSpaces > 0 && Boolean(control)

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
      ) : enforceCharLimit && control ? (
        <Controller
          name={fieldPath}
          control={control}
          render={({ field }) => {
            const value = typeof field.value === "string" ? field.value : ""
            const count = countCharsWithoutSpaces(value)
            const onChange = (next: string) => {
              field.onChange(truncateWithoutSpaces(next, maxCharsWithoutSpaces!))
            }
            return (
              <>
                {multiline ? (
                  <textarea
                    rows={rows}
                    dir={dir}
                    name={field.name}
                    ref={field.ref}
                    value={value}
                    onBlur={field.onBlur}
                    onChange={(e) => onChange(e.target.value)}
                    className={fieldClassName}
                  />
                ) : (
                  <input
                    type="text"
                    dir={dir}
                    name={field.name}
                    ref={field.ref}
                    value={value}
                    onBlur={field.onBlur}
                    onChange={(e) => onChange(e.target.value)}
                    className={fieldClassName}
                  />
                )}
                <p
                  className={`mt-1 text-xs tabular-nums ${
                    count >= maxCharsWithoutSpaces! ? "text-red-500" : "text-[#6B7280]"
                  }`}
                >
                  {count}/{maxCharsWithoutSpaces}
                </p>
              </>
            )
          }}
        />
      ) : multiline ? (
        <textarea
          rows={rows}
          {...register(fieldPath)}
          dir={dir}
          className={fieldClassName}
        />
      ) : (
        <input
          type="text"
          {...register(fieldPath)}
          dir={dir}
          className={fieldClassName}
        />
      )}
    </div>
  )
}
