"use client"

import Image from "next/image"
import parse from "html-react-parser"
import { cn } from "@/lib/utils"
import { Globe, ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"

const CARD_HOVER_SHADOW =
  "hover:border-[#4BB7E7] hover:bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#006EA8_0%,#005685_100%)] hover:bg-[length:150px_150px,auto] hover:bg-blend-[plus-lighter,normal] hover:text-white hover:shadow-[0_0_0_5px_#FFFFFF,0_0_0_4px_#C2E3FA,0_4px_5px_rgba(75,183,231,0.15),0_10px_13px_rgba(75,183,231,0.22),0_24px_32px_rgba(75,183,231,0.19)]"

export function ServiceDetailsClient({
  service,
  locale,
}: {
  service: any
  locale: string
  isAdmin?: boolean
  isFallback?: boolean
}) {
  const isRTL = locale === "ar"

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
            <span>{isRTL ? "العودة للخدمات" : "Back to Services"}</span>
          </Link>
        </div>

        {/* Public Details View */}
        <div className="space-y-16">
          {/* Hero header */}
          <StaggerInView className="flex flex-col gap-6 items-start">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.15)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
                <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
                <span>{isRTL ? "حلول شاملة" : "Comprehensive Solutions"}</span>
              </div>
            </StaggerItem>
            <div className="flex flex-col gap-6">
              <StaggerItem>
                <h1 className="max-w-[850px] font-heading text-[32px] font-bold capitalize leading-[1.3] text-[#171717] sm:text-[40px] lg:text-[46px]">
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

          {/* Features Grid */}
          <div className="space-y-8">
            <div>
              <h2 className="text-[24px] font-bold text-[#171717] sm:text-[28px] lg:text-[32px]">
                {isRTL ? "المزايا المشمولة" : "Included Advantages"}
              </h2>
              <p className="text-[14px] text-[#525252] sm:text-[16px] mt-2">
                {isRTL
                  ? "ما ستحصل عليه عند التسجيل في هذه الخدمة"
                  : "What you receive when registering for this service"}
              </p>
            </div>

            {service.features && service.features.length > 0 ? (
              <StaggerInView className="mt-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {service.features.map((feature: any, fIndex: number) => {
                    const hasCustomIcon =
                      feature.icon &&
                      (feature.icon.startsWith("http") || feature.icon.startsWith("/"))
                    return (
                      <StaggerItem key={feature.id || fIndex} className="h-full">
                        <div
                          className={cn(
                            "group relative flex flex-col h-full justify-between rounded-[20px] border border-[#78A3BE] bg-white p-6 sm:p-8 transition-all duration-300 min-h-[260px] text-start shadow-sm",
                            CARD_HOVER_SHADOW
                          )}
                        >
                          <div className="space-y-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#40A0CA] bg-white transition-colors group-hover:border-white group-hover:bg-white">
                              {hasCustomIcon ? (
                                <Image
                                  src={feature.icon}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-contain"
                                  unoptimized
                                />
                              ) : (
                                <Globe className="h-6 w-6 text-[#40A0CA] transition-colors group-hover:text-[#006EA8]" />
                              )}
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-[20px] font-bold leading-[1.2] text-[#262626] group-hover:text-white">
                                {feature.title}
                              </h3>
                              <div className="text-[14px] font-normal leading-[1.6] text-[#525252] group-hover:text-[#FAFAFA] [&_p+p]:mt-2">
                                {parse(feature.description || "")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    )
                  })}
                </div>
              </StaggerInView>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50 border-[#78A3BE]/40">
                <Globe className="mx-auto h-8 w-8 text-[#78A3BE]" />
                <p className="mt-2 text-sm text-[#9CA3AF]">
                  {isRTL
                    ? "لا توجد مزايا مخصصة لهذه الخدمة حالياً."
                    : "No custom advantages currently assigned to this service."}
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionShell>
    </main>
  )
}
