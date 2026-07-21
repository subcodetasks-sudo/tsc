import { notFound } from "next/navigation"
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import parse from "html-react-parser"
import { Link } from "@/i18n/navigation"
import { formatPostedLabel, getJobTitle, getLocalizedStateName } from "@/features/jobs/lib/job-display"
import { getJobDetailForLocale } from "@/features/jobs/lib/jobs-for-locale"
import { JobDetailHero } from "@/features/jobs/components/job-detail-hero"
import { JobDetailSidebar } from "@/features/jobs/components/job-detail-sidebar"
import { JobDetailShare } from "@/features/jobs/components/job-detail-share"
import { getSession } from "@/lib/auth-token"
import { getFavoriteJobs } from "@/lib/api/services/jobs.service"


type JobDetailPageProps = {
  jobId: number
  locale?: string
}

function localizedField(
  value: string | Record<string, string> | undefined,
  locale: string
): string {
  if (!value) return ""
  if (typeof value === "string") return value
  return value[locale] || value.en || value.ar || value.de || ""
}

const sectionBodyClassName =
  "text-[16px] leading-[1.5] text-[#525252] [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ps-6"

function renderSectionBody(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  if (trimmed.includes("<") && trimmed.includes(">")) {
    return <div className={sectionBodyClassName}>{parse(trimmed)}</div>
  }

  return trimmed.split(/\n{2,}/).map((paragraph, index) => (
    <div key={index} className="text-[16px] leading-[1.5] text-[#525252]">
      {paragraph.trim()}
    </div>
  ))
}

export async function JobDetailPage({ jobId, locale: propLocale }: JobDetailPageProps) {
  const locale = propLocale ?? (await getLocale())
  setRequestLocale(locale)
  const isRtl = locale === "ar"
  const t = await getTranslations("Landing.jobsPage")
  const jobsT = await getTranslations("Landing.jobs")

  const detail = await getJobDetailForLocale(locale, jobId, jobsT)
  if (!detail) notFound()

  const { job, related: relatedJobs } = detail

  const session = await getSession().catch(() => null)
  let initialIsFavorite = false
  if (session?.accessToken) {
    try {
      const favorites = await getFavoriteJobs(session.accessToken, locale).catch(() => [])
      initialIsFavorite = favorites.some((fav) => fav.id === jobId)
    } catch {
      // ignore
    }
  }

  const title = getJobTitle(job, locale)
  const description = localizedField(job.description, locale)
  const requirements = localizedField(job.requirements, locale)
  const responsibilities = localizedField(job.responsibilities, locale)
  const location = getLocalizedStateName(job.state || "", locale) || job.city?.name || job.location || ""
  const postedLabel = formatPostedLabel(job, locale, t("postedAgo"))

  return (
    <main className="flex-1 bg-white">
      <JobDetailHero
        job={job}
        companyName={t("companyName")}
        industryFallback={t("companySubLabel")}
      />

      <div className="mx-auto max-w-[1312px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Link
          locale={locale}
          href="/jobs"
          className="mb-8 inline-flex items-center gap-2 text-[16px] font-medium text-[#006EA8] hover:underline"
        >
          <span aria-hidden>{isRtl ? "→" : "←"}</span>
          {jobsT("showAll")}
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,867px)_421px] lg:justify-between lg:gap-10">
          <div className="min-w-0 space-y-8 text-start">
            <header className="flex flex-col gap-6">
              <p className="text-[16px] leading-[1.16] text-[#525252]">
                {t("detail.lookingFor")}
              </p>
              <h1 className="text-[32px] font-bold leading-[1.5] text-[#262626] sm:text-[48px]">
                {title}
              </h1>
              {(location || postedLabel) && (
                <p className="flex flex-wrap items-center gap-2 text-[16px] leading-[1.16] text-[#525252]">
                  {location ? <span>{location}</span> : null}
                  {location && postedLabel ? (
                    <span className="inline-block size-2 rounded-full bg-[#525252]" aria-hidden />
                  ) : null}
                  {postedLabel ? <span>{postedLabel}</span> : null}
                </p>
              )}
            </header>

            {description ? (
              <section className="flex flex-col gap-4 border-b border-transparent pb-4">
                <h2 className="text-[24px] font-semibold leading-[1.16] text-[#262626]">
                  {t("description")}
                </h2>
                <div className="flex flex-col gap-4">{renderSectionBody(description)}</div>
              </section>
            ) : null}

            {responsibilities ? (
              <section className="flex flex-col gap-4">
                <h2 className="text-[24px] font-semibold leading-[1.5] text-[#262626]">
                  {t("responsibilities")}
                </h2>
                <div className="flex flex-col gap-4">
                  {renderSectionBody(responsibilities)}
                </div>
              </section>
            ) : null}

            {requirements ? (
              <section className="flex flex-col gap-4">
                <h2 className="text-[24px] font-semibold leading-[1.16] text-[#262626]">
                  {t("requirements")}
                </h2>
                <div className="flex flex-col gap-4">{renderSectionBody(requirements)}</div>
              </section>
            ) : null}



            <JobDetailShare label={t("detail.shareWith")} className="pt-4" />
          </div>

          <JobDetailSidebar
            job={job}
            locale={locale}
            relatedJobs={relatedJobs}
            labels={{
              monthly: t("detail.monthly"),
              details: t("detail.details"),
              industry: t("detail.industry"),
              employmentType: t("detail.employmentType"),
              vacancy: t("detail.vacancy"),
              gender: t("detail.gender"),
              age: t("detail.age"),
              applicationDeadline: t("detail.applicationDeadline"),
              applyForJob: t("detail.applyForJob"),
              relatedJobs: t("detail.relatedJobs"),
              postedAgo: t("postedAgo"),
              companySubLabel: t("companySubLabel"),
            }}
            initialIsFavorite={initialIsFavorite}
          />
        </div>
      </div>
    </main>
  )
}

