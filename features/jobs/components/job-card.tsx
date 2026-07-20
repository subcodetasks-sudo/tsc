import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import { MoveUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Job } from "@/lib/api/types"
import {
  getJobTitle,
  getLocalizedName,
  formatJobEmploymentForCard,
  translateEmploymentType,
  getJobCompanyLogo,
  formatJobSalaryRange,
} from "@/features/jobs/lib/job-display"
import { CompanyAvatar } from "@/features/company-profile/components/company-avatar"

const CARD_HOVER_SHADOW =
  "hover:border-[#4BB7E7] hover:bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#006EA8_0%,#005685_100%)] hover:bg-size-[150px_150px,auto] hover:bg-blend-[plus-lighter,normal] hover:text-white hover:shadow-[0_0_0_5px_#FFFFFF,0_0_0_4px_#C2E3FA,0_4px_5px_rgba(75,183,231,0.15),0_10px_13px_rgba(75,183,231,0.22),0_24px_32px_rgba(75,183,231,0.19)]"

export type JobCardLabels = {
  department: string
  postedAgo: string
  salaryPeriod: string
  employmentDefault: string
  companyName: string
  companySubLabel: string
  moreDetails: string
}

type JobCardProps = {
  job: Job
  locale: string
  isRtl: boolean
  labels: JobCardLabels
}

export function JobCard({ job, locale, isRtl, labels }: JobCardProps) {
  const title = getJobTitle(job, locale)
  const employmentLabel =
    translateEmploymentType(job.employment_type || job.job_type, locale) ??
    formatJobEmploymentForCard(job.gender, labels.employmentDefault)
  const companyLogo = getJobCompanyLogo(job)
  const companyName = job.company?.name ?? labels.companyName

  return (
    <Card
      className={cn(
        "group mx-auto w-full flex cursor-pointer overflow-hidden rounded-lg border border-[#78A3BE] bg-white transition-all duration-300",
        CARD_HOVER_SHADOW
      )}
    >
      <CardContent className="h-full grid gap-3 p-4 sm:p-5">
        <Badge className="w-fit rounded-full bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)] px-3 py-1 text-[12px] text-white group-hover:border group-hover:border-white/30 group-hover:bg-white/15">
          {getLocalizedName(job.category?.name, locale) || labels.department}
        </Badge>
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <h3 className="line-clamp-2 min-w-0 text-start text-[18px] font-bold leading-[1.16] text-[#262626] group-hover:text-white sm:text-[20px]">
            {title}
          </h3>
          <p className="shrink-0 text-end text-[14px] font-medium leading-[1.16] text-[#002B46] group-hover:text-white sm:text-[16px]">
            {employmentLabel}
          </p>
        </div>
        <p className="text-start text-[16px] font-medium leading-[1.16] text-[#40A0CA] group-hover:text-[#E8F2FF] flex items-center gap-1">
          <span dir="ltr">{formatJobSalaryRange(job, isRtl)}</span>
          <span>{labels.salaryPeriod}</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#78A3BE] group-hover:border-white/60">
            <CompanyAvatar logo={companyLogo} name={companyName} fill className="size-8" />
          </div>
          <p className="text-start text-[14px] leading-[1.16] text-[#525252] group-hover:text-[#e8f2ff] sm:text-[16px]">
            {companyName}
          </p>
        </div>
        <PrimaryButton asChild className="h-11 rounded-[10px] text-[16px] font-medium sm:text-[18px]">
          <Link locale={locale} href={`/jobs/${job.id}`}>
            {labels.moreDetails}
            <MoveUpRight className="size-5 shrink-0 rtl:-scale-x-100" />
          </Link>
        </PrimaryButton>
      </CardContent>
    </Card>
  )
}
