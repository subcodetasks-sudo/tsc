import { CategoriesSection } from "@/features/categories"
import { HeroSection } from "@/features/hero"
import { JobsSection } from "@/features/jobs"
import { NewsSection } from "@/features/news"
import { ProcessSection } from "@/features/process"
import { PartnersSection } from "@/features/partners"
import { SupportSection } from "@/features/support"
import { TestimonialsSection } from "@/features/testimonials"
import { getHomePageContent } from "@/lib/api/services/home-page.service"
import { resolveImageUrl } from "@/lib/utils"
import { setRequestLocale } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const homeContent = await getHomePageContent(locale)

  return (
    <main className="flex-1">
      <HeroSection
        title={homeContent.hero.title}
        description={homeContent.hero.description}
        image={homeContent.hero.image ? resolveImageUrl(homeContent.hero.image) : undefined}
      />
      <CategoriesSection override={homeContent.sections.categories} />
      <ProcessSection
        steps={homeContent.processSteps}
        title={homeContent.process.title}
        description={homeContent.process.description}
      />
      <JobsSection override={homeContent.sections.jobs} />
      <TestimonialsSection override={homeContent.sections.testimonials} />
      <NewsSection override={homeContent.sections.news} />
      <SupportSection override={homeContent.sections.footer} />
      <PartnersSection />
    </main>
  )
}
