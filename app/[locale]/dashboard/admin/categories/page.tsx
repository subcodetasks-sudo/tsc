import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { getSession } from "@/lib/auth-token"
import { normalizeRole } from "@/lib/auth-token"
import { getCategoriesRaw } from "@/lib/api/services/categories.service"
import { AdminCategoriesPanel } from "@/features/admin/components/admin-categories-panel"

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()

  if (!session.isLoggedIn || !session.user || !session.accessToken) {
    redirect(`/${locale}/sign-in`)
  }

  if (normalizeRole(session.user) !== "admin") {
    redirect(`/${locale}/dashboard`)
  }

  // Fetch raw categories for all locales so admin can edit translations
  const [arList, enList, deList] = await Promise.all([
    getCategoriesRaw("ar", session.accessToken),
    getCategoriesRaw("en", session.accessToken),
    getCategoriesRaw("de", session.accessToken),
  ])

  // Build combined categories preserving per-locale raw objects
  const idSet = new Set<string>()
  for (const c of arList) if (c && c.id != null) idSet.add(String(c.id))
  for (const c of enList) if (c && c.id != null) idSet.add(String(c.id))
  for (const c of deList) if (c && c.id != null) idSet.add(String(c.id))

  const categories: any[] = []
  for (const id of Array.from(idSet)) {
    const arCat = arList.find((x: any) => String(x.id) === id) || null
    const enCat = enList.find((x: any) => String(x.id) === id) || null
    const deCat = deList.find((x: any) => String(x.id) === id) || null

    const base = arCat || enCat || deCat || {}

    // Build a name object with per-locale strings so the panel can parse translations
    const nameObj: Record<string, string> = {
      ar: (arCat && (arCat.name ?? arCat.title)) || "",
      en: (enCat && (enCat.name ?? enCat.title)) || "",
      de: (deCat && (deCat.name ?? deCat.title)) || "",
    }

    // Merge sub-categories by index/id if present
    const subsByLocale: Record<string, any[]> = {
      ar: Array.isArray(arCat?.sub_categories) ? arCat.sub_categories : [],
      en: Array.isArray(enCat?.sub_categories) ? enCat.sub_categories : [],
      de: Array.isArray(deCat?.sub_categories) ? deCat.sub_categories : [],
    }

    const subIdSet = new Set<string>()
    for (const loc of ["ar", "en", "de"]) {
      for (const s of subsByLocale[loc]) if (s && s.id != null) subIdSet.add(String(s.id))
    }

    const mergedSubs: any[] = []
    if (subIdSet.size > 0) {
      for (const sid of Array.from(subIdSet)) {
        const sar = subsByLocale.ar.find((s) => String(s.id) === sid) || null
        const sen = subsByLocale.en.find((s) => String(s.id) === sid) || null
        const sde = subsByLocale.de.find((s) => String(s.id) === sid) || null
        mergedSubs.push({
          id: sar?.id ?? sen?.id ?? sde?.id,
          name: { ar: sar?.name ?? sar?.title ?? "", en: sen?.name ?? sen?.title ?? "", de: sde?.name ?? sde?.title ?? "" },
          slug: sar?.slug ?? sen?.slug ?? sde?.slug ?? undefined,
        })
      }
    } else {
      // fallback by index
      const maxLen = Math.max(subsByLocale.ar.length, subsByLocale.en.length, subsByLocale.de.length)
      for (let i = 0; i < maxLen; i++) {
        const sar = subsByLocale.ar[i] || null
        const sen = subsByLocale.en[i] || null
        const sde = subsByLocale.de[i] || null
        mergedSubs.push({
          id: sar?.id ?? sen?.id ?? sde?.id,
          name: { ar: sar?.name ?? sar?.title ?? "", en: sen?.name ?? sen?.title ?? "", de: sde?.name ?? sde?.title ?? "" },
          slug: sar?.slug ?? sen?.slug ?? sde?.slug ?? undefined,
        })
      }
    }

    const combined = {
      id: base.id,
      name: nameObj,
      slug: base.slug ?? "",
      icon: {
        ar: arCat?.icon ?? base.icon ?? null,
        en: enCat?.icon ?? base.icon ?? null,
        de: deCat?.icon ?? base.icon ?? null,
      },
      sub_categories: mergedSubs,
      __allLocales: { ar: arCat, en: enCat, de: deCat },
    }

    categories.push(combined)
  }

  return <AdminCategoriesPanel categories={categories} locale={locale} />
}
