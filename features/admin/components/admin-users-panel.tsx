"use client"

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
  | { type: "delete"; user: User }
  | { type: "suspend"; user: User; suspend: boolean }

export function AdminUsersPanel({
  users,
  locale,
  meta,
  stats,
}: {
  users: User[]
  locale: string
  meta?: PaginationMeta
  stats?: { total: number; verified: number; unverified: number }
}) {
  const t = useTranslations("Admin.users")
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

  const sortedUsers = [...users].sort((a, b) => {
    const idA = Number(a.id) || 0
    const idB = Number(b.id) || 0
    if (idB !== idA) return idB - idA
    const dateA = new Date((a as any).createdAt || (a as any).created_at || 0).getTime()
    const dateB = new Date((b as any).createdAt || (b as any).created_at || 0).getTime()
    return dateB - dateA
  })

  const totalUsers = stats?.total ?? meta?.total ?? sortedUsers.length
  const verifiedUsers = stats?.verified ?? sortedUsers.filter((u) => u.emailVerified).length
  const unverifiedUsers = stats?.unverified ?? Math.max(totalUsers - verifiedUsers, 0)

  const columns = [
    { key: "name", label: t("columns.name"), className: "w-[15%] min-w-[140px]" },
    { key: "email", label: t("columns.email"), className: "w-[18%] min-w-[180px]" },
    { key: "phone", label: t("columns.phone"), className: "w-[12%] min-w-[110px]" },
    { key: "country", label: t("columns.country"), className: "w-[10%] min-w-[100px]" },
    { key: "createdAt", label: t("columns.registrationDate"), className: "w-[12%] min-w-[120px]" },
    { key: "verification", label: t("columns.verification"), className: "w-[10%] min-w-[110px]" },
    { key: "actions", label: t("columns.actions"), className: "w-[23%] min-w-[220px]" },
  ]

  function userRouteSource(user: User) {
    return { id: user.id, uuid: user.uuid, email: user.email }
  }

  async function runConfirm() {
    if (!confirmAction || pending) return
    const action = confirmAction
    const { user } = action
    setError(null)
    setPending(true)

    try {
      if (action.type === "delete") {
        const result = await deleteUserAction(userRouteSource(user), locale)
        if (!result.ok) {
          setError(result.message ?? t("error"))
          toast.error(result.message ?? t("error"))
          return
        }
        toast.success(t("deleteSuccess"))
        setConfirmAction(null)
        router.refresh()
        return
      }

      const result = await suspendUserAction(userRouteSource(user), action.suspend, locale)
      if (!result.ok) {
        setError(result.message ?? t("statusUpdateError"))
        toast.error(result.message ?? t("statusUpdateError"))
        return
      }
      toast.success(t("statusUpdateSuccess"))
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
        ? t("suspendConfirm")
        : t("activateConfirm")

  const confirmButtonLabel =
    confirmAction?.type === "delete"
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
        : t("confirm")

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
              {confirmAction?.user.name ? (
                <>
                  <span className="mb-1 block font-medium text-foreground">{confirmAction.user.name}</span>
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
            <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
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
              {confirmButtonLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">{t("stats.total")}</div>
          <div className="text-2xl font-bold text-[#111827]">{totalUsers}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">{t("stats.verified")}</div>
          <div className="text-2xl font-bold text-[#059669]">{verifiedUsers}</div>
          <div className="text-xs text-[#6B7280]">{t("stats.verifiedLabel")}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-medium text-[#6B7280]">{t("stats.unverified")}</div>
          <div className="text-2xl font-bold text-[#D97706]">{unverifiedUsers}</div>
          <div className="text-xs text-[#6B7280]">{t("stats.unverifiedLabel")}</div>
        </div>
      </div>

      {error && !confirmAction && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      <AdminTableShell columns={columns} isEmpty={sortedUsers.length === 0} emptyMessage={t("empty")} isRTL={locale === "ar"}>
        {sortedUsers.map((user, index) => {
          const formattedDate = (() => {
            const dateVal = (user as any).createdAt || (user as any).created_at
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

          const isSuspended = user.status === "suspended" || user.status === "inactive"

          return (
            <AdminTableRow key={user.uuid || user.id} striped={index % 2 === 1}>
              <AdminTableCell className="w-[15%] min-w-[140px]">
                <Link
                  locale={locale}
                  href={`/dashboard/admin/users/${user.uuid || user.id}`}
                  className="block truncate font-medium text-[#006EA8] hover:underline"
                >
                  {user.name}
                </Link>
              </AdminTableCell>
              <AdminTableCell className="w-[18%] min-w-[180px] truncate text-xs">{user.email}</AdminTableCell>
              <AdminTableCell className="w-[12%] min-w-[110px] text-xs">{user.phone || "—"}</AdminTableCell>
              <AdminTableCell className="w-[10%] min-w-[100px] text-xs">{user.country?.name || "—"}</AdminTableCell>
              <AdminTableCell className="w-[12%] min-w-[120px] text-xs">{formattedDate}</AdminTableCell>
              <AdminTableCell className="w-[10%] min-w-[110px]">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold normal-case
",
                    user.emailVerified ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"
                  )}
                >
                  {user.emailVerified ? t("verification.verified") : t("verification.notVerified")}
                </span>
              </AdminTableCell>
              <AdminTableCell className="flex w-[23%] min-w-[220px] flex-nowrap items-center gap-2 whitespace-nowrap">
                <Link
                  locale={locale}
                  href={`/dashboard/admin/users/${user.uuid || user.id}`}
                  className="shrink-0 text-xs font-semibold text-[#006EA8] hover:underline"
                >
                  {t("edit")}
                </Link>
                <span className="shrink-0 text-[#E5E7EB]">|</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null)
                    setConfirmAction({ type: "suspend", user, suspend: !isSuspended })
                  }}
                  className="shrink-0 text-xs font-semibold text-amber-600 hover:underline disabled:opacity-50"
                >
                  {isSuspended ? t("activate") : t("suspend")}
                </button>
                <span className="shrink-0 text-[#E5E7EB]">|</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError(null)
                    setConfirmAction({ type: "delete", user })
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
        summary={t("pagination", { page: currentPage, last: lastPage, total: totalUsers })}
      />
    </div>
  )
}
