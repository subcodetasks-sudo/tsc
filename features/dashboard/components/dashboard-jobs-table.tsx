"use client"

import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { CompanyAvatar } from "@/features/company-profile/components/company-avatar"
import { DashboardStatusBadge } from "./dashboard-status-badge"
import { CompanyJobActionsMenu } from "@/features/company-jobs/components/company-job-actions-menu"

export type DashboardJobRow = {
  id: number
  title: string
  column2: string | number
  deadline: string
  status: "approved" | "rejected" | "pending" | "accepted" | "reviewed" | "stopped" | "active" | "closed"
  logo?: string | null
  companyName?: string
  detailsHref: string
  rawStatus?: string
}

type DashboardJobsTableProps = {
  title: string
  rows: DashboardJobRow[]
  col2Label: string
  emptyMessage: string
  detailsLabel: string
  isRTL?: boolean
  locale?: string
  jobTitleLabel?: string
  deadlineLabel?: string
  statusLabel?: string
  actionsLabel?: string
  /** Show company job 3-dot menu (never on user application tables). */
  showCompanyActions?: boolean
}

export function DashboardJobsTable({
  title,
  rows,
  col2Label,
  emptyMessage,
  detailsLabel,
  isRTL,
  locale,
  jobTitleLabel = "Job Title",
  deadlineLabel = "Deadline",
  statusLabel = "Status",
  actionsLabel = "Actions",
  showCompanyActions = false,
}: DashboardJobsTableProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <h2 className={cn("text-xl font-semibold capitalize leading-[150%] text-[#262626]", isRTL && "text-right")}>
        {title}
      </h2>

      <div className="table-scrollbar w-full overflow-x-auto rounded-[8px]">
        {/* Table header */}
        <div
          className={cn(
            "flex min-w-[720px] items-center rounded-t-[8px] text-white",
            isRTL
              ? "bg-gradient-to-r from-[#032C44] to-[#41A0CA]" // RTL: من اليسار إلى اليمين
              : "bg-gradient-to-l from-[#032C44] to-[#41A0CA]" // LTR: من اليمين إلى اليسار
          )}
        >
          <div className={cn("w-[28%] shrink-0 px-2 py-2 text-base font-normal", isRTL && "text-right")}>
            {jobTitleLabel}
          </div>
          <div className="flex flex-1 justify-center px-2 py-2 text-base font-normal">
            {col2Label}
          </div>
          <div className="flex flex-1 justify-center px-2 py-2 text-base font-normal">
            {deadlineLabel}
          </div>
          <div className="flex flex-1 justify-center px-2 py-2 text-base font-normal">
            {statusLabel}
          </div>
          <div className="flex flex-1 px-2 py-2 text-base font-normal justify-center">
            {actionsLabel}
          </div>
        </div>

        {/* Rows */}
        <div className="min-w-[720px] rounded-b-[8px] border border-t-0 border-gray-100">
          {rows.length === 0 ? (
            <p className="bg-white px-4 py-12 text-center text-sm text-gray-500">{emptyMessage}</p>
          ) : (
            rows.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  "flex items-center border-b border-gray-50 last:border-0",
                  index % 2 === 0
                    ? "bg-white"
                    : isRTL
                      ? "bg-gradient-to-r from-[#032C44]/10 to-[#41A0CA]/10"
                      : "bg-gradient-to-l from-[#032C44]/10 to-[#41A0CA]/10"
                )}
              >
                <div className={"flex w-[28%] shrink-0 items-center gap-2 px-2 py-3 text-base font-medium text-[#262626]"}>
                  <CompanyAvatar logo={row.logo} name={row.companyName ?? row.title} size="sm" />
                  <Link href={row.detailsHref} className="truncate hover:text-[#006EA8] hover:underline">
                    {row.title}
                  </Link>
                </div>
                <div className="flex flex-1 justify-center px-2 py-3 text-base text-[#262626]">
                  {row.column2}
                </div>
                <div className="flex flex-1 justify-center px-2 py-3 text-base text-[#262626]">
                  {row.deadline}
                </div>
                <div className="flex flex-1 justify-center px-2 py-3">
                  <DashboardStatusBadge status={row.status} locale={locale} />
                </div>
                <div
                  className={"flex flex-1 px-2 py-3 justify-center items-center gap-2"}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={row.detailsHref}
                    className="inline-flex items-center gap-2 rounded-[8px] bg-gradient-to-b from-[#006EA8] to-[#005685] px-4 py-2 text-xs font-normal text-white shadow-[inset_0_1px_18px_2px_#E8F2FF,inset_0_1px_4px_2px_#C2DDFF] hover:opacity-95"
                  >
                    <Image src="/dashboard/jobs.svg" alt="" width={16} height={16} className="h-4 w-4 brightness-0 invert" />
                    {detailsLabel}
                  </Link>
                  {showCompanyActions ? (
                    <CompanyJobActionsMenu
                      jobId={row.id}
                      locale={locale ?? "de"}
                      status={row.rawStatus ?? row.status}
                    />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
