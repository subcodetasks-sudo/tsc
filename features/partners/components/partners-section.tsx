import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import type { Partner } from "@/lib/api/types"
import { getPartners } from "@/lib/api/services/partners.service"
import { SectionShell } from "@/features/shared-home"
import { PartnersMarquee } from "./partners-marquee"

export async function PartnersSection() {
  const locale = await getLocale()
  setRequestLocale(locale)
  const t = await getTranslations("Landing.partners")
  const isRtl = typeof locale === "string" && locale.startsWith("ar")

  let partners: Partner[] = []
  try {
    const { data } = await getPartners(locale, { per_page: 50 })
    partners = Array.isArray(data) ? data.filter((p) => p.is_active !== false) : []
  } catch (err) {
    console.error(err)
    partners = []
  }

  if (partners.length === 0) return null

  return (
    <SectionShell stagger={false} className="overflow-x-clip bg-[#f8fbff] pb-14 pt-2 sm:pb-16 sm:pt-4 lg:pb-20">
      <div className="mb-8 space-y-2 text-center sm:mb-10">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-[#006EA8]">{t("eyebrow")}</p>
        <h2 className="font-[family-name:var(--font-encode-sans-narrow)] text-[26px] font-bold leading-tight text-[#0F172A] sm:text-[32px]">
          {t("title")}
        </h2>
        <p className="mx-auto max-w-[520px] text-sm leading-7 text-[#64748B] sm:text-base">
          {t("description")}
        </p>
      </div>
      <PartnersMarquee partners={partners} isRtl={isRtl} />
    </SectionShell>
  )
}
