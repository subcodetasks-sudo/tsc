import { getLocale } from "next-intl/server"
import parse from "html-react-parser"
import { getServices } from "@/lib/api/services/services.service"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Globe, ArrowUpRight, ArrowUpLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default async function ServicesPage() {
  const locale = await getLocale()
  const services = await getServices(locale)
  const isRTL = locale === "ar"

  const heroTitle = isRTL 
    ? "نحن ندير التعقيد، وأنت تدير النجاح" 
    : "We Manage The Complexity, You Manage The Success"
  const heroDescription = isRTL
    ? "من استقطاب النخبة من المواهب إلى تأمين تأشيرات العمل الاحترافية، تم تصميم خدماتنا لسد الفجوة بين المهارات العالمية والصناعة الألمانية."
    : "From sourcing elite talents to securing professional visas our services are designed to bridge the gap between global skills and German industry."

  const defaultServices = [
    {
      id: 1,
      title: isRTL ? "استقطاب المواهب الدولية" : "International Talent Sourcing",
      description: isRTL 
        ? "نربطك بأفضل الكفاءات العالمية المتخصصة في مجالات الرعاية الصحية والتكنولوجيا والهندسة."
        : "Sourcing elite global professionals specialized in healthcare, IT, and engineering sectors.",
      image: undefined as string | undefined,
      features: [] as import("@/lib/api/services/services.service").ServiceFeature[],
    },
    {
      id: 2,
      title: isRTL ? "الاعتراف بالشهادات والمؤهلات" : "Credential Recognition Support",
      description: isRTL
        ? "نساعدك في إنهاء إجراءات تعديل الشهادات (Anerkennung) لمطابقة المعايير الألمانية."
        : "Comprehensive guidance through the Anerkennung process to match German standards.",
      image: undefined as string | undefined,
      features: [] as import("@/lib/api/services/services.service").ServiceFeature[],
    },
    {
      id: 3,
      title: isRTL ? "معاملات التأشيرات والإقامة" : "Visa & Immigration Assistance",
      description: isRTL
        ? "ندعمك في كافة الإجراءات القانونية والمستندات المطلوبة للحصول على تأشيرة العمل السريعة."
        : "Full documentation support and fast-track processing for work visas and residence permits.",
      image: undefined as string | undefined,
      features: [] as import("@/lib/api/services/services.service").ServiceFeature[],
    }
  ]

  const displayServices = services.length > 0 ? services : defaultServices

  const CARD_HOVER_SHADOW =
    "hover:border-[#4BB7E7] hover:bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#006EA8_0%,#005685_100%)] hover:bg-[length:150px_150px,auto] hover:bg-blend-[plus-lighter,normal] hover:text-white hover:shadow-[0_0_0_5px_#FFFFFF,0_0_0_4px_#C2E3FA,0_4px_5px_rgba(75,183,231,0.15),0_10px_13px_rgba(75,183,231,0.22),0_24px_32px_rgba(75,183,231,0.19)]"

  return (
    <main className="flex-1 bg-white pb-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <Image src="/contact/noise-bg.png" alt="" fill className="object-cover" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16">
        <SectionShell stagger={false} className="py-12">
          <StaggerInView className="flex flex-col items-start gap-4 text-start">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.15)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
                <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
                <span>{isRTL ? "حلول شاملة" : "Comprehensive Solutions"}</span>
              </div>
            </StaggerItem>
            <div className="flex flex-col gap-4">
              <StaggerItem>
                <h1 className="max-w-[850px] font-heading text-[32px] font-bold capitalize leading-[1.3] text-[#171717] sm:text-[42px] lg:text-[52px]">
                  {heroTitle}
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="max-w-[800px] text-[16px] font-normal leading-[1.6] text-[#525252] sm:text-[18px]">
                  {heroDescription}
                </p>
              </StaggerItem>
            </div>
          </StaggerInView>
        </SectionShell>
      </section>

      {/* Services Grid Section */}
      <section className="relative mt-8">
        <SectionShell stagger={false} className="py-8">
          <div className="flex flex-col gap-8">


            {/* Cards Grid */}
            <StaggerInView className="mt-4">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {displayServices.map((service, index) => {
                  return (
                    <StaggerItem key={service.id || index} className="h-full">
                      <Link locale={locale} href={`/services/${service.id}`} className="block h-full">
                        <div
                          className={cn(
                            "group relative flex flex-col h-full justify-between rounded-[20px] border border-[#78A3BE] bg-white p-6 sm:p-8 transition-all duration-300 min-h-[280px] text-start shadow-sm hover:scale-[1.02]",
                            CARD_HOVER_SHADOW
                          )}
                        >
                          <div className="space-y-6">
                            {/* Icon / Image circle */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#40A0CA] bg-white transition-colors group-hover:border-white group-hover:bg-white">
                              {service.image ? (
                                <Image
                                  src={service.image}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Globe className="h-6 w-6 text-[#40A0CA] transition-colors group-hover:text-[#006EA8]" />
                              )}
                            </div>

                            {/* Title & Desc */}
                            <div className="space-y-3">
                              <h3 className="text-[22px] font-bold leading-[1.2] text-[#262626] group-hover:text-white">
                                {service.title}
                              </h3>
                              <div className="line-clamp-4 text-[14px] font-normal leading-[1.6] text-[#525252] group-hover:text-[#FAFAFA] [&_p]:mb-0">
                                {parse(service.description || "")}
                              </div>
                            </div>
                          </div>

                          {/* Link action */}
                          <div className="mt-6 flex items-center justify-between border-t border-[#78A3BE]/20 pt-4 group-hover:border-white/20">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#006EA8] group-hover:text-white">
                              {isRTL ? "استكشف التفاصيل" : "Explore Details"}
                            </span>
                            {isRTL ? (
                <ArrowUpLeft className="h-5 w-5 text-[#006EA8] transition-transform duration-300 group-hover:text-white" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-[#006EA8] transition-transform duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
                          </div>
                        </div>
                      </Link>
                    </StaggerItem>
                  )
                })}
              </div>
            </StaggerInView>
          </div>
        </SectionShell>
      </section>
    </main>
  )
}
