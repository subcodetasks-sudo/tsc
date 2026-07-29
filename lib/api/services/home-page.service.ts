import { api } from "../client"

type HomeSectionOverride = {
  title?: string
  description?: string
}

type HomeHeroOverride = {
  title?: string
  description?: string
  image?: string
}

type ProcessOverride = {
  title?: string
  description?: string
}

type NormalizedStep = {
  id?: number
  title: string
  description: string
  icon?: string
  order?: number
}

export type HomePageContent = {
  hero: HomeHeroOverride
  sections: {
    categories: HomeSectionOverride & {
      heroStats?: {
        total: string
        unit?: string
      }
    }
    jobs: HomeSectionOverride
    testimonials: HomeSectionOverride
    news: HomeSectionOverride
    footer: HomeSectionOverride
  }
  process: ProcessOverride
  processSteps: NormalizedStep[]
}

function trimText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function pickLocalizedString(value: unknown, locale = "ar"): string | undefined {
  if (typeof value === "string") {
    return trimText(value)
  }

  if (!value || typeof value !== "object") {
    return undefined
  }

  const record = value as Record<string, unknown>
  for (const key of [locale, "ar", "en", "de"]) {
    const found = trimText(record[key])
    if (found) return found
  }

  for (const candidate of Object.values(record)) {
    const found = trimText(candidate)
    if (found) return found
  }

  return undefined
}

function normalizeSection(raw: unknown, locale = "ar"): HomeSectionOverride {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const record = raw as Record<string, unknown>

  return {
    title: pickLocalizedString(record.title, locale),
    description: pickLocalizedString(record.description, locale),
  }
}

function normalizeSections(raw: unknown, locale = "ar"): HomePageContent["sections"] {
  const normalized: HomePageContent["sections"] = {
    categories: {},
    jobs: {},
    testimonials: {},
    news: {},
    footer: {},
  }

  if (!raw) {
    return normalized
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") {
        continue
      }

      const record = item as Record<string, unknown>
      const sectionKey = trimText(record.sectionKey ?? record.section_key ?? record.key)

      if (!sectionKey) {
        continue
      }

      if (sectionKey === "success_stories" || sectionKey === "testimonials") {
        normalized.testimonials = normalizeSection(record, locale)
        continue
      }

      if (sectionKey === "support" || sectionKey === "footer") {
        normalized.footer = normalizeSection(record, locale)
        continue
      }

      if (sectionKey in normalized) {
        normalized[sectionKey as keyof typeof normalized] = normalizeSection(record, locale)
      }
    }

    return normalized
  }

  if (typeof raw !== "object") {
    return normalized
  }

  const record = raw as Record<string, unknown>

  return {
    categories: normalizeSection(record.categories, locale),
    jobs: normalizeSection(record.jobs, locale),
    testimonials: normalizeSection(record.testimonials ?? record.success_stories ?? record.successStories, locale),
    news: normalizeSection(record.news, locale),
    footer: normalizeSection(record.footer ?? record.support, locale),
  }
}

function normalizeProcess(raw: unknown, locale = "ar"): ProcessOverride {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const record = raw as Record<string, unknown>

  return {
    title: pickLocalizedString(record.title, locale),
    description: pickLocalizedString(record.description, locale),
  }
}

function normalizeSteps(raw: unknown, locale = "ar"): NormalizedStep[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const normalized: NormalizedStep[] = []

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue
    }

    const record = item as Record<string, unknown>
    const title = pickLocalizedString(record.title, locale)
    const description = pickLocalizedString(record.description, locale)

    if (!title || !description) {
      continue
    }

    normalized.push({
      id: typeof record.id === "number" ? record.id : undefined,
      title,
      description,
      icon: pickLocalizedString(record.icon, locale) || undefined,
      order: typeof record.order === "number" ? record.order : undefined,
    })
  }

  return normalized
}

function normalizeHero(raw: unknown, locale = "ar"): HomeHeroOverride {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const record = raw as Record<string, unknown>

  return {
    title: pickLocalizedString(record.title, locale),
    description: pickLocalizedString(record.description, locale),
    image:
      pickLocalizedString(record.image ?? record.imageUrl ?? record.image_url, locale) ||
      trimText(record.image ?? record.imageUrl ?? record.image_url),
  }
}

function normalizeHomePayload(payload: unknown, locale = "ar"): HomePageContent {
  if (!payload || typeof payload !== "object") {
    return defaultHomePageContent()
  }

  const record = payload as Record<string, unknown>
  const nested = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : record
  const processNode = (nested.process && typeof nested.process === "object" ? nested.process : {}) as Record<string, unknown>
  const stepsSource =
    (nested.steps ?? processNode.steps ?? nested.processSteps ?? nested.process_steps) as unknown

  return {
    hero: normalizeHero((nested.hero && typeof nested.hero === "object" ? nested.hero : nested) as unknown, locale),
    sections: normalizeSections(nested.sections as unknown, locale),
    process: normalizeProcess(processNode, locale),
    processSteps: normalizeSteps(stepsSource, locale),
  }
}

export function defaultHomePageContent(): HomePageContent {
  return {
    hero: {},
    sections: {
      categories: {
        heroStats: { total: "13k+", unit: "" }
      },
      jobs: {},
      testimonials: {},
      news: {},
      footer: {},
    },
    process: {},
    processSteps: [],
  }
}

export async function updateHomePageContent(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<void> {
  await api.post<unknown>("/home/update", formData, { token, locale })
}

export async function getAdminHomePageContent(
  token: string,
  locale = "ar"
): Promise<HomePageContent> {
  const response = await api.get<unknown>("/home", {
    token,
    locale,
    cache: "no-store",
  })

  return normalizeHomePayload(response, locale)
}

export async function getHomePageContent(locale = "ar"): Promise<HomePageContent> {
  const endpoints = ["/home", "/public/home"]

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<unknown>(endpoint, {
        locale,
        next: { revalidate: 60 },
      })
      return normalizeHomePayload(response, locale)
    } catch {
      continue
    }
  }

  return defaultHomePageContent()
}
