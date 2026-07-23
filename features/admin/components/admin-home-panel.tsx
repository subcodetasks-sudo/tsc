"use client";

import Image from "next/image";
import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PrimaryButton } from "@/components/ui/primary-button";
import { compressImageFile as compressImageLib } from "@/lib/images/compress-image";
import type { HomePageContent } from "@/lib/api/services/home-page.service";
import { saveHomeContentAction } from "@/features/admin/actions/admin-actions";

type SectionKey = "categories" | "jobs" | "success_stories" | "news" | "footer";
type TabKey = "hero" | SectionKey | "process";

type SectionForm = {
  title: string;
  description: string;
};

type StepForm = {
  id?: number;
  title: string;
  description: string;
  icon?: string;
  order?: number;
};

type FormState = {
  heroTitle: string;
  heroDescription: string;
  sections: Record<SectionKey, SectionForm>;
  steps: StepForm[];
};

type FallbackCopy = {
  heroTitle: string;
  heroDescription: string;
  sections: Record<SectionKey, SectionForm>;
  steps: StepForm[];
};

const SECTION_KEYS: SectionKey[] = [
  "categories",
  "jobs",
  "success_stories",
  "news",
  "footer",
];
export const MAX_STEPS = 3;
export const DEFAULT_STEP_ICONS = [
  "/process/profile.svg",
  "/process/info.svg",
  "/process/job.svg",
];

export function normalizeImagePath(path?: string): string {
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

function emptySection(): SectionForm {
  return { title: "", description: "" };
}

function emptyStep(): StepForm {
  return { title: "", description: "", order: 1 };
}

function getSectionOverride(content: HomePageContent | null, key: SectionKey) {
  if (!content) {
    return undefined;
  }

  if (key === "success_stories") {
    return content.sections.testimonials;
  }

  return content.sections[
    key as Exclude<keyof HomePageContent["sections"], "testimonials">
  ];
}

function resolveSectionValue(value: string | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

function buildFallbackCopy(
  heroT: ReturnType<typeof useTranslations>,
  categoriesT: ReturnType<typeof useTranslations>,
  jobsT: ReturnType<typeof useTranslations>,
  testimonialsT: ReturnType<typeof useTranslations>,
  newsT: ReturnType<typeof useTranslations>,
  supportT: ReturnType<typeof useTranslations>,
  processT: ReturnType<typeof useTranslations>,
): FallbackCopy {
  return {
    heroTitle: heroT("title"),
    heroDescription: heroT("description"),
    sections: {
      categories: {
        title: categoriesT("title"),
        description: categoriesT("description"),
      },
      jobs: {
        title: jobsT("title"),
        description: jobsT("description"),
      },
      success_stories: {
        title: testimonialsT("title"),
        description: testimonialsT("description"),
      },
      news: {
        title: newsT("title"),
        description: newsT("description"),
      },
      footer: {
        title: supportT("title"),
        description: supportT("description"),
      },
    },
    steps: [
      {
        title: processT("steps.createAccount.title"),
        description: processT("steps.createAccount.description"),
        order: 1,
      },
      {
        title: processT("steps.completeProfile.title"),
        description: processT("steps.completeProfile.description"),
        order: 2,
      },
      {
        title: processT("steps.apply.title"),
        description: processT("steps.apply.description"),
        order: 3,
      },
    ],
  };
}

function mapContentToForm(
  content: HomePageContent | null,
  fallback: FallbackCopy,
): FormState {
  const sections = SECTION_KEYS.reduce<Record<SectionKey, SectionForm>>(
    (acc, key) => {
      const override = getSectionOverride(content, key);
      acc[key] = {
        title: resolveSectionValue(
          override?.title,
          fallback.sections[key].title,
        ),
        description: resolveSectionValue(
          override?.description,
          fallback.sections[key].description,
        ),
      };
      return acc;
    },
    {
      categories: emptySection(),
      jobs: emptySection(),
      success_stories: emptySection(),
      news: emptySection(),
      footer: emptySection(),
    },
  );

  const steps = (
    content?.processSteps?.length ? content.processSteps : fallback.steps
  )
    .slice(0, MAX_STEPS)
    .map((step, index) => ({
      ...step,
      icon: step.icon?.trim() ? normalizeImagePath(step.icon) : DEFAULT_STEP_ICONS[index],
    }));

  while (steps.length < MAX_STEPS) {
    steps.push({ ...emptyStep(), icon: DEFAULT_STEP_ICONS[steps.length] });
  }

  return {
    heroTitle: resolveSectionValue(content?.hero.title, fallback.heroTitle),
    heroDescription: resolveSectionValue(
      content?.hero.description,
      fallback.heroDescription,
    ),
    sections,
    steps,
  };
}

function appendLocalized(
  formData: FormData,
  key: string,
  value: string,
  locale: string,
) {
  const trimmed = value.trim();
  if (trimmed) {
    formData.append(`${key}[${locale}]`, trimmed);
  }
}

function InputLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-[#374151]">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function AdminHomePanel({
  content,
  locale,
  loadError,
}: {
  content: HomePageContent | null;
  locale: string;
  loadError?: string | null;
}) {
  const t = useTranslations("Admin.home");
  const tMedia = useTranslations("Admin.mediaUpload");
  const heroT = useTranslations("Landing.hero");
  const categoriesT = useTranslations("Landing.categories");
  const jobsT = useTranslations("Landing.jobs");
  const testimonialsT = useTranslations("Landing.testimonials");
  const newsT = useTranslations("Landing.news");
  const supportT = useTranslations("Landing.support");
  const processT = useTranslations("Landing.process");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("hero");

  // Supported locales for editing translations
  const SUPPORTED_LOCALES = ["ar", "en", "de"] as const
  type LocaleCode = (typeof SUPPORTED_LOCALES)[number]

  // content may include a helper field `__allLocales` attached by the server
  const allLocalesContent = (content as unknown as {
    __allLocales?: Record<LocaleCode, HomePageContent | null>
  })?.__allLocales

  // Build a fallback copy (same for all locales here)
  const fallback = buildFallbackCopy(
    heroT,
    categoriesT,
    jobsT,
    testimonialsT,
    newsT,
    supportT,
    processT,
  )

  // Initialize translations state for each supported locale using provided content
  const initialTranslations = useMemo(() => {
    return {
      ar: mapContentToForm(allLocalesContent?.["ar"] ?? content, fallback),
      en: mapContentToForm(allLocalesContent?.["en"] ?? content, fallback),
      de: mapContentToForm(allLocalesContent?.["de"] ?? content, fallback),
    } as Record<LocaleCode, FormState>
  }, [content, allLocalesContent, fallback])

  const [translations, setTranslations] = useState<Record<LocaleCode, FormState>>(initialTranslations)
  const [editLocale, setEditLocale] = useState<LocaleCode>(locale as LocaleCode)

  // Uploaded icon files for steps (shared across locales)
  const [stepFiles, setStepFiles] = useState<Record<number, File | null>>({})
  const [stepPreviews, setStepPreviews] = useState<Record<number, string | null>>({})

  // NOTE: `AdminHomePanel` is mounted with a `key` derived from the server
  // `content` prop (see page.tsx). When the server content changes we rely on
  // remounting to reset the component state. This avoids syncing state from
  // props inside an effect which can cause cascading renders.

  const currentForm = translations[editLocale] ?? translations["ar"]

  function updateSection(
    key: SectionKey,
    field: "title" | "description",
    value: string,
  ) {
    setTranslations((prev) => ({
      ...prev,
      [editLocale]: {
        ...prev[editLocale],
        sections: {
          ...prev[editLocale].sections,
          [key]: {
            ...prev[editLocale].sections[key],
            [field]: value,
          },
        },
      },
    }))
  }

  function updateStep(
    index: number,
    field: "title" | "description" | "icon",
    value: string,
  ) {
    setTranslations((prev) => {
      const updated = { ...prev }
      if (field === "icon") {
        for (const loc of SUPPORTED_LOCALES) {
          if (updated[loc]) {
            updated[loc] = {
              ...updated[loc],
              steps: updated[loc].steps.map((step: StepForm, currentIndex: number) =>
                currentIndex === index ? { ...step, icon: value } : step
              ),
            }
          }
        }
      } else {
        if (updated[editLocale]) {
          updated[editLocale] = {
            ...updated[editLocale],
            steps: updated[editLocale].steps.map((step: StepForm, currentIndex: number) =>
              currentIndex === index ? { ...step, [field]: value } : step
            ),
          }
        }
      }
      return updated
    })
  }

  function isSvgFile(file: File) {
    return file.type === "image/svg+xml" || /\.svg$/i.test(file.name)
  }

  async function handleStepFileSelect(index: number, file?: File | null) {
    // remove
    if (!file) {
      const prev = stepPreviews[index]
      if (prev) URL.revokeObjectURL(prev)
      setStepFiles((s) => {
        const copy = { ...s }
        delete copy[index]
        return copy
      })
      setStepPreviews((p) => {
        const copy = { ...p }
        delete copy[index]
        return copy
      })
      updateStep(index, "icon", "") // Revert path text so it defaults correctly
      return
    }
    // Skip compressing vector images
    const compressed = isSvgFile(file)
      ? file
      : await compressImageLib(file, { maxWidth: 800, quality: 0.8, maxBytes: 400 * 1024, mimeType: "image/jpeg" })
    setStepFiles((s) => ({ ...s, [index]: compressed }))
    const url = URL.createObjectURL(compressed)
    setStepPreviews((p) => {
      const prev = p[index]
      if (prev) URL.revokeObjectURL(prev)
      return { ...p, [index]: url }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();

    // Append hero translations for all locales
    const emptySections: Record<SectionKey, SectionForm> = {
      categories: emptySection(),
      jobs: emptySection(),
      success_stories: emptySection(),
      news: emptySection(),
      footer: emptySection(),
    }

    const defaultEmptyForm: FormState = {
      heroTitle: "",
      heroDescription: "",
      sections: emptySections,
      steps: Array.from({ length: MAX_STEPS }, () => ({ title: "", description: "", order: 1 })),
    }

    for (const loc of SUPPORTED_LOCALES) {
      const tf = translations[loc] || defaultEmptyForm
      appendLocalized(formData, "title", tf.heroTitle, loc)
      appendLocalized(formData, "description", tf.heroDescription, loc)
    }

    // Sections: append section_key once per index, then localized values
    SECTION_KEYS.forEach((key, index) => {
      const hasAny = SUPPORTED_LOCALES.some((loc) => {
        const s = translations[loc]
        if (!s) return false
        const entry = s.sections[key]
        return Boolean(entry?.title?.trim() || entry?.description?.trim())
      })
      if (!hasAny) return

      formData.append(`sections[${index}][section_key]`, key)

      for (const loc of SUPPORTED_LOCALES) {
        const entry = translations[loc]?.sections[key]
        if (!entry) continue
        appendLocalized(formData, `sections[${index}][title]`, entry.title, loc)
        appendLocalized(formData, `sections[${index}][description]`, entry.description, loc)
      }
    })

    // Steps: gather icon/id/order from first available locale, append localized titles/descriptions
    for (let index = 0; index < MAX_STEPS; index++) {
      const anyStep = SUPPORTED_LOCALES.some((loc) => {
        const s = translations[loc]
        if (!s) return false
        const st = s.steps[index]
        return Boolean(st && (st.title.trim() || st.description.trim() || st.icon?.trim()))
      })
      if (!anyStep) continue

      // id and order/icon: prefer primary (ar) then others
      let chosenId: number | undefined
      let chosenOrder: number | undefined
      let chosenIcon: string | undefined
      for (const loc of SUPPORTED_LOCALES) {
        const st = translations[loc]?.steps[index]
        if (!st) continue
        if (chosenId === undefined && typeof st.id === "number") chosenId = st.id
        if (chosenOrder === undefined && typeof st.order === "number") chosenOrder = st.order
        if (!chosenIcon && st.icon?.trim()) chosenIcon = st.icon
      }

      if (chosenId !== undefined) formData.append(`steps[${index}][id]`, String(chosenId))
      if (chosenOrder !== undefined) formData.append(`steps[${index}][order]`, String(chosenOrder))

      if (stepFiles[index]) {
        formData.append(`steps[${index}][icon]`, stepFiles[index] as Blob)
      } else {
        const finalIcon = normalizeImagePath(chosenIcon) || DEFAULT_STEP_ICONS[index]
        if (finalIcon.startsWith("/process/")) {
          try {
            const resp = await fetch(finalIcon)
            if (resp.ok) {
              const blob = await resp.blob()
              const filename = finalIcon.split("/").pop() || "icon.svg"
              const file = new File([blob], filename, { type: "image/svg+xml" })
              formData.append(`steps[${index}][icon]`, file)
            } else {
              formData.append(`steps[${index}][icon]`, finalIcon)
            }
          } catch (fetchErr) {
            console.error("Failed to fetch default icon blob:", fetchErr)
            formData.append(`steps[${index}][icon]`, finalIcon)
          }
        } else {
          formData.append(`steps[${index}][icon]`, finalIcon)
        }
      }

      for (const loc of SUPPORTED_LOCALES) {
        const st = translations[loc]?.steps[index]
        if (!st) continue
        appendLocalized(formData, `steps[${index}][title]`, st.title, loc)
        appendLocalized(formData, `steps[${index}][description]`, st.description, loc)
      }
    }

    startTransition(async () => {
      const result = await saveHomeContentAction(formData, locale);
      if (!result.ok) {
        setError(result.message ?? t("error"));
        return;
      }

      setSuccess(t("success"));
      router.refresh();
    });
  }

  const tabs: Array<{ key: TabKey; label: string; note: string }> = [
    { key: "hero", label: t("sectionLabels.hero"), note: t("helper.hero") },
    {
      key: "categories",
      label: t("sectionLabels.categories"),
      note: t("helper.categories"),
    },
    {
      key: "process",
      label: t("sectionLabels.process"),
      note: t("helper.process"),
    },
    { key: "jobs", label: t("sectionLabels.jobs"), note: t("helper.jobs") },
    {
      key: "success_stories",
      label: t("sectionLabels.successStories"),
      note: t("helper.successStories"),
    },
    { key: "news", label: t("sectionLabels.news"), note: t("helper.news") },
    {
      key: "footer",
      label: t("sectionLabels.footer"),
      note: t("helper.footer"),
    },
  ];

  const sectionContent = (
    <div className="space-y-4">
      {activeTab === "hero" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InputLabel label={t("fields.heroTitle")}>
            <input
              value={currentForm.heroTitle}
              placeholder={t("fields.heroTitle")}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [editLocale]: { ...prev[editLocale], heroTitle: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
            />
          </InputLabel>

          <InputLabel label={t("fields.heroDescription")}>
            <textarea
              rows={5}
              placeholder={t("fields.heroDescription")}
              value={currentForm.heroDescription}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [editLocale]: { ...prev[editLocale], heroDescription: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
            />
          </InputLabel>
        </div>
      )}

          {activeTab === "categories" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InputLabel label={t("fields.sectionCategoriesTitle")}>
            <input
                  value={currentForm.sections.categories.title}
              placeholder={t("fields.sectionCategoriesTitle")}
                  onChange={(e) => updateSection("categories", "title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
            />
          </InputLabel>

          <InputLabel label={t("fields.sectionCategoriesDescription")}>
            <textarea
              rows={5}
              placeholder={t("fields.sectionCategoriesDescription")}
              value={currentForm.sections.categories.description}
              onChange={(e) => updateSection("categories", "description", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
            />
          </InputLabel>
        </div>
      )}

      {activeTab === "process" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {currentForm.steps.map((step: StepForm, index: number) => (
            <div
              key={`${step.id ?? index}-${index}`}
              className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm overflow-hidden">
                  {stepPreviews[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stepPreviews[index] ?? undefined} alt="" width={32} height={32} className="h-full w-full object-contain" />
                  ) : (
                    <Image
                      src={normalizeImagePath(step.icon) || DEFAULT_STEP_ICONS[index]}
                      alt=""
                      width={32}
                      height={32}
                      className="object-contain"
                      unoptimized={true}
                    />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
                    {t("labels.processStep")}
                  </p>
                  <p className="text-sm text-[#4B5563]">
                    {t("helper.processIcon")}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <InputLabel label={t("fields.stepTitle")}>
                  <input
                    value={step.title}
                    placeholder={t("fields.stepTitle")}
                    onChange={(e) => updateStep(index, "title", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                  />
                </InputLabel>

                <InputLabel label={t("fields.stepIcon")}>
                  <div className="flex flex-col gap-2">
                    {/* Path input — read-only when a file is pending upload */}
                    <input
                      value={stepFiles[index] ? `📁 ${stepFiles[index]!.name}` : (step.icon ?? "")}
                      readOnly={Boolean(stepFiles[index])}
                      placeholder={DEFAULT_STEP_ICONS[index]}
                      onChange={(e) => {
                        if (!stepFiles[index]) updateStep(index, "icon", e.target.value)
                      }}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        stepFiles[index]
                          ? "border-[#006EA8] bg-[#EFF8FF] text-[#006EA8] focus:border-[#006EA8] focus:ring-[#006EA8]"
                          : "border-[#E5E7EB] focus:border-[#006EA8] focus:ring-[#006EA8]"
                      }`}
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Styled file upload button */}
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#006EA8] bg-white px-3 py-1.5 text-xs font-medium text-[#006EA8] hover:bg-[#EFF8FF] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        {t("fields.uploadIcon") || "رفع أيقونة"}
                        <input
                          type="file"
                          accept="image/*,image/svg+xml,.svg"
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            await handleStepFileSelect(index, f)
                            // reset input so same file can be re-selected
                            e.target.value = ""
                          }}
                        />
                      </label>

                      {/* Remove button — only visible when file/preview exists */}
                      {(stepFiles[index] || stepPreviews[index]) && (
                        <button
                          type="button"
                          onClick={() => handleStepFileSelect(index, undefined)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                          {t("fields.removeImage") || "حذف"}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-[#006EA8]">
                      {tMedia("aspectRatio", { ratio: "1:1" })}
                    </p>

                    {/* Preview thumbnail */}
                    {stepPreviews[index] && (
                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#006EA8]/20 bg-[#EFF8FF] px-3 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stepPreviews[index]!} alt="" className="h-8 w-8 rounded object-contain" />
                        <span className="text-xs text-[#006EA8]">{t("fields.preview") || "معاينة"}</span>
                      </div>
                    )}
                  </div>
                </InputLabel>

                <InputLabel label={t("fields.stepDescription")}>
                  <textarea
                    rows={4}
                    placeholder={t("fields.stepDescription")}
                    value={step.description}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                  />
                </InputLabel>
              </div>
            </div>
          ))}
        </div>
      )}

      {(activeTab === "jobs" ||
        activeTab === "success_stories" ||
        activeTab === "news" ||
        activeTab === "footer") && (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeTab === "jobs" && (
            <>
              <InputLabel label={t("fields.sectionJobsTitle")}>
                <input
                  value={currentForm.sections.jobs.title}
                  placeholder={t("fields.sectionJobsTitle")}
                  onChange={(e) => updateSection("jobs", "title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>

              <InputLabel label={t("fields.sectionJobsDescription")}>
                <textarea
                  rows={5}
                  placeholder={t("fields.sectionJobsDescription")}
                  value={currentForm.sections.jobs.description}
                  onChange={(e) => updateSection("jobs", "description", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>
            </>
          )}

          {activeTab === "success_stories" && (
            <>
              <InputLabel label={t("fields.sectionTestimonialsTitle")}>
                <input
                  value={currentForm.sections.success_stories.title}
                  placeholder={t("fields.sectionTestimonialsTitle")}
                  onChange={(e) => updateSection("success_stories", "title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>

              <InputLabel label={t("fields.sectionTestimonialsDescription")}>
                <textarea
                  rows={5}
                  placeholder={t("fields.sectionTestimonialsDescription")}
                  value={currentForm.sections.success_stories.description}
                  onChange={(e) => updateSection("success_stories", "description", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>
            </>
          )}

          {activeTab === "news" && (
            <>
              <InputLabel label={t("fields.sectionNewsTitle")}>
                <input
                  value={currentForm.sections.news.title}
                  placeholder={t("fields.sectionNewsTitle")}
                  onChange={(e) => updateSection("news", "title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>

              <InputLabel label={t("fields.sectionNewsDescription")}>
                <textarea
                  rows={5}
                  placeholder={t("fields.sectionNewsDescription")}
                  value={currentForm.sections.news.description}
                  onChange={(e) => updateSection("news", "description", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>
            </>
          )}

          {activeTab === "footer" && (
            <>
              <InputLabel label={t("fields.sectionFooterTitle")}>
                <input
                  value={currentForm.sections.footer.title}
                  placeholder={t("fields.sectionFooterTitle")}
                  onChange={(e) => updateSection("footer", "title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>

              <InputLabel label={t("fields.sectionFooterDescription")}>
                <textarea
                  rows={5}
                  placeholder={t("fields.sectionFooterDescription")}
                  value={currentForm.sections.footer.description}
                  onChange={(e) => updateSection("footer", "description", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                />
              </InputLabel>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6  "
    >
     
     

      {loadError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="flex items-center justify-between gap-2 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-1">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-white text-[#006EA8] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {tab.label}
              </button>
            );
            })}
          </div>

          <div className="flex gap-2">
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setEditLocale(l)}
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  editLocale === l ? "bg-[#006EA8] text-white" : "bg-white text-[#6B7280] border"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div>
            <p className="text-base font-semibold text-[#111827]">
              {tabs.find((tab) => tab.key === activeTab)?.label}
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {tabs.find((tab) => tab.key === activeTab)?.note}
            </p>
          </div>
        </div>

        <div className="pt-4">{sectionContent}</div>
      </div>

      <div className="flex items-center justify-end">
        <PrimaryButton
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg px-4 text-sm"
        >
          {pending ? t("saving") : t("save")}
        </PrimaryButton>
      </div>
    </form>
  );
}
