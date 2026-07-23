"use client"

import Image from "next/image"
import { useState } from "react"
import parse from "html-react-parser"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import type { AboutFeature } from "@/lib/api/services/about.service"

type AboutStorySectionProps = {
  eyebrow: string
  title: string
  missionTabLabel: string
  visionTabLabel: string
  developmentTabLabel: string
  descriptionOne: string
  descriptionTwo: string
  storyImageSrc: string
  storyImageAlt: string
  videoUrl?: string | null
  features?: AboutFeature[]
}

export function AboutStorySection({
  eyebrow,
  title,
  missionTabLabel,
  visionTabLabel,
  developmentTabLabel,
  descriptionOne,
  descriptionTwo,
  storyImageSrc,
  storyImageAlt,
  videoUrl,
  features,
}: AboutStorySectionProps) {
  // Construct dynamic tabs from features or fall back to defaults
  const dynamicTabs =
    features && features.length > 0
      ? features.map((f, i) => ({
          key: String(f.id ?? i),
          label: f.title,
          description: f.description,
        }))
      : [
          { key: "mission", label: missionTabLabel, description: descriptionOne },
          { key: "vision", label: visionTabLabel, description: descriptionTwo },
          { key: "development", label: developmentTabLabel, description: "" },
        ]

  const [activeTabKey, setActiveTabKey] = useState<string>(dynamicTabs[0]?.key ?? "mission")
  const activeTab = dynamicTabs.find((t) => t.key === activeTabKey) ?? dynamicTabs[0]
  const isRemoteImage = /^https?:\/\//.test(storyImageSrc)

  return (
    <SectionShell stagger={false} className="bg-white py-[82px]">
      <StaggerInView className="grid items-center gap-8 lg:grid-cols-2">
        <StaggerItem>
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF4FB] px-4 py-2 text-[13px] font-semibold tracking-[0.02em] text-[#0f7abd]">
              <Image src="/footer/icon-link.svg" alt="" width={16} height={16} aria-hidden />
              <span>{eyebrow}</span>
            </div>
            <h2 className="max-w-[540px] text-balance text-[40px] leading-[1.12] font-bold text-[#171717] lg:text-[44px]">
              {parse(title)}
            </h2>

            {/* Tabs List */}
            <div className="flex w-full flex-wrap items-center gap-0 border-b border-[#e5e5e5]" role="tablist" aria-label={title}>
              {dynamicTabs.map((tab) => {
                const isActive = activeTabKey === tab.key

                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive ? "true" : "false"}
                    onClick={() => setActiveTabKey(tab.key)}
                    className={
                      isActive
                        ? "min-w-[100px] flex-1 px-2 py-3 text-center text-[14px] uppercase leading-[1.16] sm:text-[16px] border-b-2 border-[#002B46] font-semibold bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)] bg-clip-text text-transparent -mb-[1px] transition-colors"
                        : "min-w-[100px] flex-1 px-2 py-3 text-center text-[14px] uppercase leading-[1.16] sm:text-[16px] border-b-2 border-transparent font-normal text-[#A3A3A3] hover:text-[#525252] transition-colors"
                    }
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Panel Content */}
            <div className="min-h-[120px] transition-opacity duration-300 mt-4">
              <div className="max-w-[620px] text-[16px] leading-relaxed text-[#525252] whitespace-pre-line">
                {parse(activeTab?.description || descriptionOne)}
              </div>
              {/* Optional secondary description if in default state */}
              {!features && activeTabKey === "mission" && descriptionTwo && (
                <div className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-[#525252]">
                  {parse(descriptionTwo)}
                </div>
              )}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] border border-[#dce9f4] shadow-[0_20px_42px_rgba(0,25,45,0.16)] bg-gray-50">
            {videoUrl ? (
              videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                <iframe
                  src={videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
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
              <Image
                src={storyImageSrc}
                alt={storyImageAlt}
                fill
                unoptimized={isRemoteImage}
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            )}
          </div>
        </StaggerItem>
      </StaggerInView>
    </SectionShell>
  )
}
