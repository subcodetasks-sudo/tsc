"use client"

import { useState, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import type { Partner } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/utils"
import { deletePartnerAction } from "@/features/admin/actions/admin-actions"
import { AdminTableCell, AdminTableRow, AdminTableShell } from "./admin-table-shell"
import { Trash2, AlertTriangle, Pencil } from "lucide-react"
import { AdminPageLayout } from "./admin-page-layout"
import { PrimaryButton } from "@/components/ui/primary-button"

export function AdminPartnersPanel({ partners }: { partners: Partner[] }) {
  const t = useTranslations("Admin.partners")
  const locale = useLocale()
  const isRTL = locale === "ar"
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  function handleDelete(id: number) {
    setError(null)
    startTransition(async () => {
      const result = await deletePartnerAction(id, locale)
      if (!result.ok) {
        setError(result.message ?? t("error"))
      } else {
        setDeleteConfirmId(null)
        router.refresh()
      }
    })
  }

  const columns = [
    { key: "logo", label: t("columns.logo"), className: "w-[18%]" },
    { key: "name", label: t("columns.name"), className: "w-[28%]" },
    { key: "website", label: t("columns.website"), className: "w-[28%]" },
    { key: "sort", label: t("columns.sortOrder"), className: "w-[12%]" },
    { key: "actions", label: t("columns.actions"), className: "w-[14%] text-center" },
  ]

  return (
    <AdminPageLayout
      title={t("title")}
      description={t("description")}
      action={
        <PrimaryButton
          type="button"
          onClick={() => router.push(`/dashboard/admin/partners/new`)}
          className="w-auto h-10 px-5 mx-0 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          <span>{t("add")}</span>
        </PrimaryButton>
      }
    >
      <div className="flex flex-col gap-6">
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[min(90vw,420px)] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isRTL ? "تأكيد الحذف" : "Confirm Deletion"}
                </h3>
              </div>
              <p className="mt-3 text-sm text-gray-500">{t("deleteConfirm")}</p>
              {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(null)
                    setError(null)
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-55 transition-colors"
                >
                  {pending ? (isRTL ? "جاري الحذف..." : "Deleting...") : (isRTL ? "حذف" : "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <AdminTableShell
          columns={columns}
          isEmpty={partners.length === 0}
          emptyMessage={t("empty")}
          isRTL={isRTL}
        >
          {partners.map((partner, index) => {
            const logoSrc = resolveImageUrl(partner.logo_url ?? partner.logo)
            return (
              <AdminTableRow
                key={partner.id}
                striped={index % 2 === 1}
                onClick={() => router.push(`/dashboard/admin/partners/${partner.id}/edit`)}
              >
                <AdminTableCell className="w-[18%]">
                  {logoSrc ? (
                    <Image
                      src={logoSrc}
                      alt=""
                      width={120}
                      height={40}
                      className="h-10 w-[120px] rounded-md object-contain border border-gray-150 bg-white p-1"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell className="w-[28%] font-semibold text-[#111827]">
                  {partner.name}
                </AdminTableCell>
                <AdminTableCell className="w-[28%] truncate text-sm text-gray-600">
                  {partner.website_url || "—"}
                </AdminTableCell>
                <AdminTableCell className="w-[12%] text-sm text-gray-500">
                  {partner.sort_order ?? "—"}
                </AdminTableCell>
                <AdminTableCell className="w-[14%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/admin/partners/${partner.id}/edit`)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF4FB] text-[#006EA8] hover:bg-[#006EA8] hover:text-white transition-colors"
                      title={isRTL ? "تعديل" : "Edit"}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmId(partner.id)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            )
          })}
        </AdminTableShell>
      </div>
    </AdminPageLayout>
  )
}
