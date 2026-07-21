import Image from "next/image"
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import parse from "html-react-parser"
import { Link } from "@/i18n/navigation"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import { getNewsForLocale } from "@/features/news/lib/news-fallback"
import { formatNewsDate } from "@/features/news/lib/format-news-date"
import { resolveNewsImageUrl } from "@/features/news/lib/resolve-news-image"
import { NewsCalendarIcon, NewsEyebrowGlobe } from "@/features/news/components/news-icons"
import { NewsReadMoreButton } from "@/features/news/components/news-read-more-button"

export async function NewsPage({ locale: propLocale }: { locale?: string } = {}) {
  const locale = propLocale ?? (await getLocale())
  setRequestLocale(locale)
  const newsT = await getTranslations("Landing.news")
  const pageT = await getTranslations("Landing.newsPage")
  const items = await getNewsForLocale(locale, newsT, { per_page: 12 })

  const featured = items[0]
  const gridItems = items.slice(1)

  return (
    <SectionShell stagger={false} className="bg-white py-12 sm:py-16 lg:py-[71px]">
      <StaggerInView className="space-y-12 lg:space-y-16">
        <StaggerItem>
          <div className="max-w-[643px] space-y-6 text-start">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.25)] px-4 py-2 text-[12px] leading-[1.16] text-[#002B46]">
              <NewsEyebrowGlobe />
              {newsT("eyebrow")}
            </div>
            <h1 className="font-heading text-[28px] font-bold capitalize leading-[1.5] text-[#171717] sm:text-[32px] lg:text-[36px]">
              {newsT("title")}
            </h1>
            <p className="max-w-[500px] text-[14px] leading-[1.16] text-[#525252] sm:text-[16px]">
              {newsT("description")}
            </p>
          </div>
        </StaggerItem>

        {featured ? (
          <StaggerItem>
            <article className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src={resolveNewsImageUrl(featured.image, 0)}
                  alt={featured.title}
                  width={860}
                  height={445}
                  className="h-[min(60vw,445px)] w-full object-cover"
                  unoptimized={resolveNewsImageUrl(featured.image, 0).startsWith("http")}
                />
              </div>

              <div className="flex h-full flex-col justify-between gap-8 py-2">
                <div className="space-y-6">
                  <h2 className="font-heading text-[24px] font-bold leading-[1.2] text-[#171717] sm:text-[28px] lg:text-[32px]">
                    {featured.title}
                  </h2>
                  <div className="text-[16px] leading-[1.35] text-[#525252] sm:text-[18px] lg:text-[20px] [&_p]:mb-0">
                    {parse(featured.excerpt || "")}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <NewsReadMoreButton locale={locale} href={`/news/${featured.slug}`} label={newsT("readMore")} />
                  <p className="inline-flex items-center gap-2 text-[16px] leading-[1.16] text-[#525252]">
                    <NewsCalendarIcon className="h-5 w-5 text-[#40A0CA]" />
                    {formatNewsDate(featured.published_at, locale)}
                  </p>
                </div>
              </div>
            </article>
          </StaggerItem>
        ) : null}

        <StaggerInView className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {gridItems.map((item, index) => (
            <StaggerItem key={item.id}>
              <article className="flex h-full flex-col gap-4">
                <Link locale={locale} href={`/news/${item.slug}`} className="block overflow-hidden rounded-2xl">
                  <Image
                    src={resolveNewsImageUrl(item.image, index + 1)}
                    alt={item.title}
                    width={416}
                    height={223}
                    className="h-[223px] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    unoptimized={resolveNewsImageUrl(item.image, index + 1).startsWith("http")}
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-6 py-2">
                  <div className="space-y-4">
                    <h3 className="font-heading text-[20px] font-bold leading-[1.2] text-[#171717] sm:text-[24px]">
                      <Link locale={locale} href={`/news/${item.slug}`} className="hover:text-[#006EA8]">
                        {item.title}
                      </Link>
                    </h3>
                    <div className="line-clamp-3 text-[14px] leading-[1.35] text-[#525252] sm:text-[16px] [&_p]:mb-0">
                      {parse(item.excerpt || "")}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <NewsReadMoreButton
                      locale={locale}
                      href={`/news/${item.slug}`}
                      label={newsT("readMore")}
                      className="h-11 w-auto min-w-[180px] px-4 text-[14px]"
                    />
                    <p className="inline-flex items-center gap-2 text-[14px] leading-[1.16] text-[#525252] sm:text-[16px]">
                      <NewsCalendarIcon className="h-5 w-5 text-[#40A0CA]" />
                      {formatNewsDate(item.published_at, locale)}
                    </p>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerInView>

        {items.length === 0 ? (
          <StaggerItem>
            <p className="text-center text-[16px] text-[#525252]">{pageT("empty")}</p>
          </StaggerItem>
        ) : null}
      </StaggerInView>
    </SectionShell>
  )
}
