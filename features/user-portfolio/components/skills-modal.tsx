"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { gradientTitleClasses, inputClass, labelClass } from "../lib/style-constants"
import { createSkillsFormSchema, type SkillsFormValues } from "../lib/skills-form-schema"
import {
  SUGGESTED_SKILL_CATEGORIES,
  SUGGESTED_SKILLS,
  findSuggestedSkill,
  type SuggestedSkill,
} from "../lib/suggested-skills"
import type { SkillItem } from "../types/portfolio.types"

export function SkillsModal({
  locale,
  open,
  onOpenChange,
  skills,
  onSave,
  saving,
}: {
  locale: string
  open: boolean
  onOpenChange: (open: boolean) => void
  skills: SkillItem[]
  onSave: (skills: SkillItem[]) => void
  saving?: boolean
}) {
  const t = useTranslations("UserPortfolio")
  const isAr = locale === "ar"

  const [searchInput, setSearchInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [isOtherMode, setIsOtherMode] = useState(false)
  const [customSkill, setCustomSkill] = useState("")
  const customInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const schema = createSkillsFormSchema({
    atLeastOne: t("skills.modal.atLeastOneError"),
  })

  const { control, handleSubmit, reset, watch } = useForm<SkillsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { skills: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "skills" })
  const currentSkills = watch("skills")

  useEffect(() => {
    if (open) {
      reset({ skills: skills.map((s) => ({ id: s.id, skillName: s.skillName })) })
      setSearchInput("")
      setShowDropdown(false)
      setIsOtherMode(false)
      setCustomSkill("")
    }
  }, [open, skills, reset])

  useEffect(() => {
    if (isOtherMode) {
      customInputRef.current?.focus()
    }
  }, [isOtherMode])

  function skillLabel(skill: SuggestedSkill) {
    return t(`skills.suggested.${skill.key}`)
  }

  function displaySkillName(name: string) {
    const match = findSuggestedSkill(name)
    return match ? skillLabel(match) : name
  }

  function isDuplicate(name: string) {
    const needle = name.trim().toLowerCase()
    return currentSkills.some((s) => {
      const existing = findSuggestedSkill(s.skillName)
      const existingLabel = existing ? skillLabel(existing).toLowerCase() : s.skillName.toLowerCase()
      return (
        s.skillName.toLowerCase() === needle ||
        existingLabel === needle ||
        (existing !== undefined && existing.value.toLowerCase() === needle)
      )
    })
  }

  function addSkill(name: string) {
    const text = name.trim()
    if (!text) return
    if (isDuplicate(text)) {
      toast.error(t("skills.modal.duplicateError"))
      return
    }
    const known = findSuggestedSkill(text)
    append({ tempId: `skill-${Date.now()}`, skillName: known ? known.value : text })
    setSearchInput("")
    setCustomSkill("")
    setIsOtherMode(false)
    setShowDropdown(false)
  }

  function selectSuggested(skill: SuggestedSkill) {
    addSkill(skill.value)
  }

  function selectOther(initial?: string) {
    setShowDropdown(false)
    setSearchInput("")
    setIsOtherMode(true)
    setCustomSkill(typeof initial === "string" ? initial : "")
  }

  function exitOtherMode() {
    setIsOtherMode(false)
    setCustomSkill("")
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  const onSubmit = handleSubmit((values) => {
    onSave(values.skills)
    onOpenChange(false)
  })

  const query = searchInput.trim().toLowerCase()
  const suggestions = SUGGESTED_SKILLS.filter((s) => {
    if (isDuplicate(s.value)) return false
    if (!query) return true
    return skillLabel(s).toLowerCase().includes(query) || s.value.toLowerCase().includes(query)
  })

  const groupedSuggestions = SUGGESTED_SKILL_CATEGORIES.map((category) => ({
    category,
    items: suggestions.filter((s) => s.category === category),
  })).filter((group) => group.items.length > 0)

  const otherMatchesSearch =
    !searchInput.trim() ||
    t("skills.modal.otherOption").toLowerCase().includes(searchInput.toLowerCase())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-6 rounded-[20px] bg-white border-0 shadow-lg">
        <DialogDescription className="sr-only">{t("skills.modal.description")}</DialogDescription>
        <div className="flex items-center justify-between mb-5">
          <DialogTitle className={gradientTitleClasses(isAr)}>{t("skills.heading")}</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <img src="/portfolio/close-circle.svg" alt="Close" className="w-7 h-7" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className={labelClass}>{t("skills.modal.label")}</label>

            {fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-1.5 px-3 py-1 border border-[#006EA8] text-[#006EA8] bg-white rounded-full text-xs font-semibold"
                  >
                    <span>{displaySkillName(field.skillName)}</span>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-0.5 hover:bg-red-50 rounded-full transition flex items-center justify-center"
                      title={t("common.remove")}
                    >
                      <img src="/portfolio/remove.svg" alt="Remove" className="w-[10px] h-[10px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isOtherMode ? (
              <div className="rounded-[12px] border border-[#40A0CA]/40 bg-[#F0F9FF] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#006EA8]">{t("skills.modal.otherHint")}</p>
                  <button
                    type="button"
                    onClick={exitOtherMode}
                    className="text-xs text-[#737373] hover:text-[#006EA8] transition underline-offset-2 hover:underline shrink-0"
                  >
                    {t("skills.modal.backToList")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill(customSkill)
                      }
                      if (e.key === "Escape") {
                        e.preventDefault()
                        exitOtherMode()
                      }
                    }}
                    placeholder={t("skills.modal.otherPlaceholder")}
                    className={`${inputClass} flex-1 !py-2`}
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(customSkill)}
                    disabled={!customSkill.trim()}
                    className="shrink-0 h-[36px] px-4 rounded-[10px] text-sm font-bold text-white bg-[#006EA8] hover:bg-[#005685] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {t("skills.modal.add")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="w-full border-b border-[#D4D4D4] focus-within:border-[#40A0CA] py-2 flex items-center min-h-[42px] pe-8 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (suggestions.length === 1) {
                          selectSuggested(suggestions[0])
                        } else if (searchInput.trim()) {
                          selectOther(searchInput.trim())
                        }
                      }
                    }}
                    placeholder={t("skills.modal.placeholder")}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[#525252] border-0 p-0 focus:ring-0 focus:border-0 shadow-none rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="absolute end-0 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
                  >
                    <img src="/portfolio/arrow-down.svg" alt="Select" className="w-4 h-4 opacity-70" />
                  </button>
                </div>

                {showDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg max-h-[280px] overflow-y-auto">
                    {otherMatchesSearch && (
                      <>
                        <button
                          type="button"
                          onClick={() => selectOther()}
                          className="w-full text-start px-4 py-2.5 text-sm text-[#006EA8] hover:bg-[#F0F9FF] transition font-semibold flex items-center gap-2"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#006EA8]/10 text-[#006EA8] text-xs font-bold">
                            +
                          </span>
                          {t("skills.modal.otherOption")}
                          <span className="text-xs font-normal text-[#737373] ms-auto">
                            {t("skills.modal.otherCaption")}
                          </span>
                        </button>
                        {(suggestions.length > 0 || searchInput.trim() !== "") && (
                          <div className="border-t border-[#E5E7EB]" />
                        )}
                      </>
                    )}

                    {groupedSuggestions.map((group) => (
                      <div key={group.category}>
                        <div className="sticky top-0 z-10 bg-[#F8FAFC] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#64748B] border-b border-[#E5E7EB]">
                          {t(`skills.categories.${group.category}`)}
                        </div>
                        {group.items.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => selectSuggested(item)}
                            className="w-full text-start px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            {skillLabel(item)}
                          </button>
                        ))}
                      </div>
                    ))}

                    {suggestions.length === 0 && searchInput.trim() !== "" && (
                      <p className="px-4 py-2.5 text-sm text-[#A3A3A3]">{t("skills.modal.noMatch")}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-10 h-[44px] border border-[#006EA8] text-[#006EA8] bg-white hover:bg-[#F0F9FF] font-bold rounded-[12px] text-[15px] transition shadow-sm cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-10 h-[44px] text-white font-bold rounded-[12px] text-[15px] transition bg-[#006EA8] hover:bg-[#005685] shadow-[0_4px_14px_rgba(0,110,168,0.3)] hover:shadow-[0_6px_20px_rgba(0,110,168,0.45)] cursor-pointer"
          >
            {t("common.confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
