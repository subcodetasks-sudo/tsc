"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { Tag, X } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { saveCategoryAction } from "@/features/admin/actions/admin-actions"
import type { Category } from "@/lib/api/types"
import { extractMediaUrl, resolveImageUrl } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  LOCALES,
  EDIT_LOCALES,
  createCategoryFormSchema,
  type CategoryFormValues,
  type LocaleKey,
} from "@/features/admin/lib/category-form-schema"
import { mapCategoryToFormDefaults, fillLocaleFallback, slugify } from "@/features/admin/lib/category-form-utils"
import { CategoryLocaleField } from "./category-locale-field"
import { CategoryIconUpload } from "./category-icon-upload"
import { CategorySubCategoriesField } from "./category-sub-categories-field"

export function CategoryFormModal({
  open,
  onOpenChange,
  id,
  initial,
  locale,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  id?: number
  initial?: Category
  locale: string
  onSaved?: () => void
}) {
  const t = useTranslations("Admin.categories")
  const isRtl = locale === "ar"
  const [editLocale, setEditLocale] = useState<LocaleKey>(EDIT_LOCALES[0])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const previewUrlRefs = useRef<Partial<Record<LocaleKey, string>>>({})

  const [iconFiles, setIconFiles] = useState<Partial<Record<LocaleKey, File | null>>>({})
  const [iconPreviews, setIconPreviews] = useState<Partial<Record<LocaleKey, string | null>>>({})

  const allLocales = (initial as { __allLocales?: Record<string, { icon?: unknown }> } | undefined)?.__allLocales
  const initialIcon = (initial as unknown as { icon?: unknown })?.icon
  const initialIconMap =
    initialIcon && typeof initialIcon === "object" && !Array.isArray(initialIcon)
      ? (initialIcon as Record<string, unknown>)
      : null
  const existingIcons: Record<LocaleKey, string> = {
    ar:
      extractMediaUrl(allLocales?.ar?.icon) ||
      (typeof initialIconMap?.ar === "string" ? initialIconMap.ar : null) ||
      extractMediaUrl(initialIcon) ||
      "",
    en:
      extractMediaUrl(allLocales?.en?.icon) ||
      (typeof initialIconMap?.en === "string" ? initialIconMap.en : null) ||
      extractMediaUrl(initialIcon) ||
      "",
    de:
      extractMediaUrl(allLocales?.de?.icon) ||
      (typeof initialIconMap?.de === "string" ? initialIconMap.de : null) ||
      extractMediaUrl(initialIcon) ||
      "",
  }

  const schema = createCategoryFormSchema({ nameRequired: t("errors.nameRequired") })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mapCategoryToFormDefaults(initial),
  })

  useEffect(() => {
    if (!open) return
    reset(mapCategoryToFormDefaults(initial))
    setError(null)
    setEditLocale(EDIT_LOCALES[0])
    for (const url of Object.values(previewUrlRefs.current)) {
      if (url) URL.revokeObjectURL(url)
    }
    previewUrlRefs.current = {}
    setIconFiles({})
    setIconPreviews({})
  }, [open, initial, id, reset])

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlRefs.current)) {
        if (url) URL.revokeObjectURL(url)
      }
    }
  }, [])

  function handleIconChange(file: File) {
    const prev = previewUrlRefs.current[editLocale]
    if (prev) URL.revokeObjectURL(prev)
    const preview = URL.createObjectURL(file)
    previewUrlRefs.current[editLocale] = preview
    setIconFiles((s) => ({ ...s, [editLocale]: file }))
    setIconPreviews((s) => ({ ...s, [editLocale]: preview }))
    setError(null)
  }

  function handleIconRemove() {
    const prev = previewUrlRefs.current[editLocale]
    if (prev) {
      URL.revokeObjectURL(prev)
      delete previewUrlRefs.current[editLocale]
    }
    setIconFiles((s) => ({ ...s, [editLocale]: null }))
    setIconPreviews((s) => ({ ...s, [editLocale]: null }))
  }

  const onSubmit = handleSubmit((values) => {
    setError(null)

    const formData = new FormData()
    if (id) formData.append("id", String(id))

    const filledName = fillLocaleFallback(values.name)
    for (const lang of LOCALES) {
      formData.append(`name[${lang}]`, filledName[lang])
    }

    const slug = slugify(filledName.en || filledName.de || filledName.ar || "")
    if (slug) formData.append("slug", slug)

    for (const lang of LOCALES) {
      const file = iconFiles[lang]
      if (file) {
        formData.append(`icon[${lang}]`, file, file.name || `category-icon-${lang}.png`)
      }
    }

    const subs = values.subCategories.filter((s) => Object.values(s.name).some((v) => v.trim()))
    subs.forEach((sub, subIndex) => {
      if (sub.subCategoryId) formData.append(`sub_categories[${subIndex}][id]`, String(sub.subCategoryId))
      const filledSubName = fillLocaleFallback(sub.name)
      for (const lang of LOCALES) {
        formData.append(`sub_categories[${subIndex}][name][${lang}]`, filledSubName[lang])
      }
    })

    startTransition(async () => {
      const result = await saveCategoryAction(formData, locale, id)
      if (!result.ok) {
        setError(result.message ?? t("errors.save"))
        toast.error(result.message ?? t("errors.save"))
        return
      }
      toast.success(t("savedSuccessfully"))
      handleIconRemove()
      onSaved?.()
      onOpenChange(false)
      router.refresh()
    })
  })

  const resolvedExisting = existingIcons[editLocale] ? resolveImageUrl(existingIcons[editLocale]) : ""
  const iconSrc = iconPreviews[editLocale] || resolvedExisting || null
  const title = id ? t("editCategory") : t("createCategory")

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[min(92vh,840px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-[20px] border-0 bg-white p-0 shadow-[0_32px_64px_-12px_rgba(16,24,40,0.18)] sm:max-w-140",
          isRtl && "rtl"
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="relative overflow-hidden border-b border-[#E8EEF4] bg-linear-to-br from-[#032C44] via-[#006EA8] to-[#41A0CA] px-5 py-5 sm:px-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(232,242,255,0.25), transparent 40%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm">
                {iconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconSrc} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <Tag className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {id ? t("editCategoryEyebrow") : t("createCategoryEyebrow")}
                </p>
                <h2 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h2>
              </div>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-50"
              aria-label={t("cancel")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#6B7280]">{t("language")}</span>
              {EDIT_LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setEditLocale(loc)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    editLocale === loc
                      ? "bg-[#006EA8] text-white shadow-sm"
                      : "bg-[#EBF5FB] text-[#006EA8] hover:bg-[#D7ECF8]"
                  )}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>
            )}
            {errors.name && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                {errors.name.message}
              </p>
            )}

            <CategoryLocaleField
              label={t("categoryName")}
              locale={editLocale}
              register={register}
              fieldPath={`name.${editLocale}`}
            />

            <CategoryIconUpload
              locale={editLocale}
              iconSrc={iconSrc}
              hasNewFile={Boolean(iconFiles[editLocale])}
              labels={{
                icon: t("icon"),
                changeIcon: t("changeIcon"),
                uploadIcon: t("uploadIcon"),
                remove: t("remove"),
              }}
              onChange={handleIconChange}
              onRemove={handleIconRemove}
              onError={(message) => {
                setError(message)
                toast.error(message)
              }}
            />

            <CategorySubCategoriesField
              control={control}
              register={register}
              editLocale={editLocale}
              labels={{
                title: t("subCategories"),
                add: t("addSub"),
                empty: t("noSubCategories"),
                subCategory: t("subCategory"),
                newItem: t("newItem"),
                name: t("name"),
                remove: t("remove"),
              }}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#E8EEF4] bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg px-5 text-sm font-semibold text-[#525252] transition-colors hover:bg-white hover:text-[#032C44] disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <PrimaryButton type="submit" disabled={pending} className="h-10 w-full rounded-lg px-6 text-sm sm:w-auto">
              {pending ? t("saving") : t("saveCategory")}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
