"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"
import { motion } from "motion/react"
import { SectionShell, StaggerInView, StaggerItem } from "@/features/shared-home"
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SuccessStory } from "@/lib/api/types"
import { resolveStoryImageUrl } from "@/features/testimonials/lib/resolve-story-image"
import { TestimonialArrowNext, TestimonialArrowPrev } from "@/features/testimonials/components/testimonial-arrows"
import Portal from "@/components/ui/portal"


export type TestimonialsLabels = {
  eyebrow: string
  title: string
  description: string
}

type TestimonialsCarouselProps = {
  stories: SuccessStory[]
  labels: TestimonialsLabels
  isRtl: boolean
}

function parseRoleParts(story: SuccessStory) {
  if (story.location) {
    return { role: story.role, location: story.location }
  }
  const parts = story.role.split("|").map((p) => p.trim())
  if (parts.length >= 2) {
    return { role: parts[0], location: parts.slice(1).join(" | ") }
  }
  return { role: story.role, location: undefined }
}

function StoryMeta({
  role,
  location,
  className,
  inverted = false,
  muted = false,
}: {
  role: string
  location?: string
  className?: string
  inverted?: boolean
  muted?: boolean
}) {
  const tone = inverted ? "text-white" : muted ? "text-[#525252]" : "text-[#171717]"

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start", className)}>
      <span className={cn("text-[14px] leading-[1.16] sm:text-[16px]", tone)}>{role}</span>
      {location ? (
        <>
          <span className="h-5 w-0.5 shrink-0 bg-[#40A0CA] sm:h-6" aria-hidden />
          <span className={cn("text-[14px] leading-[1.16] sm:text-[16px]", tone)}>{location}</span>
        </>
      ) : null}
    </div>
  )
}

// أزرار التنقل للشاشات الكبيرة (تظهر في مكانها الأصلي)
function DesktopCarouselNav({ isRtl }: { isRtl: boolean }) {
  const { scrollPrev, scrollNext } = useCarousel()
  const moveLeft = isRtl ? scrollPrev : scrollNext
  const moveRight = isRtl ? scrollNext : scrollPrev

  const prevControl = (
    <button
      type="button"
      aria-label={isRtl ? "السابق" : "Previous slide"}
      onClick={moveLeft}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-opacity hover:opacity-80"
    >
      <TestimonialArrowPrev rotate={isRtl} />
    </button>
  )

  const nextControl = (
    <button
      type="button"
      aria-label={isRtl ? "التالي" : "Next slide"}
      onClick={moveRight}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-opacity hover:opacity-80"
    >
      <TestimonialArrowNext rotate={isRtl} />
    </button>
  )

  return (
    <div className="hidden lg:flex items-center justify-center gap-3 sm:gap-4">
      {prevControl}
      {nextControl}
    </div>
  )
}

// أزرار التنقل للشاشات الصغيرة (تظهر أسفل المحتوى)
function MobileCarouselNav({ isRtl }: { isRtl: boolean }) {
  const { scrollPrev, scrollNext } = useCarousel()

  const prevControl = (
    <button
      type="button"
      aria-label={isRtl ? "السابق" : "Previous slide"}
      onClick={isRtl ? scrollPrev : scrollNext}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-3 transition-all hover:scale-110 active:scale-95 lg:hidden"
    >
      <TestimonialArrowPrev rotate={isRtl} />
    </button>
  )

  const nextControl = (
    <button
      type="button"
      aria-label={isRtl ? "التالي" : "Next slide"}
      onClick={isRtl ? scrollNext : scrollPrev}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-3 transition-all hover:scale-110 active:scale-95 lg:hidden"
    >
      <TestimonialArrowNext rotate={isRtl} />
    </button>
  )

  return (
    <div className="flex items-center justify-center gap-6 mt-8 lg:hidden">
      {prevControl}
      {nextControl}
    </div>
  )
}

export function TestimonialsCarousel({ stories, labels, isRtl }: TestimonialsCarouselProps) {
  const items = Array.isArray(stories) ? stories : []
  const autoplay = useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }),
    []
  )
  const tilt = -5

  return (
    <SectionShell stagger={false} className="overflow-x-clip bg-[#f8fcff] py-12 sm:py-16 lg:py-[82px]">
      <div className="flex w-full flex-col gap-10 sm:gap-14 lg:gap-16">
        <Carousel
          opts={{
            loop: true,
            align: "center",
            direction: isRtl ? "rtl" : "ltr",
            dragFree: false,
            containScroll: "trimSnaps",
          }}
          plugins={[autoplay]}
          className="w-full touch-pan-y  "
          dir={isRtl ? "rtl" : "ltr"}
        >
          <StaggerInView
            className={cn(
              "flex w-full mb-8 flex-col items-center gap-6 text-center sm:gap-8",
              "lg:flex-row lg:items-end lg:justify-between lg:text-start"
            )}
            immediate
          >
            <div
              className={cn(
                "flex w-full max-w-[1096px] flex-col items-center gap-6",
                "lg:items-start lg:text-start"
              )}
            >
              <StaggerItem immediate>
                <p className="inline-flex items-center gap-2 rounded-lg bg-[rgba(64,160,202,0.25)] px-4 py-2 text-[12px] leading-[1.16] font-normal text-[#40A0CA]">
                  <Image src="/footer/icon-link.svg" alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
                  {labels.eyebrow}
                </p>
              </StaggerItem>
              <div className="space-y-4 sm:space-y-6">
                <StaggerItem immediate>
                  <h2 className="max-w-[635px] font-heading text-[28px] font-bold capitalize leading-[1.5] text-[#171717] sm:text-[32px] lg:text-[36px]">
                    {labels.title}
                  </h2>
                </StaggerItem>
                <StaggerItem immediate>
                  <p className="mx-auto max-w-[500px] text-[14px] font-normal leading-[1.16] text-[#525252] sm:text-[16px] lg:mx-0">
                    {labels.description}
                  </p>
                </StaggerItem>
              </div>
            </div>
            {/* أزرار الديسكتوب - تظهر في مكانها الأصلي */}
            <StaggerItem immediate className="hidden lg:flex w-full shrink-0 items-center justify-center lg:w-auto">
              <DesktopCarouselNav isRtl={isRtl} />
            </StaggerItem>
          </StaggerInView>

          <div className="w-full overflow-hidden px-1 py-3">
            <CarouselContent
              noClip
              className={cn(
                "ml-0 cursor-grab active:cursor-grabbing",
                isRtl ? "-me-4 pe-0 ps-0 sm:-me-6" : "-ms-4 ps-0 pe-0 sm:-ms-6"
              )}
            >
              {items.map((story, index) => {
                const imageSrc = resolveStoryImageUrl(story.image_url ?? story.image, index)
                const { role, location } = parseRoleParts(story)
                return (
                  <CarouselItem
                    key={story.id}
                    className={cn(
                      "basis-auto shrink-0 pl-0",
                      isRtl ? "pe-4 sm:pe-6" : "ps-4 sm:ps-6"
                    )}
                  >
                    {
                      // per-slide state for portal overlay
                    }
                    <StorySlideInner
                      story={story}
                      imageSrc={imageSrc}
                      role={role}
                      location={location}
                      isRtl={isRtl}
                      tilt={tilt}
                    />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </div>

          {/* أزرار الموبايل - تظهر أسفل المحتوى */}
          <MobileCarouselNav isRtl={isRtl} />
        </Carousel>
      </div>
    </SectionShell>
  )
}

function StorySlideInner({
  story,
  imageSrc,
  role,
  location,
  isRtl,
  tilt,
}: {
  story: SuccessStory
  imageSrc: string
  role: string
  location?: string
  isRtl: boolean
  tilt: number
}) {
  const imageRef = useRef<HTMLDivElement | null>(null)
  const quoteRef = useRef<HTMLParagraphElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  useEffect(() => {
    function handleUpdate() {
      if (imageRef.current && hovered) {
        const r = imageRef.current.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }

    window.addEventListener("resize", handleUpdate)
    window.addEventListener("scroll", handleUpdate, { passive: true })
    return () => {
      window.removeEventListener("resize", handleUpdate)
      window.removeEventListener("scroll", handleUpdate)
    }
  }, [hovered])

  useEffect(() => {
    if (!hovered || expanded) return
    const el = quoteRef.current
    if (!el) return
    const measure = () => setCanExpand(el.scrollHeight > el.clientHeight + 1)
    measure()
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [hovered, expanded, story.quote])

  function handleEnter() {
    if (imageRef.current) {
      const r = imageRef.current.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    setHovered(true)
  }

  function handleLeave() {
    setHovered(false)
    setExpanded(false)
  }

  return (
    <>
      <motion.article
        initial="rest"
        className="group mx-auto flex w-[min(92vw,445px)] shrink-0 flex-col gap-6 overflow-visible sm:gap-8"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div ref={imageRef} className="relative mx-auto h-[min(72vw,445px)] w-full max-w-[445px] shrink-0 overflow-visible">
          <Image
            src={imageSrc}
            alt={story.name}
            width={445}
            height={445}
            className="h-full w-full rounded-[32px] object-cover"
            unoptimized={imageSrc.startsWith("http")}
            draggable={false}
          />
        </div>

        {/* Portal overlay for desktop */}
        {rect && hovered && typeof window !== "undefined" && window.innerWidth >= 1024 && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96, rotate: tilt }}
              animate={hovered ? { opacity: 1, y: 0, scale: 1, rotate: tilt } : { opacity: 0, y: 32, scale: 0.96, rotate: tilt }}
              transition={{ type: "spring", stiffness: 280, damping: 26, opacity: { duration: 0.2 } }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={handleLeave}
              style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, height: rect.height, zIndex: 30, pointerEvents: "auto" }}
              className={cn(
                "mx-auto hidden lg:block h-[min(380px,94%)] w-[calc(100%-12px)] max-w-[445px] origin-center overflow-hidden rounded-[32px]",
                "border-0 bg-[url('/contact/button-noise.png'),linear-gradient(180deg,#006EA8_0%,#005685_100%)]",
                "bg-size-[120px_120px,auto] bg-blend-[plus-lighter,normal] text-white",
                "shadow-[0px_42px_107px_rgba(123,190,255,0.34),0px_24px_32px_rgba(0,86,133,0.19),0px_10px_13px_rgba(0,86,133,0.22),0px_4px_5px_rgba(0,86,133,0.15),0px_0px_0px_4px_#E8F2FF,0px_0px_0px_5px_#FFFFFF,inset_0px_1px_18px_2px_#E8F2FF,inset_0px_1px_4px_2px_#C2DDFF]"
              )}
            >
              <Card className="h-full min-h-0 overflow-hidden border-0 bg-transparent shadow-none">
                <CardContent
                  className={cn(
                    "flex h-full min-h-0 flex-col justify-between gap-4 p-5 text-start sm:gap-5 sm:p-6 lg:p-7",
                    isRtl && "text-end"
                  )}
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <p
                      ref={quoteRef}
                      className={cn(
                        "min-h-0 text-[14px] leading-[1.45] sm:text-[15px] lg:text-[16px]",
                        expanded ? "overflow-y-auto" : "line-clamp-3"
                      )}
                    >
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    {(canExpand || expanded) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpanded((prev) => !prev)
                        }}
                        className="shrink-0 self-start text-[12px] font-semibold underline underline-offset-2 opacity-90 transition-opacity hover:opacity-100"
                      >
                        {expanded
                          ? isRtl
                            ? "عرض أقل"
                            : "Show less"
                          : isRtl
                            ? "عرض المزيد"
                            : "Show more"}
                      </button>
                    )}
                  </div>
                  <div className="shrink-0 space-y-3">
                    <StoryMeta role={role} location={location} inverted />
                    <p className="truncate text-[22px] font-bold leading-[1.2] sm:text-[26px] lg:text-[30px]">
                      {story.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Portal>
        )}

        {/* Mobile content */}
        <div
          className={cn(
            "flex w-full max-w-[445px] flex-col items-center gap-4 text-center",
            "[@media(hover:hover)]:lg:hidden",
            isRtl ? "lg:items-end lg:text-end" : "lg:items-start lg:text-start"
          )}
        >
          <p className="text-[14px] leading-[1.5] text-[#525252] sm:text-[16px]">&ldquo;{story.quote}&rdquo;</p>
          <StoryMeta role={role} location={location} muted />
          <p className="text-[24px] font-bold leading-[1.5] text-[#171717] sm:text-[28px]">{story.name}</p>
        </div>
      </motion.article>
    </>
  )
}