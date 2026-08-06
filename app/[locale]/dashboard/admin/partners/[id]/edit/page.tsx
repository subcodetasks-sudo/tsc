import { redirect, notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getSession, normalizeRole } from "@/lib/auth-token"
import { getAdminPartner } from "@/lib/api/services/partners.service"
import { AdminPageLayout } from "@/features/admin/components/admin-page-layout"
import { AdminPartnerEditForm } from "@/features/admin/components/admin-partner-edit-form"

type PageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminPartnerEditPage({ params }: PageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Admin.partners")

  const session = await getSession()
  if (!session.isLoggedIn || !session.user || !session.accessToken) {
    redirect(`/${locale}/sign-in`)
  }
  if (normalizeRole(session.user) !== "admin") {
    redirect(`/${locale}/dashboard`)
  }

  const [arItem, enItem, deItem] = await Promise.all([
    getAdminPartner(id, session.accessToken, "ar"),
    getAdminPartner(id, session.accessToken, "en"),
    getAdminPartner(id, session.accessToken, "de"),
  ])

  if (!arItem && !enItem && !deItem) {
    notFound()
  }

  const base = (locale === "en" ? enItem : locale === "de" ? deItem : arItem) || arItem || enItem || deItem
  const partner = { ...(base as object), __allLocales: { ar: arItem, en: enItem, de: deItem } }

  return (
    <AdminPageLayout
      title={`${t("editTitle")} — ${base?.name ?? ""}`}
      description={`${t("hint")} · ID: ${base?.id}`}
    >
      <AdminPartnerEditForm partner={partner} locale={locale} />
    </AdminPageLayout>
  )
}
