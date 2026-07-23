import { JobCoverImage } from "@/features/jobs/components/job-cover-image"
import { resolveJobImageUrl } from "@/features/jobs/lib/resolve-job-image"

import { useLocale } from "next-intl"
import { getLocalizedName } from "@/features/jobs/lib/job-display"
import { resolveCompanyLogoForDisplay } from "@/features/company-profile/lib/profile-logo"
import { CompanyAvatar } from "@/features/company-profile/components/company-avatar"
import type { Job } from "@/lib/api/types"

type JobDetailHeroProps = {
  job: Job
  companyName: string
  industryFallback: string
  /** Live logo from /auth/profile — overrides stale job.company.logo */
  companyLogoOverride?: string | null
}

export function JobDetailHero({
  job,
  companyName,
  industryFallback,
  companyLogoOverride,
}: JobDetailHeroProps) {
  const locale = useLocale()
  const industry =
    getLocalizedName(job.company?.company_type?.name || job.category?.name, locale) || industryFallback
  const displayCompany = job.company?.name ?? companyName
  const companyLogo = resolveCompanyLogoForDisplay(job.company, companyLogoOverride, job)
  const resolvedBanner = job.image ? resolveJobImageUrl(job.image) : null
  const bannerSrc = (resolvedBanner && resolvedBanner !== companyLogo)
    ? resolvedBanner
    : "/home/hero/hero-bg-image.png"

  return (
    <div className="bg-white pt-6 sm:pt-8">
      <div className="mx-auto max-w-[1312px] px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Banner cover image */}
          <div className="relative aspect-[21/9] overflow-hidden rounded-[16px] bg-[#E8F2FF]">
            <JobCoverImage
              src={bannerSrc}
              alt=""
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,18,34,0.08)_0%,rgba(0,18,34,0.35)_100%)]" />
          </div>

          {/* Logo overlapping the banner bottom border */}
          <div className="absolute start-6 -bottom-10 z-20 size-[88px] overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_8px_24px_rgba(0,43,70,0.12)] sm:size-[104px] sm:-bottom-12">
            <CompanyAvatar
              logo={companyLogo}
              name={displayCompany}
              fill
              className="size-full"
              imageClassName="size-full"
              fallbackClassName="text-[18px]"
            />
          </div>
        </div>

        {/* Text content below the banner */}
        <div className="mt-11 sm:mt-14 text-start px-2">
          <h1 className="text-[28px] font-bold leading-[1.2] text-[#262626] sm:text-[36px]">
            {displayCompany}
          </h1>
          <p className="mt-1 text-[16px] leading-[1.2] text-[#525252]">{industry}</p>
        </div>
      </div>
    </div>
  )
}
