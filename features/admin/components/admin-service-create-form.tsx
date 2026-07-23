"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { saveServiceAction } from "@/features/admin/actions/admin-actions"
import { Globe, Save, ArrowLeft, X } from "lucide-react"
import { createServiceFormSchema, type LocaleKey, type ServiceFormValues } from "@/features/admin/lib/service-form-schema"
import { buildServiceFormData, initialServiceFormValues } from "@/features/admin/lib/service-form-utils"
import { AdminLocaleTextField } from "./admin-locale-text-field"
import { AdminImageUploadField } from "./admin-image-upload-field"

export function AdminServiceCreateForm({ locale }: { locale: string }) {
  const t = useTranslations("Admin.services")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  const schema = createServiceFormSchema({
    titleRequired: t("errors.titleRequired"),
    descriptionRequired: t("errors.descriptionRequired"),
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialServiceFormValues(),
  })

  const imagePreview = watch("imagePreview")
  const iconPreview = watch("iconPreview")

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null)
    setSuccess(false)
    const formData = buildServiceFormData(values)

    startTransition(async () => {
      const result = await saveServiceAction(formData, locale)
      if (!result.ok) {
        setSubmitError(result.message ?? t("errors.save"))
        return
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => {
        router.push(`/dashboard/admin/services`)
      }, 1200)
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <X className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Save className="h-4 w-4 shrink-0" />
          <span>{t("messages.saved")}</span>
        </div>
      )}

      {/* Core Service Data */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Globe className="h-4 w-4 text-[#006EA8]" />
          <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">{t("coreServiceData")}</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs font-medium text-[#6B7280]">{t("language")}</label>
          {(["ar", "en", "de"] as const).map((loc) => (
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

        <AdminLocaleTextField<ServiceFormValues>
          key={`title-${editLocale}`}
          label={t("titleLabel")}
          locale={editLocale}
          register={register}
          fieldPath={`title.${editLocale}`}
          required
        />
        {errors.title?.message && <p className="text-xs text-red-500">{errors.title.message}</p>}

        <AdminLocaleTextField<ServiceFormValues>
          key={`description-${editLocale}`}
          label={t("descriptionLabel")}
          locale={editLocale}
          register={register}
          control={control}
          fieldPath={`description.${editLocale}`}
          rich
          required
          rows={4}
        />
        {errors.description?.message && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <AdminImageUploadField
        title={t("serviceImage")}
        imageSrc={imagePreview ?? null}
        hasNewFile={Boolean(imagePreview)}
        aspectRatio="21:9"
        onSelect={(file) => {
          setValue("imageFile", file, { shouldDirty: true })
          setValue("imagePreview", URL.createObjectURL(file), { shouldDirty: true })
        }}
        onRemove={() => {
          setValue("imageFile", null)
          setValue("imagePreview", null)
        }}
        onError={setSubmitError}
      />

      <AdminImageUploadField
        title={t("serviceIcon")}
        imageSrc={iconPreview ?? null}
        hasNewFile={Boolean(iconPreview)}
        shape="circle"
        aspectRatio="1:1"
        onSelect={(file) => {
          setValue("iconFile", file, { shouldDirty: true })
          setValue("iconPreview", URL.createObjectURL(file), { shouldDirty: true })
        }}
        onRemove={() => {
          setValue("iconFile", null)
          setValue("iconPreview", null)
        }}
        onError={setSubmitError}
      />

      {/* Submit / Cancel */}
      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton type="submit" disabled={pending || success} className="h-11 rounded-lg px-8 text-sm">
          <Save className="h-4 w-4 me-2 shrink-0" />
          <span>{pending ? t("actions.saving") : t("actions.create")}</span>
        </PrimaryButton>
        <Link
          locale={locale}
          href="/dashboard/admin/services"
          className="h-11 inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {t("actions.back")}
        </Link>
      </div>
    </form>
  )
}
