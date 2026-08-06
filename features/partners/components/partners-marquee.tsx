"use client"

import Image from "next/image"
import type { Partner } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/utils"
import styles from "./partners-marquee.module.css"

type PartnersMarqueeProps = {
  partners: Partner[]
  isRtl?: boolean
}

function PartnerItem({ partner }: { partner: Partner }) {
  const src = resolveImageUrl(partner.logo_url ?? partner.logo)
  if (!src) return null

  const inner = (
    <>
      <span className={styles.logoFrame}>
        <Image
          src={src}
          alt={partner.name}
          width={168}
          height={56}
          className={styles.logoImage}
          unoptimized
        />
      </span>
      <span className={styles.partnerName}>{partner.name}</span>
    </>
  )

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.item}
        aria-label={partner.name}
      >
        {inner}
      </a>
    )
  }

  return <div className={styles.item}>{inner}</div>
}

export function PartnersMarquee({ partners, isRtl = false }: PartnersMarqueeProps) {
  const visible = partners.filter((p) => p.logo_url || p.logo)
  if (visible.length === 0) return null
console.log("partners", partners)
  // Duplicate the strip so the CSS loop can scroll seamlessly.
  const strip = [...visible, ...visible]

  return (
    <div className={styles.viewport} dir={isRtl ? "rtl" : "ltr"}>
      <div className={isRtl ? styles.trackRtl : styles.track}>
        {strip.map((partner, index) => (
          <PartnerItem key={`${partner.id}-${index}`} partner={partner} />
        ))}
      </div>
    </div>
  )
}
