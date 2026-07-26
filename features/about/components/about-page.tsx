import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import { ProcessSection } from "@/features/process"
import { SupportSection } from "@/features/support"
import { getAbout } from "@/lib/api/services/about.service"
import { getHomePageContent } from "@/lib/api/services/home-page.service"

import { AboutIntroSection } from "./about-intro-section"
import { AboutStorySection } from "./about-story-section"
import { AboutFeaturesSection } from "./about-features-section"

export async function AboutPage() {
  const locale = await getLocale()
  setRequestLocale(locale)
  const [aboutT, aboutContent, homeContent] = await Promise.all([
    getTranslations("Landing.about"),
    getAbout(locale),
    getHomePageContent(locale),
  ])

  const introTitle = aboutContent?.title || aboutT("intro.title")
  const introDescriptionOne =
    aboutContent?.descriptionLeft || aboutT("intro.descriptionOne")
  const introDescriptionTwo =
    aboutContent?.descriptionRight || aboutT("intro.descriptionTwo")

  const storyEyebrow = aboutT("story.eyebrow")
  const storyTitle = aboutContent?.secondTitle || aboutT("story.title")
  const storyDescriptionOne =
    aboutContent?.secondDescription || aboutT("story.descriptionOne")
  const storyDescriptionTwo = aboutT("story.descriptionTwo")

  const primaryImage = aboutContent?.image || "/home/content/news-2.png"
  const storyImage = aboutContent?.secondImage || "/home/content/news-feature.png"
  const videoUrl = aboutContent?.video
  const features = aboutContent?.features ?? []

  return (
    <main className="flex-1 bg-[#f8fbff]">
      <AboutIntroSection
        title={introTitle}
        descriptionOne={introDescriptionOne}
        descriptionTwo={introDescriptionTwo}
        featuredImageSrc={primaryImage}
        secondaryImageSrc={storyImage}
        featuredImageAlt={
          locale === "ar"
            ? "تصوير نبذة عن Talent Seeker"
            : "Talent Seeker about image"
        }
        secondaryImageAlt={
          locale === "ar"
            ? "مشهد توضيحي عن الدعم المهني"
            : "Professional support visual"
        }
        videoUrl={videoUrl}
      />

      {/* <ProcessSection
        steps={homeContent.processSteps}
        title={homeContent.process.title}
        description={homeContent.process.description}
      />

      <AboutStorySection
        eyebrow={storyEyebrow}
        title={storyTitle}
        missionTabLabel={aboutT("story.tabs.mission")}
        visionTabLabel={aboutT("story.tabs.vision")}
        developmentTabLabel={aboutT("story.tabs.development")}
        descriptionOne={storyDescriptionOne}
        descriptionTwo={storyDescriptionTwo}
        storyImageSrc={storyImage}
        storyImageAlt={
          locale === "ar"
            ? "قسم قصتنا وفريق العمل"
            : "Our story and team image"
        }
        features={features}
      /> */}

      <SupportSection override={homeContent.sections.footer} />
    </main>
  )
}
