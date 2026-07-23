"use client"

import Image from "next/image"
import { useState } from "react"
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
  videoUrl?: string | null
}

export function AboutIntroSection({
  title,
  descriptionOne,
  descriptionTwo,
  featuredImageSrc,
  secondaryImageSrc,
  featuredImageAlt,
  secondaryImageAlt,
  videoUrl,
}: AboutIntroSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const isRemoteImage = (src: string) => /^https?:\/\//.test(src)

  return (
    <SectionShell stagger={false} className="bg-white py-[72px] lg:py-[84px]">
      <StaggerInView className="space-y-10 lg:space-y-12">
        <StaggerItem>
          <div className="relative min-h-[400px] lg:min-h-[500px]">
            <div className="absolute bottom-0 aspect-[21/9] w-[70%] overflow-hidden rounded-[16px] border border-[#dce9f4] shadow-[0_20px_42px_rgba(0,25,45,0.16)] ltr:left-0 rtl:right-0">
              <Image
                src={featuredImageSrc}
                alt={featuredImageAlt}
                fill
                unoptimized={isRemoteImage(featuredImageSrc)}
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="absolute top-[40px] h-[240px] w-[55%] overflow-hidden rounded-[16px] border-4 border-white shadow-[0_22px_40px_rgba(0,25,45,0.22)] ltr:right-[2%] rtl:left-[2%] lg:top-[60px] lg:h-[320px] bg-gray-50 z-10">
              {videoUrl && isPlaying ? (
                videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") + (videoUrl.includes("?") ? "&autoplay=1" : "?autoplay=1")}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="group relative h-full w-full">
                  <Image
                    src={secondaryImageSrc}
                    alt={secondaryImageAlt}
                    fill
                    unoptimized={isRemoteImage(secondaryImageSrc)}
                    className="object-cover"
                    sizes="(min-width: 1024px) 34vw, 70vw"
                  />
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/30"
                      aria-label="Play video"
                    >
                      <Image
                        src="/play.svg"
                        alt="Play"
                        width={96}
                        height={96}
                        className="transition-transform group-hover:scale-110"
                      />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <h1 className="max-w-[820px] text-balance text-[44px] leading-[1.08] font-bold text-[#001222] lg:text-[56px]">
            {parse(title)}
          </h1>
        </StaggerItem>

        <StaggerItem>
          <div className="max-w-[720px] space-y-4 text-[17px] leading-relaxed text-[#385066]">
            <div>{parse(descriptionOne)}</div>
            <div>{parse(descriptionTwo)}</div>
          </div>
        </StaggerItem>
      </StaggerInView>
    </SectionShell>
  )
}
