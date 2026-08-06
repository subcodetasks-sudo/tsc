import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getSession, normalizeRole } from "@/lib/auth-token"
import { getAdminPartners } from "@/lib/api/services/partners.service"
import { AdminPartnersPanel } from "@/features/admin/components/admin-partners-panel"

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  const t = await getTranslations("Admin.partners")

  if (!session.user || normalizeRole(session.user) !== "admin") {
    redirect(`/${locale}/dashboard`)
  }

  let partners: Awaited<ReturnType<typeof getAdminPartners>>["data"] = []
  let loadError: string | null = null

  try {
    const result = await getAdminPartners(session.accessToken!, locale, { per_page: 100 })
    partners = result.data
  } catch (err) {
    console.error(err)
    loadError = t("loadError")
  }

  return (
    <>
      {loadError && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </p>
      )}
      <AdminPartnersPanel partners={partners} />
    </>
  )
}
