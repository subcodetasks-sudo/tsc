"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import { PrimaryButton } from "@/components/ui/primary-button"
import Image from "next/image"
import { MoveUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category, Job } from "@/lib/api/types"
import { JobCard } from "./job-card"
import {
  formatJobSalary,
  formatJobEmploymentForCard,
  getJobTitle,
  getLocalizedName,
} from "@/features/jobs/lib/job-display"

type JobsSectionClientProps = {
  jobs: Job[]
  categories: Category[]
  title?: string
  description?: string
}

export function JobsSectionClient({ jobs, categories, title, description }: JobsSectionClientProps) {
  const t = useTranslations("Landing.jobs")
  const locale = useLocale()
  const [activeFilter, setActiveFilter] = useState<number | "all">("all")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sectionTitle = title ?? t("title")
  const sectionDescription = description ?? t("description")

  const filters = useMemo(() => {
    const items: { id: number | "all"; label: string }[] = [
      { id: "all", label: t("filters.all") },
    ]
    for (const cat of categories) {
      items.push({ id: cat.id, label: cat.name })
    }
    if (items.length === 1) {
      return [
        { id: "all" as const, label: t("filters.all") },
        { id: -1, label: t("filters.design") },
        { id: -2, label: t("filters.development") },
        { id: -3, label: t("filters.marketing") },
        { id: -4, label: t("filters.medical") },
      ]
    }
    return items
  }, [categories, t])

  const selectedFilter = filters.find((filter) => filter.id === activeFilter)

  const visibleJobs = useMemo(() => {
    if (activeFilter === "all") return jobs.slice(0, 6)

    const selectedLabel = selectedFilter?.label.trim().toLowerCase()

    return jobs
      .filter((job) => {
        const jobCategoryId = job.category?.id
        const jobCategoryName = getLocalizedName(job.category?.name, locale).trim().toLowerCase()

        if (jobCategoryId != null && jobCategoryId === activeFilter) return true
        if (selectedLabel && jobCategoryName === selectedLabel) return true

        return false
      })
      .slice(0, 6)
  }, [activeFilter, jobs, selectedFilter])

  const hasNoResults = activeFilter !== "all" && visibleJobs.length === 0

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleFilterChange = (filterId: number | "all") => {
    if (activeFilter === filterId) return
    setActiveFilter(filterId)
    // Optional visual debounce handled by CSS/animations; no blocking needed
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      // noop: placeholder if animation sync needed in future
    }, 300)
  }

  return (
    <SectionShell id="jobs" stagger={false} className="bg-white py-12 sm:py-16 lg:py-[82px]">
      {/* Header Section - بدون تغيير */}
      <StaggerInView className="mx-auto flex max-w-[1312px] flex-col items-center gap-6 text-center sm:gap-8">
        <StaggerItem>
          <p className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[rgba(64,160,202,0.25)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
            <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="text-[#40A0CA]" />
            {t("eyebrow")}
          </p>
        </StaggerItem>
        <StaggerItem>
          <h2 className="max-w-[520px] font-heading text-balance text-[28px] font-bold normal-case
 leading-[1.5] text-[#171717] sm:text-[32px] lg:text-[36px]">
            {sectionTitle}
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="max-w-[500px] text-[14px] leading-[1.16] font-normal text-[#525252] sm:text-[16px]">
            {sectionDescription}
          </p>
        </StaggerItem>
      </StaggerInView>

      {/* Filters Section - نفس التصميم الأصلي */}
      <StaggerInView className="mx-auto mt-8 flex w-full max-w-[715px] flex-wrap items-center justify-center gap-x-4 gap-y-3">
        {filters.map((filter) => (
          <StaggerItem key={String(filter.id)}>
            <button
              type="button"
              onClick={() => handleFilterChange(filter.id === "all" ? "all" : filter.id)}
              className={cn(
                "min-w-[120px] flex-1 px-2 py-2 text-center text-[14px] uppercase leading-[1.16] transition-colors sm:min-w-[143px] sm:text-[16px]",
                activeFilter === filter.id
                  ? "border-b border-[#002B46] font-semibold bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)] bg-clip-text text-transparent"
                  : "border-b border-[#A3A3A3] font-normal text-[#A3A3A3] hover:text-[#525252]"
              )}
            >
              {filter.label}
            </button>
          </StaggerItem>
        ))}
      </StaggerInView>

      {/* Jobs Grid - مع حل مشكلة الاختفاء */}
      {hasNoResults ? (
        <StaggerInView className="mx-auto mt-10 w-full max-w-[760px] rounded-[18px] border border-dashed border-[#78A3BE] bg-[#F8FBFF] px-6 py-10 text-center">
          <p className="text-[18px] font-semibold text-[#002B46]">
            {locale === "ar" ? "لا توجد وظائف حالياً في هذا التصنيف." : "No jobs currently available in this category."}
          </p>
          <p className="mt-3 text-[14px] leading-[1.6] text-[#525252]">
            {locale === "ar"
              ? "جرّب اختيار تصنيف آخر أو افتح كل الوظائف لرؤية المزيد من الفرص."
              : "Try another category or view all jobs to see more opportunities."}
          </p>
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)] px-6 text-[16px] font-medium text-white"
          >
            {t("filters.all")}
          </button>
        </StaggerInView>
      ) : (
        <StaggerInView
          key={activeFilter} // المفتاح الوحيد الذي يحل المشكلة
          className="mx-auto mt-10 w-full max-w-[1312px]"
        >
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleJobs.map((job) => (
              <StaggerItem key={`${job.id}-${activeFilter}`} className="flex h-full">
                <JobCard
                  job={job}
                  locale={locale}
                  isRtl={locale === "ar"}
                  labels={{
                    department: "—",
                    postedAgo: "",
                    salaryPeriod: t("salaryPeriod") || "/month",
                    employmentDefault: locale === "ar" ? "دوام كامل" : locale === "de" ? "Vollzeit" : "Full-time",
                    companyName: "—",
                    companySubLabel: "",
                    moreDetails: t("moreDetails"),
                  }}
                />
              </StaggerItem>
            ))}
          </div>
        </StaggerInView>
      )}

      {/* Show All Button - بدون تغيير */}
      <StaggerInView className="mt-8 flex justify-center">
        <StaggerItem>
          <PrimaryButton asChild className="h-11 w-auto min-w-[200px] rounded-[10px] px-8 text-[16px] font-medium sm:text-[18px]">
            <Link locale={locale} href="/jobs">{t("showAll")}</Link>
          </PrimaryButton>
        </StaggerItem>
      </StaggerInView>
    </SectionShell>
  )
}