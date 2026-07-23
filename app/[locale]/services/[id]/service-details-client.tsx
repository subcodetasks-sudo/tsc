"use client"

import Image from "next/image"
import parse from "html-react-parser"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"

export function ServiceDetailsClient({
  service,
  locale,
}: {
  service: any
  locale: string
  isAdmin?: boolean
  isFallback?: boolean
}) {
  const t = useTranslations("Landing.servicesPage")

  return (
    <main className="flex-1 bg-white pb-24 relative overflow-hidden text-start">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <Image src="/contact/noise-bg.png" alt="" fill className="object-cover" />
      </div>

      <SectionShell stagger={false} className="py-12 relative z-10">
        {/* Back Navigation */}
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6 mb-10">
          <Link
            locale={locale}
            href="/services"
            className="inline-flex items-center gap-2 text-[#006EA8] font-semibold hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{t("backToServices")}</span>
          </Link>
        </div>

        {/* Public Details View */}
        <div className="space-y-16">
          {/* Hero header */}
          <StaggerInView className="flex flex-col gap-6 items-start">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.15)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
                <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
                <span>{t("eyebrow")}</span>
              </div>
            </StaggerItem>
            <div className="flex flex-col gap-6">
              <StaggerItem>
                <h1 className="max-w-[850px] font-heading text-[32px] font-bold leading-[1.3] text-[#171717] sm:text-[40px] lg:text-[46px]">
                  {service.title}
                </h1>
              </StaggerItem>
              <StaggerItem>
                <div className="max-w-[900px] text-[16px] font-normal leading-[1.7] text-[#525252] sm:text-[18px] [&_p+p]:mt-3">
                  {parse(service.description || "")}
                </div>
              </StaggerItem>
            </div>

            {service.image && (
              <StaggerItem className="w-full mt-6">
                <div className="relative aspect-[21/9] w-full max-w-5xl rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </StaggerItem>
            )}
          </StaggerInView>
        </div>
      </SectionShell>
    </main>
  )
}
