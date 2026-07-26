"use client"

import { useState, type ComponentProps, type FormEvent } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { PrimaryButton } from "@/components/ui/primary-button"
import { StaggerInView, StaggerItem } from "@/features/shared-home"
import { JobsListing } from "@/features/jobs/components/jobs-listing"
import type { Category, Job } from "@/lib/api/types"
import { Search } from "lucide-react"

type JobsPageClientProps = {
  locale: string
  jobs: Job[]
  total: number
  categories: Category[]
  hero: {
    eyebrow: string
    title: string
    description: string
    searchPlaceholder: string
    search: string
  }
  listingLabels: ComponentProps<typeof JobsListing>["labels"]
  stateOptions: string[]
  categoryOptions: string[]
}

export function JobsPageClient({
  locale,
  jobs,
  total,
  categories,
  hero,
  listingLabels,
  stateOptions,
  categoryOptions,
}: JobsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedSearch(searchQuery.trim())
  }

  return (
    <>
      {/* Hero Section — matches provided design, transparent background */}
      <div className="relative flex flex-col items-center justify-center w-full pt-12 pb-8 px-2 sm:px-0">
        <StaggerInView className="w-full max-w-[1312px] flex flex-col items-center gap-12">
          <StaggerItem>
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Eyebrow/tag with globe icon */}
              <span className="inline-flex items-center gap-2 rounded-[8px] bg-[#40A0CA]/25 px-4 py-2 text-[13px] font-medium tracking-[0.06em] text-[#40A0CA] shadow-sm w-fit h-[32px] justify-center whitespace-nowrap">
                <Image src="/footer/icon-link.svg" alt="" width={16} height={16} aria-hidden />
                <span className="text-[12px] font-normal leading-[1.16]">{hero.eyebrow}</span>
              </span>
              <h1 className="font-heading  text-[36px] font-bold leading-[1.5] text-[#171717] normal-case
 text-center">
                {hero.title}
              </h1>
              <p className="max-w-[700px] text-[16px] leading-[1.16] text-[#525252] text-center font-normal">
                {hero.description}
              </p>
              <form
                className="mt-2 flex w-full max-w-[644px] items-center justify-center"
                onSubmit={handleSearch}
              >
                <div className="flex w-full flex-row items-center gap-2">
                  <Input
                    name="search"
                    value={searchQuery}
                    onChange={(event) => {
                      const val = event.target.value
                      setSearchQuery(val)
                      if (!val) {
                        setAppliedSearch("")
                      }
                    }}
                    placeholder={hero.searchPlaceholder}
                    className="h-[44px] flex-1 min-w-0 rounded-[12px] border border-[#40A0CA] px-4 text-[#171717] placeholder:text-[#737373]/80 text-[14px] font-normal focus:border-[#006EA8] focus:ring-1 focus:ring-[#006EA8] shadow-sm transition-colors"
                    style={{ background: 'linear-gradient(180deg,rgba(0,110,168,0.12) 0%,rgba(0,86,133,0.12) 100%)' }}
                  />
                  <PrimaryButton
                    type="submit"
                    className="h-[44px] shrink-0 w-11 sm:w-[150px] px-0 sm:px-4 rounded-[12px] flex items-center justify-center gap-2 text-[14px] sm:text-[16px] font-medium"
                  >
                    <Search className="size-5 shrink-0" />
                    <span className="hidden sm:inline">{hero.search}</span>
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </StaggerItem>
        </StaggerInView>
      </div>

      <JobsListing
        locale={locale}
        jobs={jobs}
        total={total}
        categories={categories}
        searchQuery={appliedSearch}
        labels={listingLabels}
        stateOptions={stateOptions}
        categoryOptions={categoryOptions}
      />
    </>
  )
}
