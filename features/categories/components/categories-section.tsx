import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { getLocale } from "next-intl/server"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import { getCategories } from "@/lib/api/services/categories.service"
import { getPublicJobs } from "@/lib/api/services/jobs.service"
import { Link } from "@/i18n/navigation"
import { CategoryIconFor } from "@/features/categories/components/category-icons"
import { cn, resolveImageUrl } from "@/lib/utils"
import { MoveUpRight } from "lucide-react"
import Image from "next/image"

const CARD_HOVER_SHADOW =
  "hover:border-[#4BB7E7] hover:bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#006EA8_0%,#005685_100%)] hover:bg-size-[150px_150px,auto] hover:bg-blend-[plus-lighter,normal] hover:text-white hover:shadow-[0_0_0_5px_#FFFFFF,0_0_0_4px_#C2E3FA,0_4px_5px_rgba(75,183,231,0.15),0_10px_13px_rgba(75,183,231,0.22),0_24px_32px_rgba(75,183,231,0.19)]"

function formatMetricCount(total: number): string {
  const withUnit = (value: number, unit: string) => {
    const rounded = Math.floor(value * 10) / 10
    const trimmed = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
    return `${trimmed}${unit}+`
  }

  if (total >= 1_000_000) return withUnit(total / 1_000_000, "m")
  if (total >= 1_000) return withUnit(total / 1_000, "k")
  return `${total}+`
}

type CategoriesSectionProps = {
  override?: {
    title?: string
    description?: string
    heroStats?: {
      total: string
      unit?: string
    }
  }
}

export async function CategoriesSection({ override }: CategoriesSectionProps) {
  const t = await getTranslations("Landing.categories")
  const locale = await getLocale()
  const categories = await getCategories(locale)
  const title = override?.title ?? t("title")
  const description = override?.description ?? t("description")

  const { meta } = await getPublicJobs({ per_page: 1 }, locale)
  const totalJobs = meta?.total ?? 0
  const metricDisplay = override?.heroStats?.total ?? formatMetricCount(totalJobs)

  return (
    <SectionShell id="categories" stagger={false} className="overflow-hidden bg-white py-12 sm:py-16 lg:py-[82px]">
      <div className="flex flex-col gap-10 lg:gap-16">
        {/* Header section with stagger animation */}
        <StaggerInView 
          className="flex flex-col items-start gap-6 text-start"
          leadDelay={0.55}
          staggerDelay={0.15}
        >
          <StaggerItem>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.25)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
              <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
              {t("eyebrow")}
            </div>
          </StaggerItem>
          <div className="flex flex-col gap-6">
            <StaggerItem>
              <h2 className="max-w-[683px] font-heading text-[28px] font-bold capitalize leading-[1.5] text-[#171717] sm:text-[32px] lg:text-[36px]">
                {title}
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="max-w-[1312px] text-[14px] font-normal leading-[1.16] text-[#525252] sm:text-[16px]">
                {description}
              </p>
            </StaggerItem>
          </div>
        </StaggerInView>

        {/* Cards grid with stagger animation - slightly delayed after header */}
        <StaggerInView 
          className="overflow-hidden"
          leadDelay={0.75}
          staggerDelay={0.08}
        >
          <div className="grid grid-cols-1 gap-6 overflow-hidden sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {/** Show up to 8 categories; hide the 8th on large screens so desktop displays 7 + stats = 8 visible cards */}
            {categories.slice(0, 8).map((cat, idx) => {
              const slug = cat.slug || String(cat.id)
              const extraClass = idx === 7 ? "lg:hidden" : ""
              return (
                <StaggerItem key={slug} className={cn("overflow-hidden p-1 flex flex-col", extraClass)}>
                  <Link locale={locale} href={`/jobs?category=${cat.id}`} className="block h-full">
                    <Card
                      className={cn(
                        "group relative h-full min-h-[140px] cursor-pointer overflow-hidden rounded-lg border border-[#d4d4d4] bg-white transition-all duration-300",
                        CARD_HOVER_SHADOW
                      )}
                    >
                      <CardContent className="flex h-full min-h-[140px] flex-col items-start gap-2 overflow-hidden px-5 py-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#40A0CA] bg-white transition-colors group-hover:border-white group-hover:bg-white">
                          {cat.icon && resolveImageUrl(cat.icon) ? (
                            <Image
                              src={resolveImageUrl(cat.icon)}
                              alt={cat.name || ""}
                              width={48}
                              height={48}
                              className="h-10 w-10 object-contain"
                              unoptimized
                            />
                          ) : (
                            <CategoryIconFor
                              categoryKey={slug}
                              className="h-6 w-6 text-[#40A0CA] transition-colors group-hover:text-[#2D7494]"
                            />
                          )}
                        </div>
                        <div className="space-y-1 text-start">
                          <p className="text-[20px] font-bold leading-[1.16] text-[#262626] transition-colors group-hover:text-white">
                            {cat.name || t(`items.${slug}.label`)}
                          </p>
                          <p className="text-[12px] font-medium leading-[1.16] text-[#525252] transition-colors group-hover:text-[#FAFAFA]">
                            {(() => {
                              try {
                                return cat.jobs_count != null ? `${cat.jobs_count} ${t("vacancies")}` : t(`items.${slug}.vacancy`)
                              } catch {
                                return cat.jobs_count != null ? `${cat.jobs_count} ${t("vacancies")}` : t("vacancy")
                              }
                            })()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </StaggerItem>
              )
            })}

            <StaggerItem className="overflow-hidden p-1 sm:col-span-2 lg:col-span-1 flex flex-col">
              <Card className="h-full min-h-[140px] overflow-hidden rounded-lg border border-[#4BB7E7] bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#398DB3_0%,#2D7494_100%)] bg-size-[150px_150px,auto] bg-blend-[plus-lighter,normal] text-white shadow-[0_0_0_5px_#FFFFFF,0_0_0_4px_#C2E3FA,0_4px_5px_rgba(75,183,231,0.15),0_10px_13px_rgba(75,183,231,0.22),0_24px_32px_rgba(75,183,231,0.19)]">
                <CardContent className="flex h-full min-h-[140px] flex-col justify-between gap-2 overflow-hidden px-5 py-4">
                  <div className="space-y-1 text-start">
                    <p className="text-[36px] font-bold leading-[1.1] sm:text-[44px]">{metricDisplay}</p>
                    <p className="text-[13px] font-normal capitalize leading-[1.3]">{t("metricLabel")}</p>
                  </div>
                  <Link locale={locale} href="/jobs" className="block w-full">
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-between rounded-xl border-white/40 bg-transparent px-3 text-[14px] font-medium text-white shadow-[0_0_0_4px_#E8F2FF,0_0_0_5px_#FFFFFF,inset_0_1px_18px_2px_#E8F2FF,inset_0_1px_4px_2px_#C2DDFF] hover:bg-white/10 hover:text-white"
                    >
                      {t("showMore")}
                      <MoveUpRight className="h-4 w-4 shrink-0 rtl:-scale-x-100" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerInView>
      </div>
    </SectionShell>
  )
}