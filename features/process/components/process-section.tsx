import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"
import { SectionShell, StaggerInView } from "@/features/shared-home"
import { getProcessSteps } from "@/features/process/services/process.service"
import Image from "next/image"

const defaultStepIcons = ["/process/profile.svg", "/process/info.svg", "/process/job.svg"]

function normalizeImagePath(path?: string): string {
  if (!path) return ""
  let clean = path.trim()
  // Replace backslashes with forward slashes
  clean = clean.replace(/\\/g, "/")
  // Remove trailing slashes
  clean = clean.replace(/\/+$/, "")
  // Remove "public/" prefix
  if (clean.startsWith("public/")) {
    clean = clean.slice(7)
  }
  // Prepend "/" if not absolute or external
  if (clean && !clean.startsWith("/") && !clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("data:")) {
    clean = "/" + clean
  }
  return clean
}

type ProcessStep = {
  title: string
  description: string
  icon?: string
}

type ProcessSectionProps = {
  steps?: ProcessStep[]
  title?: string
  description?: string
}

function CurvedArrow({ className, rtl }: { className?: string; rtl?: boolean }) {
  if (rtl) {
    return (
      <svg className={className} viewBox="0 0 220 40" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M214 27C162 12 94 12 18 27"
          stroke="#41A0CA"
          strokeWidth="1.8"
          strokeDasharray="4 5"
          fill="none"
        />
        <path
          d="M24 22L14 27L24 33"
          stroke="#41A0CA"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 220 40" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <path
        d="M6 27C58 12 126 12 202 27"
        stroke="#41A0CA"
        strokeWidth="1.8"
        strokeDasharray="4 5"
        fill="none"
      />
      <path
        d="M196 22L206 27L196 33"
        stroke="#41A0CA"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StepConnector({ index, rtl }: { index: 0 | 1; rtl: boolean }) {
  const leftClass = rtl
    ? index === 0
      ? "left-[56%]"
      : "left-[22%]"
    : index === 0
      ? "left-[22%]"
      : "left-[56%]"

  return (
    <div className={`pointer-events-none absolute top-[18px] z-10 hidden h-10 w-[24%] md:block ${leftClass}`}>
      <CurvedArrow rtl={rtl} className="h-full w-full opacity-100" />
    </div>
  )
}

export async function ProcessSection({ steps: overrideSteps, title: titleOverride, description: descriptionOverride }: ProcessSectionProps) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const t = await getTranslations("Landing.process")
  const isRtl = locale === "ar"

  // Get process steps - handle both array and async responses
  const processSteps = getProcessSteps()
  const stepKeys = Array.isArray(processSteps) ? processSteps : ["createAccount", "completeProfile", "apply"]

  const steps = overrideSteps?.length
    ? overrideSteps
    : (stepKeys as readonly string[]).map((step, index) => ({
      title: t(`steps.${step}.title`),
      description: t(`steps.${step}.description`),
      icon: defaultStepIcons[index],
    }))

  const title = titleOverride ?? t("title")
  const description = descriptionOverride ?? t("description")

  return (
    <SectionShell stagger={false} className="relative overflow-x-clip bg-[#001222] py-[72px] lg:py-[88px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_bottom,rgba(65,160,202,0.42)_0%,rgba(65,160,202,0.18)_28%,rgba(0,18,34,0)_72%)]" />

      <StaggerInView leadDelay={0.55}>
        <div className="relative space-y-6 text-center">
          {/* <div className="mx-auto flex w-fit items-center gap-2 rounded-[8px] bg-[#04324F] px-4 py-2">
            <Image src="/footer/icon-link.svg" alt="" width={16} height={16} />
            <span className="text-[12px] leading-[1.16] font-normal text-[#40A0CA]">{t("eyebrow")}</span>
          </div> */}
          <h2 className="mx-auto max-w-[866px] text-balance font-heading text-[28px] font-bold normal-case
 leading-[1.5] text-[#F5F5F5] sm:text-[32px] lg:text-[36px]">
            {title}
          </h2>
          <p className="mx-auto max-w-[500px] text-[14px] leading-[1.16] text-[#D4D4D4] sm:text-[16px]">
            {description}
          </p>
        </div>
      </StaggerInView>

      <StaggerInView leadDelay={0.75}>
        <div className="relative mt-20 overflow-visible">
          <div className="relative grid gap-12 md:grid-cols-3" dir={isRtl ? "rtl" : "ltr"}>
            <StepConnector index={0} rtl={isRtl} />
            <StepConnector index={1} rtl={isRtl} />

            {steps.map((step, index) => {
              const src = normalizeImagePath(step.icon) || defaultStepIcons[index % defaultStepIcons.length]

              return (
                <div key={`${step.title}-${index}`} className="relative z-[1] flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center">
                    <Image src={src} alt={step.title} width={48} height={48} className="object-contain" />
                  </div>
                  <h3 className="mt-6 text-[20px] leading-[1.16] font-bold text-[#F5F5F5]">{step.title}</h3>
                  <p className="mt-3 max-w-[280px] text-[16px] leading-normal text-[#D4D4D4]">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </StaggerInView>
    </SectionShell>
  )
}