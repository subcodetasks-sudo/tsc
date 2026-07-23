"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter } from "@/i18n/navigation"
import { X } from "lucide-react"
import type { Category, Job } from "@/lib/api/types"
import type { CreateJobPayload } from "@/lib/api/services/company.service"
import { GERMAN_STATES, JOB_GENDERS, JOB_TYPES } from "@/features/company-jobs/lib/constants"
import { buildJobFormData, buildJobFormDataForUpdate } from "@/features/company-jobs/lib/build-job-form-data"
import { CreateJobStepper } from "@/features/company-jobs/components/create-job-stepper"
import { JobImageUpload } from "@/features/company-jobs/components/job-image-upload"
import { useAuth } from "@/hooks/use-auth"
import { getLocalizedStateName } from "@/features/jobs/lib/job-display"
import {
  JobFieldGroup,
  JobUnderlineInput,
  JobUnderlineSelect,
  JobUnderlineDate,
} from "@/features/company-jobs/components/job-underline-field"
import { createAdminJobAction, updateAdminJobAction } from "@/features/admin/actions/admin-actions"
import { EDIT_LOCALES, createJobFormSchema, type JobFormValues, type LocaleKey } from "@/features/company-jobs/lib/job-form-schema"
import { STEP_FIELDS, fillLocaleFallback, initialJobFormValues, jobToFormValues } from "@/features/company-jobs/lib/job-form-utils"
import { PrimaryButton } from "@/components/ui/primary-button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { cn } from "@/lib/utils"

export type AdminCompanyOption = {
  id: number
  name: string
  logo?: string
}

function GradientOutlineButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 min-w-[120px] items-center justify-center rounded-lg border border-[#E8F2FF] bg-white px-4 text-base font-normal shadow-none transition hover:bg-[#F5F9FC]",
        className
      )}
    >
      <span className="bg-gradient-to-b from-[#006EA8] to-[#005685] bg-clip-text text-transparent">
        {children}
      </span>
    </button>
  )
}

export function CreateJobWizard({
  categories,
  locale,
  companies,
  job,
}: {
  categories: Category[]
  locale: string
  /** Presence of this prop switches the wizard into admin mode (company picker + admin submit action). */
  companies?: AdminCompanyOption[]
  /** Presence of this prop switches the wizard into edit mode (prefilled form + update action). */
  job?: Job
}) {
  const isAdminMode = companies !== undefined
  const isEditMode = job !== undefined
  const t = useTranslations("CompanyJobs")
  const tAdmin = useTranslations("Admin.jobs.createJob")
  const tEdit = useTranslations("Admin.jobs.editJob")
  const router = useRouter()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(job?.image ?? null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [fetchedCategories, setFetchedCategories] = useState<Category[] | null>(null)

  // Defaults to the first editable tab that matches the page's own locale;
  // ar isn't an editable tab (see EDIT_LOCALES), so ar-locale pages default to en.
  const [editingLocale, setEditingLocale] = useState<LocaleKey>(
    EDIT_LOCALES.includes(locale as LocaleKey) ? (locale as LocaleKey) : EDIT_LOCALES[0]
  )

  const isRtl = locale === "ar"

  const allCategories = editingLocale === locale ? categories : (fetchedCategories ?? categories)

  useEffect(() => {
    if (editingLocale === locale) return

    let cancelled = false
    fetch(`/api/categories?locale=${encodeURIComponent(editingLocale)}`)
      .then((res) => res.json())
      .then((payload: { data?: Category[] }) => {
        if (cancelled || !Array.isArray(payload.data) || payload.data.length === 0) return
        setFetchedCategories(payload.data)
      })
      .catch((err) => {
        console.warn(err)
      })

    return () => {
      cancelled = true
    }
  }, [editingLocale, locale])

  const schema = useMemo(
    () =>
      createJobFormSchema(
        {
          title: t("errors.title"),
          category: t("errors.category"),
          state: t("errors.state"),
          vacancy: t("errors.vacancy"),
          gender: t("errors.gender"),
          employmentType: t("errors.employmentType"),
          deadline: t("errors.deadline"),
          salary: t("errors.salary"),
          salaryRange: t("errors.salaryRange"),
          age: t("errors.age"),
          ageRange: t("errors.ageRange"),
          description: t("errors.description"),
          responsibilities: t("errors.responsibilities"),
          requirements: t("errors.requirements"),
          company: isAdminMode ? tAdmin("errors.company") : undefined,
        },
        { requireCompany: isAdminMode }
      ),
    [t, tAdmin, isAdminMode]
  )

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: job ? jobToFormValues(job) : initialJobFormValues,
  })

  const [watchedCategoryId, setWatchedCategoryId] = useState(
    job?.category?.id != null ? String(job.category.id) : initialJobFormValues.category_id
  )

  const selectedCategory = useMemo(
    () => allCategories.find((c) => String(c.id) === watchedCategoryId),
    [allCategories, watchedCategoryId]
  )

  const subCategories = selectedCategory?.sub_categories ?? []

  const setImage = (file: File | null, preview: string | null) => {
    if (imagePreview && imagePreview !== preview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(file)
    setImagePreview(preview)
    setImageError(null)
  }

  const companyOptions = (companies ?? []).map((c) => ({ value: String(c.id), label: c.name }))

  const categoryOptions = allCategories
    .filter((c) => c.name?.trim())
    .map((c) => ({ value: String(c.id), label: c.name }))

  const genderOptions = JOB_GENDERS.map((g) => ({ value: g, label: t(`gender.${g}`) }))

  const jobTypeOptions = JOB_TYPES.map((jt) => ({ value: jt, label: t(`jobType.${jt}`) }))

  const stateOptions = GERMAN_STATES.map((s) => ({
    value: s,
    label: getLocalizedStateName(s, editingLocale),
  }))

  const buildCommonPayload = (values: JobFormValues): Omit<CreateJobPayload, "image"> => {
    let company: CreateJobPayload["company"]
    if (isAdminMode) {
      const found = companies?.find((c) => String(c.id) === values.companyId)
      company = found ? { id: found.id, name: found.name, logo: found.logo } : undefined
    } else {
      // The auth hook already sets user.avatar = companyLogo for company accounts.
      const cp = user?.companyProfile || user?.company_profile || user?.company
      company = user
        ? {
            id: cp?.id ? Number(cp.id) : undefined,
            name: (cp?.companyName || cp?.name || cp?.company_name || user.name) as string | undefined,
            logo: (cp?.logoUrl || cp?.logo || cp?.logo_url || cp?.avatar || user.avatar) as string | undefined,
          }
        : undefined
    }

    return {
      title: fillLocaleFallback(values.title),
      category_id: Number(values.category_id),
      sub_category_id: Number(values.sub_category_id || values.category_id),
      state: values.state,
      vacancy: Number(values.vacancy),
      gender: values.gender as CreateJobPayload["gender"],
      employment_type: values.employment_type as CreateJobPayload["employment_type"],
      application_deadline: values.application_deadline,
      salary_from: Number(values.salary_from),
      salary_to: Number(values.salary_to),
      age_from: Number(values.age_from),
      age_to: Number(values.age_to),
      description: fillLocaleFallback(values.description),
      responsibilities: fillLocaleFallback(values.responsibilities),
      requirements: fillLocaleFallback(values.requirements),
      company,
    }
  }

  const validateExtrasForStep1 = (): boolean => {
    let ok = true
    // Admin (create + edit) doesn't require a banner image; company create still does.
    if (!isAdminMode && !imageFile && !imagePreview) {
      setImageError(t("errors.image"))
      ok = false
    }
    return ok
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    const valid = await trigger(fields, { shouldFocus: true })
    let ok = valid
    if (step === 1 && !validateExtrasForStep1()) ok = false
    if (!ok) return
    if (step < 3) setStep(step + 1)
  }

  const listPath = isAdminMode ? "/dashboard/admin/jobs" : "/dashboard/company/jobs"
  const basePath = isEditMode ? `/dashboard/admin/jobs/${job!.id}` : listPath

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null)
    if (!validateExtrasForStep1()) {
      setStep(1)
      return
    }
    startTransition(async () => {
      try {
        if (isEditMode) {
          const formData = buildJobFormDataForUpdate({
            ...buildCommonPayload(values),
            image: imageFile,
          })
          const result = await updateAdminJobAction(job!.id, formData, locale)
          if (!result.ok) {
            setSubmitError(result.message ?? tEdit("loadError"))
            return
          }
        } else if (isAdminMode) {
          const formData = buildJobFormDataForUpdate({ ...buildCommonPayload(values), image: imageFile })
          const result = await createAdminJobAction(formData, locale)
          if (!result.ok) {
            setSubmitError(result.message ?? tAdmin("loadError"))
            return
          }
        } else {
          const formData = buildJobFormData({ ...buildCommonPayload(values), image: imageFile! })
          const res = await fetch("/api/company/jobs", {
            method: "POST",
            body: formData,
            headers: {
              "x-locale": locale,
              "Accept-Language": locale,
            },
          })
          const result = (await res.json()) as { ok: boolean; message?: string }
          if (!res.ok || !result.ok) {
            setSubmitError(result.message ?? t("loadError"))
            return
          }
        }
        router.push(basePath)
      } catch (err) {
        console.error(err)
        setSubmitError(isEditMode ? tEdit("loadError") : isAdminMode ? tAdmin("loadError") : t("loadError"))
      }
    })
  })

  const stepLabels: [string, string, string] = [t("steps.basic"), t("steps.info"), t("steps.description")]

  const canSubmitStep = categoryOptions.length > 0 && (!isAdminMode || companyOptions.length > 0)

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "relative flex w-full flex-col items-stretch gap-4 rounded-lg bg-white p-4 shadow-[0_32px_64px_-12px_rgba(16,24,40,0.14)] sm:gap-5 sm:p-6",
        pending && "pointer-events-none opacity-80"
      )}
    >
      <div className="flex w-full items-start gap-3">
        <h1
          className={cn(
            "min-w-0 flex-1 bg-clip-text text-[24px] font-bold leading-[1.3] text-transparent sm:text-[32px] py-1 text-center sm:text-start",
            isRtl ? "bg-gradient-to-r" : "bg-gradient-to-l",
            "from-[#032C44] to-[#41A0CA]"
          )}
        >
          {isEditMode ? tEdit("title") : isAdminMode ? tAdmin("title") : t("title")}
        </h1>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <div className="flex gap-1.5">
            {EDIT_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setEditingLocale(l)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  editingLocale === l
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white shadow-sm"
                    : "bg-[#F5F9FC] border border-[#E0E8EF] text-[#006EA8] hover:bg-[#E6F6FF]"
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            locale={locale}
            href={basePath}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#006EA8] transition-opacity hover:opacity-70 bg-white shadow-sm border border-[#E0E8EF]"
            aria-label={t("cancel")}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <CreateJobStepper currentStep={step} labels={stepLabels} isRtl={isRtl} />

      <div className="flex w-full flex-col gap-4">
        {step === 1 && (
          <>
            {isAdminMode && (
              <JobFieldGroup label={tAdmin("fields.company")} required error={errors.companyId?.message}>
                <Controller
                  control={control}
                  name="companyId"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={tAdmin("placeholders.company")}
                      options={companyOptions}
                      disabled={companyOptions.length === 0}
                    />
                  )}
                />
              </JobFieldGroup>
            )}

            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center gap-0.5 text-start">
                <span className="text-base font-medium leading-[150%] text-[#262626]">{t("fields.title")}</span>
                <span className="text-base font-medium leading-[150%] text-[#FF2D55]">*</span>
              </div>

              <Controller
                control={control}
                name={`title.${editingLocale}`}
                render={({ field }) => (
                  <JobUnderlineInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("placeholders.title")}
                  />
                )}
              />
              {errors.title?.en?.message ? (
                <p className="text-sm text-[#FF2D55]" role="alert">
                  {errors.title.en.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <JobFieldGroup label={t("fields.category")} required error={errors.category_id?.message}>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v)
                        setWatchedCategoryId(v)
                        setValue("sub_category_id", "")
                        clearErrors("sub_category_id")
                      }}
                      placeholder={t("placeholders.select")}
                      options={categoryOptions}
                      disabled={categoryOptions.length === 0}
                    />
                  )}
                />
              </JobFieldGroup>

              <JobFieldGroup label={t("fields.subCategory")} error={errors.sub_category_id?.message}>
                <Controller
                  control={control}
                  name="sub_category_id"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v)
                        clearErrors("sub_category_id")
                      }}
                      placeholder={t("placeholders.select")}
                      disabled={!watchedCategoryId || pending}
                      options={
                        subCategories.length > 0
                          ? subCategories.map((s) => ({ value: String(s.id), label: s.name }))
                          : watchedCategoryId
                            ? [{ value: watchedCategoryId, label: t("fields.sameAsCategory") }]
                            : []
                      }
                    />
                  )}
                />
              </JobFieldGroup>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <JobFieldGroup label={t("fields.state")} required error={errors.state?.message}>
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.select")}
                      options={stateOptions}
                    />
                  )}
                />
              </JobFieldGroup>

              <JobFieldGroup label={t("fields.vacancy")} required error={errors.vacancy?.message}>
                <Controller
                  control={control}
                  name="vacancy"
                  render={({ field }) => (
                    <JobUnderlineInput
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="20"
                    />
                  )}
                />
              </JobFieldGroup>
            </div>

            <div className="w-full">
              <JobImageUpload
                file={imageFile}
                previewUrl={imagePreview}
                onChange={setImage}
                label={t("fields.image")}
                hint={t("placeholders.image")}
                removeLabel={t("removeImage")}
                compressingLabel={t("compressing")}
                sizeHintLabel={t("imageSizeHint")}
                tooLargeLabel={t("errors.imageSize")}
                compressFailedLabel={t("errors.imageCompress")}
                aspectRatio="21:9"
                error={imageError ?? undefined}
                className="flex-col"
                required={!isAdminMode}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <JobFieldGroup label={t("fields.gender")} required error={errors.gender?.message}>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.select")}
                      options={genderOptions}
                    />
                  )}
                />
              </JobFieldGroup>

              <JobFieldGroup label={t("fields.employmentType")} required error={errors.employment_type?.message}>
                <Controller
                  control={control}
                  name="employment_type"
                  render={({ field }) => (
                    <JobUnderlineSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.select")}
                      options={jobTypeOptions}
                    />
                  )}
                />
              </JobFieldGroup>
            </div>

            <JobFieldGroup label={t("fields.deadline")} required error={errors.application_deadline?.message}>
              <Controller
                control={control}
                name="application_deadline"
                render={({ field }) => (
                  <JobUnderlineDate
                    value={field.value}
                    onChange={field.onChange}
                    ariaLabel={t("fields.deadline")}
                    openLabel={t("openCalendar")}
                  />
                )}
              />
            </JobFieldGroup>

            <JobFieldGroup label={t("fields.salary")} required error={errors.salary_from?.message ?? errors.salary_to?.message}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="salary_from"
                  render={({ field }) => (
                    <JobUnderlineInput
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.salaryFrom")}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="salary_to"
                  render={({ field }) => (
                    <JobUnderlineInput
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.salaryTo")}
                    />
                  )}
                />
              </div>
            </JobFieldGroup>

            <JobFieldGroup label={t("fields.age")} required error={errors.age_from?.message ?? errors.age_to?.message}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="age_from"
                  render={({ field }) => (
                    <JobUnderlineInput
                      type="number"
                      min={18}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.ageFrom")}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="age_to"
                  render={({ field }) => (
                    <JobUnderlineInput
                      type="number"
                      min={18}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("placeholders.ageTo")}
                    />
                  )}
                />
              </div>
            </JobFieldGroup>
          </>
        )}

        {step === 3 && (
          <>
            <JobFieldGroup label={t("fields.description")} required error={errors.description?.en?.message}>
              <Controller
                control={control}
                name={`description.${editingLocale}`}
                render={({ field }) => (
                  <RichTextEditor
                    key={`description-${editingLocale}`}
                    value={field.value}
                    onChange={field.onChange}
                    dir={editingLocale === "ar" ? "rtl" : "ltr"}
                    minHeight="120px"
                  />
                )}
              />
            </JobFieldGroup>
            <JobFieldGroup label={t("fields.responsibilities")} required error={errors.responsibilities?.en?.message}>
              <Controller
                control={control}
                name={`responsibilities.${editingLocale}`}
                render={({ field }) => (
                  <RichTextEditor
                    key={`responsibilities-${editingLocale}`}
                    value={field.value}
                    onChange={field.onChange}
                    dir={editingLocale === "ar" ? "rtl" : "ltr"}
                    minHeight="120px"
                  />
                )}
              />
            </JobFieldGroup>
            <JobFieldGroup label={t("fields.requirements")} required error={errors.requirements?.en?.message}>
              <Controller
                control={control}
                name={`requirements.${editingLocale}`}
                render={({ field }) => (
                  <RichTextEditor
                    key={`requirements-${editingLocale}`}
                    value={field.value}
                    onChange={field.onChange}
                    dir={editingLocale === "ar" ? "rtl" : "ltr"}
                    minHeight="120px"
                  />
                )}
              />
            </JobFieldGroup>
          </>
        )}

        {categoryOptions.length === 0 ? (
          <p className="text-center text-sm text-[#FF2D55]" role="status">
            {t("errors.categoriesUnavailable")}
          </p>
        ) : null}

        {isAdminMode && companyOptions.length === 0 ? (
          <p className="text-center text-sm text-[#FF2D55]" role="status">
            {tAdmin("errors.companiesUnavailable")}
          </p>
        ) : null}

        {submitError ? (
          <p className="text-center text-sm leading-relaxed text-[#FF2D55]" role="alert">
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
        {step === 1 ? (
          <GradientOutlineButton onClick={() => router.push(basePath)}>{t("cancel")}</GradientOutlineButton>
        ) : (
          <GradientOutlineButton onClick={() => setStep(step - 1)}>{t("back")}</GradientOutlineButton>
        )}

        {step < 3 ? (
          <PrimaryButton
            type="button"
            onClick={handleNext}
            disabled={pending || !canSubmitStep}
            className="h-9 min-w-[120px] w-auto rounded-lg px-4 text-base font-normal"
          >
            {t("next")}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            type="button"
            onClick={onSubmit}
            disabled={pending || !canSubmitStep}
            className="h-9 min-w-[120px] w-auto rounded-lg px-4 text-base font-normal"
          >
            {pending ? t("submitting") : isEditMode ? tEdit("submit") : t("submit")}
          </PrimaryButton>
        )}
      </div>
    </div>
  )
}
