"use client"

import { useTranslations } from "next-intl"
import { findSuggestedSkill } from "../lib/suggested-skills"
import { PortfolioSectionCard } from "./portfolio-section-card"
import type { SkillItem } from "../types/portfolio.types"

export function SkillsSection({
  locale,
  skills,
  onEdit,
}: {
  locale: string
  skills: SkillItem[]
  onEdit: () => void
}) {
  const t = useTranslations("UserPortfolio")

  function displaySkillName(name: string) {
    const match = findSuggestedSkill(name)
    return match ? t(`skills.suggested.${match.key}`) : name
  }

  return (
    <PortfolioSectionCard
      locale={locale}
      title={t("skills.heading")}
      action={
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] hover:bg-gray-50 rounded-[8px] text-[14px] font-semibold text-[#032C44] transition"
        >
          <img src="/portfolio/edit.svg" alt="Edit" className="w-[16px] h-[16px]" />
          <span>{t("common.edit")}</span>
        </button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((s, idx) => (
            <div
              key={idx}
              className="px-4 py-1.5 border border-[#006EA8] text-[#006EA8] bg-white rounded-full text-sm font-semibold hover:bg-[#F0F9FF] transition"
            >
              {displaySkillName(s.skillName)}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">{t("skills.empty")}</p>
        )}
      </div>
    </PortfolioSectionCard>
  )
}
