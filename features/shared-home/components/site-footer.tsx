import React from "react"
import Image from "next/image"
import styles from "./site-footer.module.css"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"
import { getSettings } from "@/lib/api/services/settings.service"

/* ─────────────────────────────────────────────────────────────────
   Inline SVG social icons — same rounded-square style as /Linked_accounts/
   All use `currentColor` so we can tint them via CSS.
───────────────────────────────────────────────────────────────── */

/** Shared rounded-square background path (identical across all Linked_accounts icons) */
const ROUNDED_BG =
  "M10.0473 1.45801H9.95201C8.12646 1.458 6.69253 1.45799 5.57302 1.6085C4.42582 1.76274 3.5156 2.08527 2.80043 2.80043C2.08527 3.5156 1.76274 4.42582 1.6085 5.57302C1.45799 6.69254 1.458 8.12644 1.45801 9.95201V10.0473C1.458 11.8729 1.45799 13.3068 1.6085 14.4263C1.76274 15.5735 2.08527 16.4838 2.80043 17.1989C3.5156 17.9141 4.42582 18.2366 5.57302 18.3908C6.69254 18.5413 8.12642 18.5413 9.95201 18.5413H10.0473C11.8729 18.5413 13.3068 18.5413 14.4263 18.3908C15.5735 18.2366 16.4838 17.9141 17.1989 17.1989C17.9141 16.4838 18.2366 15.5735 18.3908 14.4263C18.5413 13.3068 18.5413 11.8729 18.5413 10.0473V9.95201C18.5413 8.12646 18.5413 6.69254 18.3908 5.57302C18.2366 4.42582 17.9141 3.5156 17.1989 2.80043C16.4838 2.08527 15.5735 1.76274 14.4263 1.6085C13.3068 1.45799 11.8729 1.458 10.0473 1.45801Z"

function SocialIconWrapper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path opacity="0.4" d={ROUNDED_BG} fill="currentColor" />
      {children}
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      {/* Telegram paper-plane, scaled to 20×20 grid */}
      <path
        d="M14.63 5.84 L6.92 9.15 C6.49 9.33 6.5 9.69 6.85 9.8 L8.93 10.45 L13.39 7.64 C13.61 7.51 13.81 7.57 13.64 7.72 L10.08 10.93 L9.95 13.08 C10.12 13.08 10.2 13 10.29 12.91 L11.35 11.88 L13.46 13.43 C13.84 13.64 14.11 13.54 14.2 13.09 L15.46 6.5 C15.6 5.94 15.25 5.69 14.63 5.84 Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      <path
        d="M14.166 5.62501L13.2674 5.625C12.5378 5.62495 11.8889 5.62489 11.3651 5.69532C10.7958 5.77187 10.2208 5.94839 9.75093 6.41826C9.28102 6.88814 9.10452 7.46306 9.02802 8.03243C8.9576 8.55625 8.9576 9.20509 8.95768 9.93475V10.625H8.33268C7.75738 10.625 7.29102 11.0914 7.29102 11.6667C7.29102 12.242 7.75738 12.7083 8.33268 12.7083H8.95768V18.5407C9.27535 18.5417 9.60652 18.5417 9.95168 18.5417H10.047C10.3922 18.5417 10.7233 18.5417 11.041 18.5407V12.7083H12.4993C13.0747 12.7083 13.541 12.242 13.541 11.6667C13.541 11.0914 13.0747 10.625 12.4993 10.625H11.041V10C11.041 9.18492 11.0433 8.67834 11.0928 8.31002C11.1374 7.9776 11.2034 7.91194 11.2231 7.8924L11.2241 7.8914L11.2251 7.89039C11.2446 7.87077 11.3103 7.80477 11.6427 7.76008C12.011 7.71055 12.5176 7.70834 13.3327 7.70834H14.166C14.7413 7.70834 15.2077 7.24197 15.2077 6.66668C15.2077 6.09138 14.7413 5.62501 14.166 5.62501Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      {/* YouTube play-button, scaled to 20×20 grid */}
      <path
        d="M14.8 8.1 C14.6 7.4 14.1 6.9 13.4 6.7 C12.2 6.4 10 6.4 10 6.4 C10 6.4 7.8 6.4 6.6 6.7 C5.9 6.9 5.4 7.4 5.2 8.1 C5 9.3 5 10 5 10 C5 10 5 11.3 5.2 12.4 C5.4 13.1 5.9 13.6 6.6 13.8 C7.8 14.1 10 14.1 10 14.1 C10 14.1 12.2 14.1 13.4 13.8 C14.1 13.6 14.6 13.1 14.8 12.4 C15 11.3 15 10 15 10 C15 10 15 9.3 14.8 8.1 Z M8.9 11.7 L8.9 8.8 L11.6 10.25 L8.9 11.7 Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      <path
        d="M10 7.25C8.48 7.25 7.25 8.48 7.25 10C7.25 11.52 8.48 12.75 10 12.75C11.52 12.75 12.75 11.52 12.75 10C12.75 8.48 11.52 7.25 10 7.25Z"
        fill="currentColor"
      />
      <path
        d="M13.25 5.83H6.75C6.06 5.83 5.83 6.06 5.83 6.75V13.25C5.83 13.94 6.06 14.17 6.75 14.17H13.25C13.94 14.17 14.17 13.94 14.17 13.25V6.75C14.17 6.06 13.94 5.83 13.25 5.83ZM10 13.42C8.06 13.42 6.58 11.94 6.58 10C6.58 8.06 8.06 6.58 10 6.58C11.94 6.58 13.42 8.06 13.42 10C13.42 11.94 11.94 13.42 10 13.42ZM13.5 7.25C13.22 7.25 13 7.03 13 6.75C13 6.47 13.22 6.25 13.5 6.25C13.78 6.25 14 6.47 14 6.75C14 7.03 13.78 7.25 13.5 7.25Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      <path
        d="M5.83333 7.91602C6.29357 7.91602 6.66667 8.28911 6.66667 8.74935V14.166C6.66667 14.6263 6.29357 14.9993 5.83333 14.9993C5.37309 14.9993 5 14.6263 5 14.166V8.74935C5 8.28911 5.37309 7.91602 5.83333 7.91602Z"
        fill="currentColor"
      />
      <path
        d="M9.92588 7.98992C9.79505 7.701 9.50413 7.5 9.1663 7.5C8.70613 7.5 8.33301 7.87309 8.33301 8.33333V14.1667C8.33301 14.6269 8.70613 15 9.1663 15C9.62655 15 9.99963 14.6269 9.99963 14.1667V10.8333C9.99963 9.91283 10.7459 9.16667 11.6663 9.16667C12.5868 9.16667 13.333 9.91283 13.333 10.8333V14.1667C13.333 14.6269 13.7061 15 14.1663 15C14.6266 15 14.9996 14.6269 14.9996 14.1667V10.8333C14.9996 8.99242 13.5073 7.5 11.6663 7.5C11.0285 7.5 10.4325 7.67917 9.92588 7.98992Z"
        fill="currentColor"
      />
      <path
        d="M5.83919 6.87435C6.41449 6.87435 6.88086 6.40798 6.88086 5.83268C6.88086 5.25738 6.41449 4.79102 5.83919 4.79102H5.83171C5.25641 4.79102 4.79004 5.25738 4.79004 5.83268C4.79004 6.40798 5.25641 6.87435 5.83171 6.87435H5.83919Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <SocialIconWrapper className={className}>
      <path
        d="M5.27653 5.54847C5.38338 5.3395 5.59831 5.20801 5.83301 5.20801H8.14783C8.34851 5.20801 8.53701 5.30438 8.65451 5.46707L10.7487 8.36679L13.7244 5.39107C13.9685 5.14699 14.3642 5.14699 14.6083 5.39107C14.8523 5.63514 14.8523 6.03087 14.6083 6.27495L11.49 9.39321L14.673 13.8004C14.8104 13.9907 14.8297 14.2419 14.7228 14.4509C14.616 14.6599 14.401 14.7914 14.1663 14.7914H11.8515C11.6508 14.7914 11.4623 14.695 11.3448 14.5323L9.25068 11.6326L6.27495 14.6083C6.03088 14.8524 5.63515 14.8524 5.39107 14.6083C5.14699 14.3642 5.14699 13.9685 5.39107 13.7244L8.50934 10.6061L5.32633 6.19894C5.18892 6.00867 5.16968 5.75745 5.27653 5.54847Z"
        fill="currentColor"
      />
    </SocialIconWrapper>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Social platform config — maps backend setting key → icon + label.
   Order matters: this is the display order in the footer.
───────────────────────────────────────────────────────────────── */
type SocialPlatform = {
  key: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "telegram_url",  label: "Telegram",  Icon: TelegramIcon  },
  { key: "youtube_url",   label: "YouTube",   Icon: YouTubeIcon   },
  { key: "facebook_url",  label: "Facebook",  Icon: FacebookIcon  },
  { key: "linkedin_url",  label: "LinkedIn",  Icon: LinkedInIcon  },
  { key: "twitter_url",   label: "X",         Icon: XIcon         },
]


/* ─────────────────────────────────────────────────────────────────
   Main footer component
───────────────────────────────────────────────────────────────── */
export async function SiteFooter() {
  const locale = await getLocale()
  const t = await getTranslations("Landing.footer")
  const contactT = await getTranslations("Landing.contact")
  const isRTL = locale === "ar"

  let contactPhone = ""
  let contactEmail = ""
  let contactAddress = ""
  let footerDescription = ""
  const socialUrls: Record<string, string> = {}

  try {
    const settings = await getSettings(locale)
    contactPhone = String(settings.find((s) => s.key === "contact_phone")?.value || "")
    contactEmail = String(settings.find((s) => s.key === "contact_email")?.value || "")
    contactAddress = String(settings.find((s) => s.key === "contact_address")?.value || "")

    for (const p of SOCIAL_PLATFORMS) {
      const val = settings.find((s) => s.key === p.key)?.value
      if (val) socialUrls[p.key] = String(val)
    }

    const descSetting = settings.find((s) => s.key === "footer_description")?.value
    if (descSetting) {
      if (typeof descSetting === "object" && descSetting !== null) {
        const obj = descSetting as Record<string, string>
        footerDescription = obj[locale] || obj.en || obj.ar || ""
      } else if (typeof descSetting === "string") {
        try {
          const parsed = JSON.parse(descSetting)
          footerDescription = parsed[locale] || parsed.en || parsed.ar || descSetting
        } catch {
          footerDescription = descSetting
        }
      }
    }
  } catch {
    // Use translation fallbacks
  }

  const displayPhone       = contactPhone   || t("contact.phone")
  const displayEmail       = contactEmail   || t("contact.email")
  const displayAddress     = contactAddress || t("contact.address")
  const displayDescription = footerDescription || contactT("footerDescription")

  // Only show platforms that have a real configured URL
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => {
    const url = (socialUrls[p.key] ?? "").trim()
    return url && url !== "#"
  })

  return (
    <footer dir={isRTL ? "rtl" : "ltr"} className="relative w-full overflow-hidden bg-[#001222] text-white">
      <div className="pointer-events-none absolute -left-40 bottom-0 z-0 h-[468px] w-[468px] rounded-full bg-[#005685] blur-[200px]" aria-hidden />
      <div className="pointer-events-none absolute -right-20 top-20 z-0 h-[468px] w-[468px] rounded-full bg-[#005685] blur-[200px]" aria-hidden />

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 ${styles.bgLinear}`} />
        <div className={`absolute inset-0 ${styles.bgRadial}`} />
        <div className={`absolute inset-0 opacity-[0.06] ${styles.noiseBg}`} />
        <div className="absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 relative">
            <Image
              src="/home/hero/hero-bg-image.png"
              alt=""
              fill
              className="pointer-events-none object-cover opacity-40 mix-blend-overlay"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1512px] px-6 py-14 lg:px-[100px] lg:pt-14 lg:pb-8">
        {/* Top Section */}
        <div className="flex flex-col justify-between gap-10 border-b border-[#003F64] pb-10 lg:flex-row lg:gap-20">
          {/* Column 1: Brand, desc & social icons */}
          <div className="flex flex-col gap-6 lg:max-w-[474px]">
            <Link locale={locale} href="/">
              <Image
                src="/footer/footer-logo.svg"
                alt={t("brand")}
                width={93}
                height={124}
                className="h-[124px] w-[93px] object-contain"
              />
            </Link>

            <p className="text-[16px] leading-normal font-normal text-[#F5F5F5]">
              {displayDescription}
            </p>

            {/* Social icons — same rounded-square style as /Linked_accounts/ SVGs */}
            {activeSocials.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {activeSocials.map((platform) => {
                  const { Icon } = platform
                  return (
                    <a
                      key={platform.key}
                      href={socialUrls[platform.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform.label}
                      className="
                        group flex size-10 items-center justify-center
                        rounded-xl border border-white/10 bg-white/5
                        text-white/60
                        transition-all duration-200
                        hover:scale-110 hover:border-[#40A0CA]/50
                        hover:bg-[#40A0CA]/20 hover:text-white
                      "
                    >
                      <Icon className="size-5 transition-colors duration-200" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[20px] font-bold leading-[1.16] text-[#40A0CA]">
              {t("quickLinks.title")}
            </h3>
            <nav className="flex flex-col gap-5">
              {["about", "jobs", "services", "contact"].map((item) => (
                <Link
                  key={item}
                  locale={locale}
                  href={`/${item}`}
                  className="group flex items-center gap-3 text-[16px] leading-[1.16] text-[#F5F5F5] transition-colors hover:text-[#40A0CA]"
                >
                  <Image
                    src="/footer/icon-link.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  />
                  {t(`quickLinks.items.${item}`)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[20px] font-bold leading-[1.16] text-[#40A0CA]">
              {t("contact.title")}
            </h3>
            <div className="flex flex-col gap-5">
              {displayPhone && (
                <div className="flex items-center gap-3 text-[16px] leading-[1.16] text-[#F5F5F5]">
                  <Image src="/footer/icon-phone.svg" alt="" width={24} height={24} />
                  <a href={`tel:${displayPhone}`} dir="ltr" className="transition-colors hover:text-[#40A0CA]">
                    {displayPhone}
                  </a>
                </div>
              )}
              {displayEmail && (
                <div className="flex items-center gap-3 text-[16px] leading-[1.16] text-[#F5F5F5]">
                  <Image src="/footer/icon-mail.svg" alt="" width={24} height={24} />
                  <a href={`mailto:${displayEmail}`} className="transition-colors hover:text-[#40A0CA]">
                    {displayEmail}
                  </a>
                </div>
              )}
              {displayAddress && (
                <div className="flex items-start gap-3 text-[16px] leading-[1.16] text-[#F5F5F5]">
                  <Image src="/footer/icon-location.svg" alt="" width={24} height={24} className="mt-0.5 shrink-0" />
                  <span className="max-w-[250px]">{displayAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-6 pt-8 lg:flex-row">
          <div className="flex items-center gap-2 text-[14px] font-medium leading-normal text-white">
            <Image src="/footer/copyright-icon.svg" alt="" width={20} height={20} />
            <span>2026</span>
            <span className="text-[#40A0CA]">Jobs-Tsc</span>
            <span>. All rights Reserved</span>
          </div>

          <div className="flex items-center gap-6 text-[16px] leading-[1.16] text-[#F5F5F5]">
            <Link locale={locale} href="/terms" className="transition-colors hover:text-[#40A0CA]">
              {contactT("legal.terms")}
            </Link>
            <div className="h-4 w-px bg-[#40A0CA]" />
            <Link locale={locale} href="/faqs" className="transition-colors hover:text-[#40A0CA]">
              {contactT("legal.faqs")}
            </Link>
            <div className="h-4 w-px bg-[#40A0CA]" />
            <Link locale={locale} href="/privacy" className="transition-colors hover:text-[#40A0CA]">
              {contactT("legal.privacy")}
            </Link>
            <div className="h-4 w-px bg-[#40A0CA]" />
            <Link locale={locale} href="/legal-information" className="transition-colors hover:text-[#40A0CA]">
              {contactT("legal.legalInformation")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
