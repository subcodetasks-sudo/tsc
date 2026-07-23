"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { saveNewsAction } from "@/features/admin/actions/admin-actions"
import { Newspaper, Save, ArrowLeft, X } from "lucide-react"
import { createNewsFormSchema, LOCALES, type LocaleKey, type NewsFormValues } from "@/features/admin/lib/news-form-schema"
import { buildNewsFormData, initialNewsFormValues } from "@/features/admin/lib/news-form-utils"
import { AdminLocaleTextField } from "./admin-locale-text-field"
import { AdminImageUploadField } from "./admin-image-upload-field"

export function AdminNewsCreateForm({ locale }: { locale: string }) {
  const t = useTranslations("Admin.news")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  const schema = createNewsFormSchema({
    titleRequired: t("errors.titleRequired"),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialNewsFormValues(),
  })

  const imagePreview = watch("imagePreview")

  const onSubmit = handleSubmit((values) => {
    setError(null)
    const formData = buildNewsFormData(values)

    startTransition(async () => {
      const result = await saveNewsAction(formData, locale)
      if (!result.ok) {
        setError(result.message ?? t("errors.save"))
        return
      }
      router.push(`/dashboard/admin/news`)
      router.refresh()
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <X className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title & Description */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Newspaper className="h-4 w-4 text-[#006EA8]" />
          <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">{t("titles.content")}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#6B7280]">{t("labels.language")}</label>
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setEditLocale(loc)}
              className={`px-3 py-1.5 text-xs font-semibold rounded ${editLocale === loc ? "bg-[#006EA8] text-white" : "bg-[#EBF5FB] text-[#006EA8]"}`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
        <AdminLocaleTextField<NewsFormValues>
          key={`title-${editLocale}`}
          label={t("fields.title")}
          locale={editLocale}
          register={register}
          fieldPath={`title.${editLocale}`}
          required
        />
        {errors.title?.message && <p className="text-xs text-red-500">{errors.title.message}</p>}

        <AdminLocaleTextField<NewsFormValues>
          key={`description-${editLocale}`}
          label={t("fields.description")}
          locale={editLocale}
          register={register}
          fieldPath={`description.${editLocale}`}
          multiline
          rows={5}
        />
      </div>

      <AdminImageUploadField
        title={t("fields.image")}
        imageSrc={imagePreview ?? null}
        hasNewFile={Boolean(imagePreview)}
        aspectRatio="3:2"
        onSelect={(file) => {
          setValue("imageFile", file, { shouldDirty: true })
          setValue("imagePreview", URL.createObjectURL(file), { shouldDirty: true })
        }}
        onRemove={() => {
          setValue("imageFile", null)
          setValue("imagePreview", null)
        }}
        onError={setError}
      />

      {/* Buttons */}
      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton type="submit" disabled={pending} className="h-11 rounded-lg px-8 text-sm font-semibold">
          <Save className="h-4 w-4 me-2 shrink-0" />
          <span>{pending ? t("actions.saving") : t("actions.create")}</span>
        </PrimaryButton>
        <Link
          locale={locale}
          href="/dashboard/admin/news"
          className="h-11 inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {t("actions.back")}
        </Link>
      </div>
    </form>
  )
}
