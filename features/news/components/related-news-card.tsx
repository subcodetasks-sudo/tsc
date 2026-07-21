import Image from "next/image"
import parse from "html-react-parser"
import { Link } from "@/i18n/navigation"
import type { News } from "@/lib/api/types"
import { formatNewsDate } from "@/features/news/lib/format-news-date"
import { resolveNewsImageUrl } from "@/features/news/lib/resolve-news-image"
import { NewsCalendarIcon } from "@/features/news/components/news-icons"

type RelatedNewsCardProps = {
  item: News
  locale: string
  imageIndex?: number
}

export function RelatedNewsCard({ item, locale, imageIndex = 0 }: RelatedNewsCardProps) {
  const imageSrc = resolveNewsImageUrl(item.image, imageIndex)
  const remote = imageSrc.startsWith("http")

  return (
    <Link
      locale={locale}
      href={`/news/${item.slug}`}
      className="group flex gap-4 rounded-[16px] transition hover:opacity-95 text-start"
    >
      <div className="relative aspect-[202.5/167] w-[min(48%,202px)] shrink-0 overflow-hidden rounded-[16px] bg-[#E8F2FF]">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="202px"
          unoptimized={remote}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-1">
        <div className="space-y-3">
          <h3 className="line-clamp-2 text-[20px] font-bold leading-[1.16] text-[#171717] group-hover:text-[#006EA8]">
            {item.title}
          </h3>
          <div className="line-clamp-3 text-[14px] leading-[1.5] text-[#525252] [&_p]:mb-0">
            {parse(item.excerpt || "")}
          </div>
        </div>
        <p className="inline-flex items-center gap-2 text-[16px] font-medium leading-[1.16] text-[#525252]">
          <NewsCalendarIcon className="h-6 w-6 shrink-0 text-[#40A0CA]" />
          {formatNewsDate(item.published_at, locale)}
        </p>
      </div>
    </Link>
  )
}
