import Image from "next/image"
import parse from "html-react-parser"
import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import { getNewsForLocale } from "@/features/news/lib/news-fallback"
import { formatNewsDate } from "@/features/news/lib/format-news-date"
import { resolveNewsImageUrl } from "@/features/news/lib/resolve-news-image"
import { NewsCalendarIcon, NewsEyebrowGlobe } from "@/features/news/components/news-icons"
import { NewsReadMoreButton } from "@/features/news/components/news-read-more-button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { cn } from "@/lib/utils"

type NewsSectionProps = {
  override?: {
    title?: string
    description?: string
  }
}

export async function NewsSection({ override }: NewsSectionProps) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const t = await getTranslations("Landing.news")
  const items = await getNewsForLocale(locale, t, { per_page: 4 })

  const featured = items[0]
  const sideItems = items.slice(1, 4)
  const title = override?.title ?? t("title")
  const description = override?.description ?? t("description")
  const isRtl = locale?.toString().startsWith("ar")

  if (!featured) return null

  return (
    <SectionShell id="news" stagger={false} className="overflow-x-clip bg-[#E8F2FF] py-12 sm:py-16 lg:py-[82px]">
      <StaggerInView className="flex flex-col gap-6 text-start">
        <StaggerItem>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.25)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#002B46]">
            <NewsEyebrowGlobe />
            {t("eyebrow")}
          </div>
        </StaggerItem>
        <StaggerItem>
          <h2 className="max-w-[866px] font-heading text-[28px] font-bold capitalize leading-[1.5] text-[#171717] sm:text-[32px] lg:text-[36px]">
            {title}
          </h2>
        </StaggerItem>
        <StaggerItem>
          <p className="max-w-[500px] text-[14px] font-normal leading-[1.16] text-[#525252] sm:text-[16px]">
            {description}
          </p>
        </StaggerItem>
      </StaggerInView>

      <StaggerInView className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
        <StaggerItem>
          <article className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={resolveNewsImageUrl(featured.image, 0)}
                alt={featured.title}
                width={1287}
                height={858}
                className="h-[min(72vw,445px)] w-full object-cover"
                unoptimized={resolveNewsImageUrl(featured.image, 0).startsWith("http")}
              />
            </div>
            <div className="space-y-5">
              <h3 className="font-heading text-[24px] font-bold leading-[1.2] text-[#171717] sm:text-[28px] lg:text-[32px]">
                {featured.title}
              </h3>
              <div className="max-w-[620px] text-[16px] leading-[1.35] text-[#525252] sm:text-[18px] lg:text-[20px] [&_p]:mb-0">
                {parse(featured.excerpt || "")}
              </div>
              <NewsReadMoreButton href={`/news/${featured.slug}`} label={t("readMore")} />
            </div>
          </article>
        </StaggerItem>

        <StaggerItem className="flex flex-col gap-6">
          {sideItems.map((item, idx) => {
            const dateLabel = formatNewsDate(
              item.published_at,
              locale,
              t(`items.${["second", "third", "fourth"][idx] ?? "second"}.date`)
            )
            return (
              <Link
                key={item.id}
                locale={locale}
                href={`/news/${item.slug}`}
                className="group block rounded-2xl transition-opacity hover:opacity-95"
              >
                <article
                  className={cn(
                    "grid grid-cols-1 gap-4 items-start",
                    "lg:gap-8",
                    // On large screens use 40% image / remaining for content
                    "lg:grid-cols-[60%_1fr]",
                    isRtl && "lg:grid-cols-[1fr_60%]"
                  )}
                >
               

                  <div className={cn("flex flex-1 flex-col justify-between gap-4 p-2 lg:p-0", isRtl ? "text-right lg:text-right" : "text-left lg:text-left", isRtl ? "order-1 lg:order-2" : "order-2")}>
                    <div className="space-y-2">
                      <h3 className={cn(
                        "font-heading font-bold leading-[1.2] transition-colors group-hover:text-[#006EA8]",
                        "text-[18px] sm:text-[20px] lg:text-[24px]"
                      )}>
                        {item.title}
                      </h3>
                      <div className="line-clamp-3 text-[14px] leading-[1.35] text-[#525252] [&_p]:mb-0">
                        {parse(item.excerpt || "")}
                      </div>
                    </div>
                    <div className="flex items-center justify-start gap-3">
                      <p className={cn("inline-flex items-center gap-2 text-[13px] leading-[1.16] text-[#525252] sm:text-[14px]", isRtl ? "justify-end" : "justify-start")}>
                        <NewsCalendarIcon className="h-5 w-5 text-[#40A0CA]" />
                        {dateLabel}
                      </p>
                    </div>
                  </div>


                     <div className={cn("overflow-hidden rounded-2xl shadow-sm", isRtl ? "order-2 lg:order-1" : "order-1")}>
                    <Image
                      src={resolveNewsImageUrl(item.image, idx + 1)}
                      alt={item.title}
                      width={480}
                      height={320}
                      className="h-[140px] w-full shrink-0 rounded-[14px] object-cover lg:h-[220px] lg:w-full"
                      unoptimized={resolveNewsImageUrl(item.image, idx + 1).startsWith("http")}
                    />
                  </div>
                </article>
              </Link>
            )
          })}
        </StaggerItem>
      </StaggerInView>


    </SectionShell>
  )
}
