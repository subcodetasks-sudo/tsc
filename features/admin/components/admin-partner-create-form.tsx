"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { savePartnerAction } from "@/features/admin/actions/admin-actions"
import { Building2, Save, ArrowLeft, X } from "lucide-react"
import {
  createPartnerFormSchema,
  LOCALES,
  PARTNER_LOGO_ASPECT_RATIO,
  type LocaleKey,
  type PartnerFormValues,
} from "@/features/admin/lib/partner-form-schema"
import { buildPartnerFormData, initialPartnerFormValues } from "@/features/admin/lib/partner-form-utils"
import { AdminLocaleTextField } from "./admin-locale-text-field"
import { AdminImageUploadField } from "./admin-image-upload-field"

export function AdminPartnerCreateForm({ locale }: { locale: string }) {
  const t = useTranslations("Admin.partners")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  const schema = createPartnerFormSchema({
    nameRequired: t("nameRequired"),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialPartnerFormValues(),
  })

  const logoFile = watch("logoFile")
  const logoPreview = watch("logoPreview")

  const onSubmit = handleSubmit((values) => {
    setError(null)
    const formData = buildPartnerFormData(values)

    startTransition(async () => {
      const result = await savePartnerAction(formData, locale)
      if (!result.ok) {
        setError(result.message ?? t("error"))
        return
      }
      router.push(`/dashboard/admin/partners`)
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

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <Building2 className="h-4 w-4 text-[#006EA8]" />
          <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">
            {t("sections.partnerDetails")}
          </p>
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

        <AdminLocaleTextField<PartnerFormValues>
          key={`name-${editLocale}`}
          label={t("fields.name")}
          locale={editLocale}
          register={register}
          fieldPath={`name.${editLocale}`}
          required
        />
        {errors.name?.message && <p className="text-xs text-red-500">{errors.name.message}</p>}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#374151]">{t("fields.website")}</label>
          <input
            type="url"
            placeholder="https://"
            className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#006EA8] focus:ring-2 focus:ring-[#006EA8]/20"
            {...register("website_url")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#374151]">{t("fields.sortOrder")}</label>
          <input
            type="number"
            min={0}
            className="h-11 w-full max-w-[200px] rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#006EA8] focus:ring-2 focus:ring-[#006EA8]/20"
            {...register("sort_order")}
          />
        </div>
      </div>

      <AdminImageUploadField
        title={t("sections.logo")}
        imageSrc={logoPreview ?? null}
        hasNewFile={Boolean(logoFile)}
        onSelect={(file) => {
          setValue("logoFile", file, { shouldDirty: true })
          setValue("logoPreview", URL.createObjectURL(file), { shouldDirty: true })
        }}
        onRemove={() => {
          setValue("logoFile", null)
          setValue("logoPreview", null)
        }}
        onError={setError}
        shape="rect"
        aspectRatio={PARTNER_LOGO_ASPECT_RATIO}
        acceptAllImages
      />

      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton type="submit" disabled={pending} className="h-11 rounded-lg px-8 text-sm font-semibold">
          <Save className="h-4 w-4 me-2 shrink-0" />
          <span>{pending ? t("actions.saving") : t("actions.create")}</span>
        </PrimaryButton>
        <Link
          locale={locale}
          href="/dashboard/admin/partners"
          className="h-11 inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {t("actions.back")}
        </Link>
      </div>
    </form>
  )
}
