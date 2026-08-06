import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getSession, normalizeRole } from "@/lib/auth-token"
import { AdminPageLayout } from "@/features/admin/components/admin-page-layout"
import { AdminPartnerCreateForm } from "@/features/admin/components/admin-partner-create-form"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function AdminPartnerNewPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Admin.partners")

  const session = await getSession()
  if (!session.isLoggedIn || !session.user || !session.accessToken) {
    redirect(`/${locale}/sign-in`)
  }
  if (normalizeRole(session.user) !== "admin") {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <AdminPageLayout title={t("createTitle")} description={t("hint")}>
      <AdminPartnerCreateForm locale={locale} />
    </AdminPageLayout>
  )
}
