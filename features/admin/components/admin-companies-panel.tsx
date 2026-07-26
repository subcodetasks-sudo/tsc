"use client"

import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useState } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import type { PaginationMeta, User } from "@/lib/api/types"
import { deleteUserAction, suspendUserAction } from "@/features/admin/actions/admin-actions"
import { AdminTableCell, AdminTableRow, AdminTableShell } from "./admin-table-shell"
import { AdminPagination } from "./admin-pagination"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmAction =
  | { type: "delete"; company: User }
  | { type: "suspend"; company: User; suspend: boolean }

export function AdminCompaniesPanel({
  companies,
  locale,
  meta,
  stats,
}: {
  companies: User[]
  locale: string
  meta?: PaginationMeta
  stats?: { total: number; verified: number; unverified: number }
}) {
  const t = useTranslations("Admin.companies")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const isAr = locale === "ar"
  const isDe = locale === "de"

  const currentPage = meta?.current_page ?? 1
  const lastPage = Math.max(meta?.last_page ?? 1, 1)

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  const sortedCompanies = [...companies].sort((a, b) => {
    const idA = Number(a.id) || 0
    const idB = Number(b.id) || 0
    if (idB !== idA) return idB - idA
    const dateA = new Date((a as any).createdAt || 0).getTime()
    const dateB = new Date((b as any).createdAt || 0).getTime()
    return dateB - dateA
  })

  const totalCompanies = stats?.total ?? meta?.total ?? sortedCompanies.length
  const verifiedCompanies = stats?.verified ?? sortedCompanies.filter((c) => c.emailVerified).length
  const unverifiedCompanies = stats?.unverified ?? Math.max(totalCompanies - verifiedCompanies, 0)

  const columns = [
    { key: "name", label: t("columns.name"), className: "w-[18%] min-w-[160px]" },
    { key: "email", label: t("columns.email"), className: "w-[18%] min-w-[180px]" },
    { key: "phone", label: t("columns.phone"), className: "w-[12%] min-w-[110px]" },
    { key: "country", label: t("columns.country"), className: "w-[10%] min-w-[100px]" },
    { key: "createdAt", label: isAr ? "تاريخ التسجيل" : "Registration Date", className: "w-[12%] min-w-[120px]" },
    { key: "verification", label: isAr ? "التحقق" : "Verification", className: "w-[10%] min-w-[110px]" },
    { key: "actions", label: t("columns.actions"), className: "w-[20%] min-w-[220px]" },
  ]

  function companyRouteSource(company: User) {
    return { id: company.id, uuid: company.uuid, email: company.email }
  }

  async function runConfirm() {
    if (!confirmAction || pending) return
    const action = confirmAction
    const { company } = action
    setError(null)
    setPending(true)

    try {
      if (action.type === "delete") {
        const result = await deleteUserAction(companyRouteSource(company), locale)
        if (!result.ok) {
          setError(result.message ?? t("error"))
          toast.error(result.message ?? t("error"))
          return
        }
        toast.success(isAr ? "تم حذف الشركة" : isDe ? "Unternehmen gelöscht" : "Company deleted")
        setConfirmAction(null)
        router.refresh()
        return
      }

      const result = await suspendUserAction(companyRouteSource(company), action.suspend, locale)
      if (!result.ok) {
        const msg =
          result.message ??
          (isAr ? "فشل تغيير حالة الشركة" : isDe ? "Status konnte nicht geändert werden" : "Failed to change company status")
        setError(msg)
        toast.error(msg)
        return
      }
      toast.success(isAr ? "تم تحديث حالة الشركة" : isDe ? "Status aktualisiert" : "Company status updated")
      setConfirmAction(null)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const confirmTitle =
    confirmAction?.type === "delete"
      ? isAr
        ? "تأكيد الحذف"
        : isDe
          ? "Löschen bestätigen"
          : "Confirm deletion"
      : confirmAction?.suspend
        ? isAr
          ? "تأكيد التعليق"
          : isDe
            ? "Sperrung bestätigen"
            : "Confirm suspend"
        : isAr
          ? "تأكيد التفعيل"
          : isDe
            ? "Aktivierung bestätigen"
            : "Confirm activation"

  const confirmBody =
    confirmAction?.type === "delete"
      ? t("deleteConfirm")
      : confirmAction?.suspend
        ? isAr
          ? "هل تريد تعليق حساب هذه الشركة؟"
          : isDe
            ? "Möchten Sie dieses Unternehmenskonto sperren?"
            : "Do you want to suspend this company account?"
        : isAr
          ? "هل تريد تفعيل حساب هذه الشركة؟"
          : isDe
            ? "Möchten Sie dieses Unternehmenskonto aktivieren?"
            : "Do you want to activate this company account?"

  const companyLabel =
    confirmAction?.company.companyProfile?.companyName || confirmAction?.company.name || ""

  return (
    <div className="flex flex-col gap-6 text-start">
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmAction(null)
            setError(null)
          }
        }}
      >
        <AlertDialogContent className="max-w-[420px] sm:max-w-[420px]">
          <AlertDialogHeader className="sm:place-items-start sm:text-start">
            <AlertDialogMedia
              className={cn(
                confirmAction?.type === "delete"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {confirmAction?.type === "delete" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {companyLabel ? (
                <>
                  <span className="mb-1 block font-medium text-foreground">{companyLabel}</span>
                  {confirmBody}
                </>
              ) : (
                confirmBody
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}</AlertDialogCancel>
            <Button
              type="button"
              variant={confirmAction?.type === "delete" ? "destructive" : "default"}
              disabled={pending}
              className={cn(
                confirmAction?.type === "delete"
                  ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              )}
              onClick={() => {
                void runConfirm()
              }}
            >
              {confirmAction?.type === "delete"
                ? pending
                  ? isAr
                    ? "جاري الحذف..."
                    : isDe
                      ? "Wird gelöscht..."
                      : "Deleting..."
                  : t("delete")
                : pending
                  ? isAr
                    ? "جاري التحديث..."
                    : isDe
                      ? "Wird aktualisiert..."
                      : "Updating..."
                  : isAr
                    ? "تأكيد"
                    : isDe
                      ? "Bestätigen"
                      : "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">
            {locale === "ar" ? "إجمالي الشركات" : "Total Companies"}
          </div>
          <div className="text-2xl font-bold text-[#111827]">{totalCompanies}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">
            {locale === "ar" ? "الحسابات المؤكدة" : "Verified Accounts"}
          </div>
          <div className="text-2xl font-bold text-[#059669]">{verifiedCompanies}</div>
          <div className="text-xs text-[#6B7280]">{locale === "ar" ? "مؤكد" : "Verified"}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">
            {locale === "ar" ? "الحسابات غير المؤكدة" : "Unverified Accounts"}
          </div>
          <div className="text-2xl font-bold text-[#D97706]">{unverifiedCompanies}</div>
          <div className="text-xs text-[#6B7280]">{locale === "ar" ? "غير مؤكد" : "Not Verified"}</div>
        </div>
      </div>

      {error && !confirmAction && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      <AdminTableShell
        columns={columns}
        isEmpty={sortedCompanies.length === 0}
        emptyMessage={t("empty")}
        isRTL={locale === "ar"}
      >
        {sortedCompanies.map((company, index) => {
          const companyProfile = company.companyProfile || {}
          const formattedDate = (() => {
            const dateVal = (company as any).createdAt || (company as any).created_at
            if (!dateVal) return "—"
            try {
              return new Date(dateVal).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            } catch {
              return "—"
            }
          })()

          const isSuspended = company.status === "suspended" || company.status === "inactive"

          return (
            <AdminTableRow key={company.uuid || company.id} striped={index % 2 === 1}>
              <AdminTableCell className="w-[18%] min-w-[160px]">
                <div className="flex items-center gap-3">
                  {company.avatar ? (
                    <Image
                      src={company.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF5FB] text-sm font-bold text-[#006EA8]">
                      {(companyProfile.companyName || company.name)?.charAt(0) ?? "C"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      locale={locale}
                      href={`/dashboard/admin/companies/${company.uuid || company.id}`}
                      className="block truncate font-medium text-[#006EA8] hover:underline"
                    >
                      {companyProfile.companyName || company.name}
                    </Link>
                    {companyProfile.ceoName && (
                      <div className="truncate text-xs text-[#6B7280]">{companyProfile.ceoName}</div>
                    )}
                  </div>
                </div>
              </AdminTableCell>
              <AdminTableCell className="w-[18%] min-w-[180px] truncate text-xs">{company.email}</AdminTableCell>
              <AdminTableCell className="w-[12%] min-w-[110px] text-xs">{company.phone || "—"}</AdminTableCell>
              <AdminTableCell className="w-[10%] min-w-[100px] text-xs">{company.country?.name || "—"}</AdminTableCell>
              <AdminTableCell className="w-[12%] min-w-[120px] text-xs">{formattedDate}</AdminTableCell>
              <AdminTableCell className="w-[10%] min-w-[110px]">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold normal-case
",
                    company.emailVerified ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"
                  )}
                >
                  {company.emailVerified ? (isAr ? "مؤكد" : "Verified") : isAr ? "غير مؤكد" : "Not Verified"}
                </span>
              </AdminTableCell>
              <AdminTableCell className="flex w-[20%] min-w-[220px] flex-nowrap items-center gap-2 whitespace-nowrap">
                <Link
                  locale={locale}
                  href={`/dashboard/admin/companies/${company.uuid || company.id}`}
                  className="shrink-0 text-xs font-semibold text-[#006EA8] hover:underline"
                >
                  {isAr ? "تعديل" : "Edit"}
                </Link>
                <span className="shrink-0 text-[#E5E7EB]">|</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null)
                    setConfirmAction({ type: "suspend", company, suspend: !isSuspended })
                  }}
                  className="shrink-0 text-xs font-semibold text-amber-600 hover:underline disabled:opacity-50"
                >
                  {isSuspended ? (isAr ? "تفعيل" : "Activate") : isAr ? "تعليق الحساب" : "Suspend"}
                </button>
                <span className="shrink-0 text-[#E5E7EB]">|</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null)
                    setConfirmAction({ type: "delete", company })
                  }}
                  className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  {t("delete")}
                </button>
              </AdminTableCell>
            </AdminTableRow>
          )
        })}
      </AdminTableShell>

      <AdminPagination
        currentPage={currentPage}
        lastPage={lastPage}
        onPageChange={goToPage}
        isAr={isAr}
        summary={t("pagination", {
          page: currentPage,
          last: lastPage,
          total: totalCompanies,
        })}
      />
    </div>
  )
}
