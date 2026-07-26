import Image from "next/image"
import { FilterSection } from "./filter-section"
import { FilterChipGrid } from "./filter-chip-grid"
import {
  formatFilterSalaryAmount,
  salaryFromSliderPercent,
} from "@/features/jobs/lib/job-display"

export type FilterPanelProps = {
  variant?: "sidebar" | "drawer"
  filterPanelTitle: string
  clearAllLabel: string
  stateLabel: string
  categoriesLabel: string
  salaryLabel: string
  salaryMinLabel: string
  salaryMaxLabel: string
  salaryFromLabel: string
  salaryToLabel: string
  stateOptions: string[]
  categoryOptions: string[]
  activeStates: number[]
  activeCategories: number[]
  salaryValue: [number, number]
  maxSalaryBound?: number
  locale?: string
  onClearAll: () => void
  onToggleState: (index: number) => void
  onToggleCategory: (index: number) => void
  onSalaryChange: (value: [number, number]) => void
}

export function FilterPanel({
  variant = "sidebar",
  filterPanelTitle,
  clearAllLabel,
  stateLabel,
  categoriesLabel,
  salaryLabel,
  salaryMinLabel,
  salaryMaxLabel,
  salaryFromLabel,
  salaryToLabel,
  stateOptions,
  categoryOptions,
  activeStates,
  activeCategories,
  salaryValue,
  maxSalaryBound,
  locale,
  onClearAll,
  onToggleState,
  onToggleCategory,
  onSalaryChange,
}: FilterPanelProps) {
  const isDrawer = variant === "drawer"
  const isRtl = locale === "ar"

  return (
    <div
      className={
        isDrawer
          ? "bg-white"
          : "rounded-[16px] border border-[#78a3be] bg-white p-5 sm:p-6"
      }
    >
      <div className={`flex items-center justify-between ${isDrawer ? "pb-6" : ""}`}>
        <h3
          className={
            isDrawer
              ? "text-[24px] leading-[1.16] font-bold text-[#262626] sm:text-[28px]"
              : "text-[28px] leading-[1.16] font-bold text-[#262626] lg:text-[32px]"
          }
        >
          {filterPanelTitle}
        </h3>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 text-[16px] text-[#262626] hover:text-[#006EA8]"
        >
          <Image
            src="/jobs/icon-close-circle.svg"
            alt=""
            width={16}
            height={16}
            className="shrink-0"
            aria-hidden
          />
          {clearAllLabel}
        </button>
      </div>

      <div className={`space-y-6 ${isDrawer ? "pt-0" : "mt-8"}`}>
        <FilterSection title={stateLabel}>
          <FilterChipGrid options={stateOptions} activeIndices={activeStates} onToggle={onToggleState} />
        </FilterSection>

        <FilterSection title={categoriesLabel}>
          <FilterChipGrid options={categoryOptions} activeIndices={activeCategories} onToggle={onToggleCategory} />
        </FilterSection>

        <FilterSection title={salaryLabel}>
          <div className="space-y-3">
            <div className="relative h-6 w-full flex items-center select-none">
              {/* Base grey track */}
              <div className="absolute h-1.5 w-full rounded-full bg-[#E5E7EB] pointer-events-none" />
              
              {/* Active blue track region */}
              <div
                className="absolute h-1.5 rounded-full bg-[#006EA8] pointer-events-none"
                style={
                  isRtl
                    ? {
                        right: `${salaryValue[0]}%`,
                        left: `${100 - salaryValue[1]}%`,
                      }
                    : {
                        left: `${salaryValue[0]}%`,
                        right: `${100 - salaryValue[1]}%`,
                      }
                }
              />

              {/* Min slider input */}
              <input
                type="range"
                min={0}
                max={100}
                value={salaryValue[0]}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), salaryValue[1] - 1)
                  onSalaryChange([val, salaryValue[1]])
                }}
                className="pointer-events-none absolute h-1.5 w-full appearance-none bg-transparent outline-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#006EA8] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#006EA8] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />

              {/* Max slider input */}
              <input
                type="range"
                min={0}
                max={100}
                value={salaryValue[1]}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), salaryValue[0] + 1)
                  onSalaryChange([salaryValue[0], val])
                }}
                className="pointer-events-none absolute h-1.5 w-full appearance-none bg-transparent outline-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#006EA8] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#006EA8] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">{salaryFromLabel}</span>
                <span className="text-[15px] font-semibold text-[#111827]">
                  €{formatFilterSalaryAmount(salaryFromSliderPercent(salaryValue[0], maxSalaryBound))}
                </span>
              </div>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">{salaryToLabel}</span>
                <span className="text-[15px] font-semibold text-[#111827]">
                  €{formatFilterSalaryAmount(salaryFromSliderPercent(salaryValue[1], maxSalaryBound))}
                </span>
              </div>
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
