import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { getSession } from "@/lib/auth-token"
import { normalizeRole } from "@/lib/auth-token"
import { getAdminFaqs } from "@/lib/api/services/faqs.service"
import { AdminFaqsPanel } from "@/features/admin/components/admin-faqs-panel"
import type { Faq } from "@/lib/api/services/faqs.service"

export default async function AdminFaqsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()

  if (!session.user || normalizeRole(session.user) !== "admin" || !session.accessToken) {
    redirect(`/${locale}/dashboard`)
  }

  const token = session.accessToken

  let faqs: Faq[] = []
  try {
    const result = await getAdminFaqs(token, { per_page: 100 }, locale)
    faqs = result.data
  } catch {
    // ignore
  }

  return <AdminFaqsPanel faqs={faqs} locale={locale} />
}
