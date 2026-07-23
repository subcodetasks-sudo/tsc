"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { saveFaqAction } from "@/features/admin/actions/admin-actions"
import { ArrowLeft, Save, X } from "lucide-react"
import { createFaqFormSchema, LOCALES, type LocaleKey, type FaqFormValues } from "@/features/admin/lib/faq-form-schema"
import { buildFaqFormData, initialFaqFormValues } from "@/features/admin/lib/faq-form-utils"
import { AdminLocaleTextField } from "./admin-locale-text-field"

export function AdminFaqCreateForm({ locale }: { locale: string }) {
  const t = useTranslations("Admin.faqs")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  const schema = createFaqFormSchema({
    questionRequired: t("errors.atLeastOneQuestion"),
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialFaqFormValues(),
  })

  const onSubmit = handleSubmit((values) => {
    setError(null)
    const formData = buildFaqFormData(values)

    startTransition(async () => {
      const result = await saveFaqAction(formData, locale)
      if (!result.ok) {
        setError(result.message ?? t("errors.save"))
        return
      }
      router.push(`/dashboard/admin/faqs`)
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
          <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">{t("titles.details")}</p>
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

        <AdminLocaleTextField<FaqFormValues>
          key={`question-${editLocale}`}
          label={t("fields.question")}
          locale={editLocale}
          register={register}
          fieldPath={`question.${editLocale}`}
          required
        />
        {errors.question?.message && <p className="text-xs text-red-500">{errors.question.message}</p>}

        <AdminLocaleTextField<FaqFormValues>
          key={`answer-${editLocale}`}
          label={t("fields.answer")}
          locale={editLocale}
          register={register}
          control={control}
          fieldPath={`answer.${editLocale}`}
          rich
          rows={4}
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton type="submit" disabled={pending} className="h-11 rounded-lg px-8 text-sm">
          <Save className="h-4 w-4 me-2 shrink-0" />
          <span>{pending ? t("actions.saving") : t("actions.create")}</span>
        </PrimaryButton>
        <Link
          locale={locale}
          href="/dashboard/admin/faqs"
          className="h-11 inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {t("actions.back")}
        </Link>
      </div>
    </form>
  )
}
