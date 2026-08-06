"use client"

import Image from "next/image"
import type { Partner } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/utils"
import styles from "./partners-marquee.module.css"

type PartnersMarqueeProps = {
  partners: Partner[]
  isRtl?: boolean
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const src = resolveImageUrl(partner.logo_url ?? partner.logo)
  if (!src) return null

  const content = (
    <span className={styles.logoSlot}>
      <Image
        src={src}
        alt={partner.name}
        width={160}
        height={54}
        className={styles.logoImage}
        unoptimized
      />
    </span>
  )

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.logoLink}
        aria-label={partner.name}
      >
        {content}
      </a>
    )
  }

  return content
}

export function PartnersMarquee({ partners, isRtl = false }: PartnersMarqueeProps) {
  const visible = partners.filter((p) => p.logo_url || p.logo)
  if (visible.length === 0) return null

  // Duplicate the strip so the CSS loop can scroll seamlessly.
  const strip = [...visible, ...visible]

  return (
    <div className={styles.viewport} dir={isRtl ? "rtl" : "ltr"}>
      <div className={styles.fadeStart} aria-hidden />
      <div className={styles.fadeEnd} aria-hidden />
      <div className={isRtl ? styles.trackRtl : styles.track}>
        {strip.map((partner, index) => (
          <PartnerLogo key={`${partner.id}-${index}`} partner={partner} />
        ))}
      </div>
    </div>
  )
}
