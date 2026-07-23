"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { saveSuccessStoryAction } from "@/features/admin/actions/admin-actions"
import { Quote, Save, ArrowLeft, X } from "lucide-react"
import {
  createSuccessStoryFormSchema,
  LOCALES,
  type LocaleKey,
  type SuccessStoryFormValues,
} from "@/features/admin/lib/success-story-form-schema"
import { buildSuccessStoryFormData, initialSuccessStoryFormValues } from "@/features/admin/lib/success-story-form-utils"
import { AdminLocaleTextField } from "./admin-locale-text-field"
import { AdminImageUploadField } from "./admin-image-upload-field"

export function AdminSuccessStoryCreateForm({ locale }: { locale: string }) {
  const t = useTranslations("Admin.successStories")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  const schema = createSuccessStoryFormSchema({
    nameRequired: t("nameRequired"),
    locationRequired: t("locationRequired"),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SuccessStoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialSuccessStoryFormValues(),
  })

  const imagePreview = watch("imagePreview")

  const onSubmit = handleSubmit((values) => {
    setError(null)
    const formData = buildSuccessStoryFormData(values)

    startTransition(async () => {
      const result = await saveSuccessStoryAction(formData, locale)
      if (!result.ok) {
        setError(result.message ?? t("error"))
        return
      }
      router.push(`/dashboard/admin/success-stories`)
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

      {/* Profile Details */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Quote className="h-4 w-4 text-[#006EA8]" />
          <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">{t("sections.storyAndPerson")}</p>
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

        <AdminLocaleTextField<SuccessStoryFormValues>
          key={`name-${editLocale}`}
          label={t("fields.name")}
          locale={editLocale}
          register={register}
          fieldPath={`name.${editLocale}`}
          required
        />
        {errors.name?.message && <p className="text-xs text-red-500">{errors.name.message}</p>}

        <AdminLocaleTextField<SuccessStoryFormValues>
          key={`role-${editLocale}`}
          label={t("fields.role")}
          locale={editLocale}
          register={register}
          fieldPath={`role.${editLocale}`}
        />

        <AdminLocaleTextField<SuccessStoryFormValues>
          key={`location-${editLocale}`}
          label={t("fields.location")}
          locale={editLocale}
          register={register}
          fieldPath={`location.${editLocale}`}
          required
        />
        {errors.location?.message && <p className="text-xs text-red-500">{errors.location.message}</p>}

        <AdminLocaleTextField<SuccessStoryFormValues>
          key={`quote-${editLocale}`}
          label={t("fields.quote")}
          locale={editLocale}
          register={register}
          fieldPath={`quote.${editLocale}`}
          multiline
          rows={4}
        />
      </div>

      <AdminImageUploadField
        title={t("sections.profilePicture")}
        imageSrc={imagePreview ?? null}
        hasNewFile={Boolean(imagePreview)}
        onSelect={(file) => {
          setValue("imageFile", file, { shouldDirty: true })
          setValue("imagePreview", URL.createObjectURL(file), { shouldDirty: true })
        }}
        onRemove={() => {
          setValue("imageFile", null)
          setValue("imagePreview", null)
        }}
        onError={setError}
        shape="circle"
        aspectRatio="1:1"
      />

      {/* Buttons */}
      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton type="submit" disabled={pending} className="h-11 rounded-lg px-8 text-sm font-semibold">
          <Save className="h-4 w-4 me-2 shrink-0" />
          <span>{pending ? t("actions.saving") : t("actions.create")}</span>
        </PrimaryButton>
        <Link
          locale={locale}
          href="/dashboard/admin/success-stories"
          className="h-11 inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {t("actions.back")}
        </Link>
      </div>
    </form>
  )
}
