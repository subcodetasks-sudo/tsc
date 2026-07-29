import Image from "next/image"
import parse from "html-react-parser"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"

type AboutIntroSectionProps = {
  title: string
  descriptionOne: string
  descriptionTwo: string
  featuredImageSrc: string
  secondaryImageSrc: string
  featuredImageAlt: string
  secondaryImageAlt: string
}

export function AboutIntroSection({
  title,
  descriptionOne,
  descriptionTwo,
  featuredImageSrc,
  secondaryImageSrc,
  featuredImageAlt,
  secondaryImageAlt,
}: AboutIntroSectionProps) {
  const isRemoteImage = (src: string) => /^https?:\/\//.test(src)

  return (
    <SectionShell stagger={false} className="bg-white py-[72px] lg:py-[84px]">
      <StaggerInView className="space-y-10 lg:space-y-12">
        <StaggerItem>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-[#dce9f4] bg-[#f8fbff] shadow-[0_20px_42px_rgba(0,25,45,0.16)] lg:col-span-7">
              <Image
                src={featuredImageSrc}
                alt={featuredImageAlt}
                fill
                unoptimized={isRemoteImage(featuredImageSrc)}
                className="object-contain"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-[#dce9f4] bg-[#f8fbff] shadow-[0_20px_42px_rgba(0,25,45,0.16)] lg:col-span-5">
              <Image
                src={secondaryImageSrc}
                alt={secondaryImageAlt}
                fill
                unoptimized={isRemoteImage(secondaryImageSrc)}
                className="object-contain"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <h1 className="text-balance text-center text-4xl leading-[1.08] font-bold text-[#001222] lg:text-[56px] relative after:absolute after:content-[''] after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-14 after:rounded-full after:bg-[#40A0CA]">
            {parse(title)}
          </h1>
        </StaggerItem>

        <StaggerItem>
          <div className=" space-y-4 text-[17px] leading-relaxed text-[#385066]">
            <div className="text-justify">{parse(descriptionOne)}</div>
            <div className="text-justify">{parse(descriptionTwo)}</div>
          </div>
        </StaggerItem>
      </StaggerInView>
    </SectionShell>
  )
}
