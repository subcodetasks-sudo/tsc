import type { Job, CompanyProfile } from "@/lib/api/types"
type UnknownJob = Record<string, unknown>
import { resolveImageUrl } from "@/lib/utils"

export function getLocalizedName(value: unknown, locale: string): string {
  if (!value) return ""
  if (typeof value === "string") {
    if (value.startsWith("{") && value.endsWith("}")) {
      try {
        const parsed = JSON.parse(value)
        const p = parsed as Record<string, unknown>
        const v = p[locale]
        if (typeof v === "string") return v
        if (typeof p.ar === "string") return p.ar
        if (typeof p.en === "string") return p.en
        if (typeof p.de === "string") return p.de
        return value
      } catch {
        return value
      }
    }
    return value
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const v = obj[locale]
    if (typeof v === "string") return v
    if (typeof obj.ar === "string") return obj.ar
    if (typeof obj.en === "string") return obj.en
    if (typeof obj.de === "string") return obj.de
    return ""
  }
  return String(value)
}

export function getJobTitle(job: Pick<Job, "title">, locale: string): string {
  const { title } = job
  if (typeof title === "string") return title
  if (title && typeof title === "object") {
    return title[locale] || title.en || title.ar || title.de || ""
  }
  return ""
}

const GENDER_ONLY_VALUES = new Set([
  "male",
  "female",
  "all",
  "m",
  "f",
  "ذكر",
  "أنثى",
  "انثى",
])

function isGenderOnlyValue(value: string): boolean {
  return GENDER_ONLY_VALUES.has(value.trim().toLowerCase())
}

/**
 * Resolve a job's salary range as numbers, supporting the multiple shapes the
 * API sends across endpoints: nested `salary.from/to` (public jobs endpoint),
 * or flat `salary_from`/`salary_to`/`from`/`to`/`salaryFrom`/`salaryTo`.
 */
export function resolveJobSalaryRange(
  job: Job | UnknownJob | undefined
): { from?: number; to?: number } {
  const j = job as UnknownJob | undefined
  const salaryObj = j && typeof j === "object" ? (j["salary"] as UnknownJob | undefined) : undefined
  const fromRaw = salaryObj && typeof salaryObj === "object"
    ? (salaryObj["from"] ?? salaryObj["min"]) : (j ? (j["salary_from"] ?? j["from"] ?? j["salaryFrom"]) : undefined)
  const toRaw = salaryObj && typeof salaryObj === "object"
    ? (salaryObj["to"] ?? salaryObj["max"]) : (j ? (j["salary_to"] ?? j["to"] ?? j["salaryTo"]) : undefined)
  const from = fromRaw != null ? Number(String(fromRaw)) : undefined
  const to = toRaw != null ? Number(String(toRaw)) : undefined
  return { from, to }
}

export function formatJobSalary(
  job: Job | UnknownJob | undefined,
  periodLabel: string,
  isRTL = false
): string {
  const { from, to } = resolveJobSalaryRange(job)
  if (from != null && to != null) {
    const min = Math.min(from, to)
    const max = Math.max(from, to)
    // Show numbers in logical order but flip visual order for RTL locales
    return isRTL ? `$${max} – $${min}${periodLabel}` : `$${min} – $${max}${periodLabel}`
  }
  if (from != null) return `$${from}${periodLabel}`
  if (to != null) return `$${to}${periodLabel}`
  return "—"
}

/** Sidebar / hero salary block — e.g. "$1000 - $1200" */
export function formatJobSalaryRange(job: Job | UnknownJob | undefined, isRTL = false): string {
  const { from, to } = resolveJobSalaryRange(job)
  if (from != null && to != null) {
    const min = Math.min(from, to)
    const max = Math.max(from, to)
    // Respect RTL when requested: show max - min visually on RTL pages
    return isRTL ? `$${max} - $${min}` : `$${min} - $${max}`
  }
  if (from != null) return `$${from}`
  if (to != null) return `$${to}`
  return "—"
}

/** Shown on listing cards — never Male/Female, only employment type. */
export function formatJobEmploymentForCard(
  value?: string,
  fallback = "Full-time"
): string {
  if (!value?.trim() || isGenderOnlyValue(value)) return fallback
  return value.trim()
}

/** Maps API snake_case employment type to a human-readable label. */
export function translateEmploymentType(value: string | undefined | null, locale: string): string | null {
  if (!value?.trim()) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === "full_time" || normalized === "full-time") {
    if (locale === "ar") return "\u062f\u0648\u0627\u0645 \u0643\u0627\u0645\u0644"
    if (locale === "de") return "Vollzeit"
    return "Full-time"
  }
  if (normalized === "part_time" || normalized === "part-time") {
    if (locale === "ar") return "\u062f\u0648\u0627\u0645 \u062c\u0632\u0626\u064a"
    if (locale === "de") return "Teilzeit"
    return "Part-time"
  }
  return value.trim()
}

export function formatDetailEmployment(
  job: Pick<Job, "employment_type" | "job_type" | "gender">,
  locale = "de"
): string | null {
  const raw = job.employment_type?.trim() || job.job_type?.trim()
  if (raw) return translateEmploymentType(raw, locale)
  if (job.gender?.trim() && !isGenderOnlyValue(job.gender)) {
    return job.gender.trim()
  }
  return null
}

function parseApiDate(value: string): Date {
  const trimmed = value.trim()
  if (!trimmed) return new Date(NaN)

  // Naive "YYYY-MM-DD HH:mm:ss" from Laravel — treat as UTC by appending Z.
  // Without Z, Date() parses as LOCAL time which is wrong for a UTC-stored timestamp.
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    return new Date(trimmed.replace(" ", "T") + "Z")
  }

  return new Date(trimmed)
}

/** Resolve the best timestamp to show as "posted" (prefer publish/approval/update over draft created_at). */
export function resolveJobCreatedAt(job: unknown): string | undefined {
  if (!job || typeof job !== "object") return undefined
  const row = job as UnknownJob
  const status = String(row["status"] ?? "").trim().toLowerCase()
  const isPublished = ["active", "approved", "published", "stopped", "closed"].includes(status)

  const candidates = isPublished
    ? [
        row["published_at"],
        row["publishedAt"],
        row["approved_at"],
        row["approvedAt"],
        row["posted_at"],
        row["postedAt"],
        row["updated_at"],
        row["updatedAt"],
        row["created_at"],
        row["createdAt"],
      ]
    : [
        row["created_at"],
        row["createdAt"],
        row["published_at"],
        row["publishedAt"],
        row["posted_at"],
        row["postedAt"],
      ]

  let bestRaw: string | undefined
  let bestTime = Number.NEGATIVE_INFINITY

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue
    const parsed = parseApiDate(candidate.trim())
    const time = parsed.getTime()
    if (Number.isNaN(time)) continue
    if (time > bestTime) {
      bestTime = time
      bestRaw = candidate.trim()
    }
  }

  return bestRaw
}

export function formatPostedLabel(
  job: any,
  locale: string,
  relativeFallback: string
): string {
  // Always use locale-aware relative time calculation instead of raw API
  // human string which is typically returned in English by the backend.
  const createdAt = resolveJobCreatedAt(job)
  if (createdAt) {
    return formatPostedAgo(createdAt, locale, relativeFallback)
  }

  return relativeFallback
}

export function formatJobType(
  gender?: string,
  employmentType?: string
): string {
  if (employmentType?.trim()) return employmentType
  return formatJobEmploymentForCard(gender)
}

export function formatGenderForDetail(gender?: string, locale = "ar"): string {
  const fallback = locale === "ar" ? "الكل" : locale === "de" ? "Alle" : "All"
  if (!gender?.trim()) return fallback
  if (isGenderOnlyValue(gender)) {
    const normalized = gender.trim()
    if (/male|m|ذكر/i.test(normalized)) return locale === "ar" ? "ذكر" : locale === "de" ? "Männlich" : "Male"
    if (/female|f|أنثى|انثى/i.test(normalized)) return locale === "ar" ? "أنثى" : locale === "de" ? "Weiblich" : "Female"
    return fallback
  }
  return fallback
}

function toPositiveAge(value: unknown): number | null {
  if (value == null || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

/** Resolve age from flat (`age_from`/`age_to`) or nested Postman shape (`age.from`/`age.to`). */
export function resolveJobAge(job: unknown): { from: number | null; to: number | null } {
  if (!job || typeof job !== "object") return { from: null, to: null }

  const row = job as UnknownJob
  let from = toPositiveAge(row["age_from"] ?? row["ageFrom"])
  let to = toPositiveAge(row["age_to"] ?? row["ageTo"])

  const ageObj = row["age"]
  if (ageObj && typeof ageObj === "object") {
    const nested = ageObj as UnknownJob
    from = from ?? toPositiveAge(nested["from"] ?? nested["min"])
    to = to ?? toPositiveAge(nested["to"] ?? nested["max"])
  }

  return { from, to }
}

/**
 * Resolve a job's sub-category id, supporting the shapes seen across
 * endpoints: nested `sub_category.id`/`subCategory.id`, or flat
 * `sub_category_id`/`subCategoryId`.
 */
export function resolveJobSubCategoryId(job: Job | UnknownJob | undefined): number | undefined {
  if (!job || typeof job !== "object") return undefined
  const row = job as UnknownJob

  const nested = (row["sub_category"] ?? row["subCategory"]) as UnknownJob | undefined
  if (nested && typeof nested === "object" && nested["id"] != null) {
    const id = Number(nested["id"])
    if (Number.isFinite(id)) return id
  }

  const flat = row["sub_category_id"] ?? row["subCategoryId"]
  if (flat != null && flat !== "") {
    const id = Number(flat)
    if (Number.isFinite(id)) return id
  }

  return undefined
}

export function formatAgeRange(job: unknown, locale = "ar"): string {
  const { from, to } = resolveJobAge(job)
  const suffix = locale === "ar" ? " سنة" : locale === "de" ? " Jahre" : " years"
  if (from != null && to != null) return `${from} - ${to}${suffix}`
  if (from != null) return `+${from}${suffix}`
  if (to != null) return `≤ ${to}${suffix}`
  return "—"
}

export function formatApplicationDeadline(
  deadline?: string,
  locale = "de"
): string {
  if (!deadline) return "—"
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return deadline
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

/**
 * Resolve application deadline from a job payload supporting multiple shapes.
 * Returns a string (raw) or undefined.
 */
export function resolveJobApplicationDeadline(job: Job | UnknownJob | undefined): string | undefined {
  if (!job || typeof job !== "object") return undefined
  const anyJob = job as UnknownJob
  const candidates: Array<string | undefined> = [
    anyJob["application_deadline"] as string | undefined,
    anyJob["applicationDeadline"] as string | undefined,
    anyJob["application_deadline_date"] as string | undefined,
    anyJob["deadline"] as string | undefined,
  ]
  // nested object: application_deadline?.date
  const nested = anyJob["application_deadline"]
  if (nested && typeof nested === "object") candidates.push((nested as UnknownJob)["date"] as string | undefined)
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim()
  }
  return undefined
}

const RELATIVE_LOCALE: Record<string, string> = {
  ar: "ar",
  en: "en",
  de: "de",
}

export function formatPostedAgo(
  createdAt: string | undefined,
  locale: string,
  fallback: string
): string {
  if (!createdAt) return fallback
  const date = parseApiDate(createdAt)
  if (Number.isNaN(date.getTime())) return fallback

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  const intlLocale = RELATIVE_LOCALE[locale] ?? "de"
  if (diffHours < 1) {
    return new Intl.RelativeTimeFormat(intlLocale, { numeric: "always" }).format(
      -Math.max(1, Math.floor(diffMs / (1000 * 60))),
      "minute"
    )
  }
  if (diffHours < 48) {
    return new Intl.RelativeTimeFormat(intlLocale, { numeric: "always" }).format(
      -diffHours,
      "hour"
    )
  }
  return new Intl.RelativeTimeFormat(intlLocale, { numeric: "always" }).format(
    -diffDays,
    "day"
  )
}

export const DEFAULT_SALARY_SLIDER_MAX = 10000

export function salaryFromSliderPercent(percent: number, maxSalary: number = DEFAULT_SALARY_SLIDER_MAX): number {
  return Math.round((percent / 100) * maxSalary)
}

/** Latin digits only — avoids SSR/client hydration mismatch on Arabic pages. */
export function formatFilterSalaryAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)
}

const STATE_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Baden-Württemberg": {
    en: "Baden-Württemberg",
    ar: "بادن-فورتمبيرغ",
    de: "Baden-Württemberg",
  },
  "Bayern": {
    en: "Bavaria",
    ar: "بايرن",
    de: "Bayern",
  },
  "Berlin": {
    en: "Berlin",
    ar: "برلين",
    de: "Berlin",
  },
  "Brandenburg": {
    en: "Brandenburg",
    ar: "براندنبورغ",
    de: "Brandenburg",
  },
  "Bremen": {
    en: "Bremen",
    ar: "بريمن",
    de: "Bremen",
  },
  "Hamburg": {
    en: "Hamburg",
    ar: "هامبورغ",
    de: "Hamburg",
  },
  "Hessen": {
    en: "Hesse",
    ar: "هسن",
    de: "Hessen",
  },
  "Mecklenburg-Vorpommern": {
    en: "Mecklenburg-Western Pomerania",
    ar: "مكلنبورغ-فوربومرن",
    de: "Mecklenburg-Vorpommern",
  },
  "Niedersachsen": {
    en: "Lower Saxony",
    ar: "سكسونيا السفلى",
    de: "Niedersachsen",
  },
  "Nordrhein-Westfalen": {
    en: "North Rhine-Westphalia",
    ar: "شمال الراين-وستفاليا",
    de: "Nordrhein-Westfalen",
  },
  "Rheinland-Pfalz": {
    en: "Rhineland-Palatinate",
    ar: "راينلند بالاتينات",
    de: "Rheinland-Pfalz",
  },
  "Saarland": {
    en: "Saarland",
    ar: "سارلاند",
    de: "Saarland",
  },
  "Sachsen": {
    en: "Saxony",
    ar: "سكسونيا",
    de: "Sachsen",
  },
  "Sachsen-Anhalt": {
    en: "Saxony-Anhalt",
    ar: "سكسونيا-آنهالت",
    de: "Sachsen-Anhalt",
  },
  "Schleswig-Holstein": {
    en: "Schleswig-Holstein",
    ar: "شليسفيغ-هولشتاين",
    de: "Schleswig-Holstein",
  },
  "Thüringen": {
    en: "Thuringia",
    ar: "تورينغن",
    de: "Thüringen",
  },
}

export function getLocalizedStateName(state: string, locale: string): string {
  if (!state) return ""
  const match = STATE_TRANSLATIONS[state]
  if (match) {
    return match[locale] || match.en || state
  }
  return state
}

/**
 * Resolve a company logo from many possible fields the API or legacy backends may provide.
 * Returns an absolute URL (via `resolveImageUrl`) or `undefined` when none found.
 */
export function getCompanyLogo(company?: CompanyProfile | UnknownJob): string | undefined {
  if (!company) return undefined

  const c = company as UnknownJob
  const candidates: string[] = []
  const pushIfString = (v: unknown) => {
    if (typeof v === "string" && v.trim()) candidates.push(v.trim())
  }

  const cp = c["companyProfile"]
  if (cp && typeof cp === "object") {
    const cpObj = cp as UnknownJob
    pushIfString(cpObj["logoUrl"])
    pushIfString(cpObj["logo_url"])
    pushIfString(cpObj["logo"])
    pushIfString(cpObj["image"])
  }

  const cpLegacy = c["company_profile"]
  if (cpLegacy && typeof cpLegacy === "object") {
    const cpObj = cpLegacy as UnknownJob
    pushIfString(cpObj["logo_url"])
    pushIfString(cpObj["logo"])
    pushIfString(cpObj["image"])
  }

  pushIfString(c["logoUrl"])
  pushIfString(c["logo_url"])
  pushIfString(c["logo"])
  // Only consider explicit company logo/image fields. Avoid using
  // generic "avatar"/"photo" fields which may belong to a user
  // (causes user-profile images to appear as company logos).
  pushIfString(c["image"])
  pushIfString(c["image_url"])
  pushIfString(c["logo_image"])
  pushIfString(c["logo_image_url"])

  const profile = c["profile"]
  if (profile && typeof profile === "object") {
    const p = profile as UnknownJob
    // profile.* may contain company branding in some payloads; accept
    // explicit logo/image fields only.
    pushIfString(p["logo"])
    pushIfString(p["logo_url"])
    pushIfString(p["image"])
  }

  const found = candidates.length > 0 ? candidates[0] : undefined
  if (!found) return undefined
  try {
    return resolveImageUrl(found)
  } catch {
    return found
  }
}

/** Resolve company logo from a job payload (handles nested API shapes). */
export function getJobCompanyLogo(job: Job | UnknownJob | undefined): string | undefined {
  if (!job || typeof job !== "object") return undefined
  const row = job as UnknownJob

  return (
    getCompanyLogo(row.company as CompanyProfile | UnknownJob) ||
    getCompanyLogo(row.employer as CompanyProfile | UnknownJob) ||
    getCompanyLogo(row.company_data as CompanyProfile | UnknownJob) ||
    (typeof (row as UnknownJob).company_logo === "string" ? (row as UnknownJob).company_logo as string : undefined) ||
    (typeof (row as UnknownJob).logo === "string" ? (row as UnknownJob).logo as string : undefined)
  )
}
