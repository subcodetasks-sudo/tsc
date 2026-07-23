"use client"

import Image from "next/image"
import { useMemo, useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { PrimaryButton } from "@/components/ui/primary-button"
import type { AboutPageContent, AboutFeature } from "@/lib/api/services/about.service"
import { saveAboutAction } from "@/features/admin/actions/admin-actions"
import { Upload, X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

const LOCALES = ["ar", "en", "de"] as const
type LocaleKey = (typeof LOCALES)[number]

type FeatureForm = {
  id?: number | string
  title: Record<LocaleKey, string>
  description: Record<LocaleKey, string>
}

type MainFormState = {
  title: Record<LocaleKey, string>
  descriptionLeft: Record<LocaleKey, string>
  descriptionRight: Record<LocaleKey, string>
}

type SecondFormState = {
  secondTitle: Record<LocaleKey, string>
  secondDescription: Record<LocaleKey, string>
}

function emptyLocale(): Record<LocaleKey, string> {
  return { ar: "", en: "", de: "" }
}

function mapContentToMainForm(content: AboutPageContent | null): MainFormState {
  if (!content) return { title: emptyLocale(), descriptionLeft: emptyLocale(), descriptionRight: emptyLocale() }
  return {
    title: { ar: content.title, en: content.title, de: content.title },
    descriptionLeft: { ar: content.descriptionLeft, en: content.descriptionLeft, de: content.descriptionLeft },
    descriptionRight: { ar: content.descriptionRight, en: content.descriptionRight, de: content.descriptionRight },
  }
}

function mapContentToSecondForm(content: AboutPageContent | null): SecondFormState {
  if (!content) return { secondTitle: emptyLocale(), secondDescription: emptyLocale() }
  return {
    secondTitle: { ar: content.secondTitle, en: content.secondTitle, de: content.secondTitle },
    secondDescription: { ar: content.secondDescription, en: content.secondDescription, de: content.secondDescription },
  }
}

function mapFeaturesToForm(features: AboutFeature[]): FeatureForm[] {
  return features.map((f) => ({
    id: f.id,
    title: { ar: f.title, en: f.title, de: f.title },
    description: { ar: f.description, en: f.description, de: f.description },
  }))
}

function LocaleCard({
  lang, label, value, onChange, multiline = false, rows = 3,
}: {
  lang: string; label: string; value: string
  onChange: (v: string) => void; multiline?: boolean; rows?: number
}) {
  const dir = lang === "ar" ? "rtl" : "ltr"

  return (
    <div className="block text-sm text-[#374151]">
      <span className="mb-1 block font-medium">
        <span className="me-1.5 rounded bg-[#EAF4FB] px-1.5 py-0.5 text-xs font-bold text-[#006EA8]">
          {lang.toUpperCase()}
        </span>
        {label}
      </span>
      {multiline ? (
        <RichTextEditor
          key={`${lang}-${label}`}
          value={value}
          onChange={onChange}
          dir={dir}
          minHeight={rows >= 4 ? "120px" : "96px"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
        />
      )}
    </div>
  )
}

function ImageUploadBox({
  label, file, preview, existingUrl, onFile, onClear, aspectRatio = "4:3",
}: {
  label: string; file: File | null; preview: string | null
  existingUrl?: string | null; onFile: (f: File) => void; onClear: () => void
  aspectRatio?: string
}) {
  const tMedia = useTranslations("Admin.mediaUpload")
  const inputRef = useRef<HTMLInputElement>(null)
  const displaySrc = preview || existingUrl
  const previewStyle = { aspectRatio: aspectRatio.replace(":", " / "), width: 144 }

  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-[#006EA8]">{label}</p>
      <div className="flex items-start gap-3">
        {displaySrc ? (
          <div
            className="relative flex-shrink-0 rounded-lg overflow-hidden border border-[#E5E7EB]"
            style={previewStyle}
          >
            <Image src={displaySrc} alt={label} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div
            className="flex flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#78A3BE] bg-white"
            style={previewStyle}
          >
            <Upload className="h-6 w-6 text-[#78A3BE]" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#006EA8] px-3 py-1.5 text-sm font-medium text-[#006EA8] hover:bg-[#006EA8]/10 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {displaySrc ? "تغيير" : "رفع صورة"}
          </button>
          {(preview || file) && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <X className="h-3 w-3" />
              إزالة
            </button>
          )}
          {file && (
            <p className="text-xs text-[#6B7280] truncate max-w-[160px]">{file.name}</p>
          )}
        </div>
      </div>
      <p className="text-[11px] font-medium text-[#006EA8]">
        {tMedia("aspectRatio", { ratio: aspectRatio })}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Upload image file"
        title="Upload image file"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminAboutPanel({
  content,
  locale,
}: {
  content: AboutPageContent | null
  locale: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"main" | "second" | "features">("main")
  const [editLocale, setEditLocale] = useState<LocaleKey>((locale as LocaleKey) || "ar")

  // Extract all locales data (sent from server for admin editing)
  const allLocalesContent = (content as any)?.__allLocales

  // Initialize forms for each locale
  const [translations, setTranslations] = useState<Record<LocaleKey, { main: MainFormState; second: SecondFormState; features: FeatureForm[] }>>(
    () => ({
      ar: {
        main: mapContentToMainForm(allLocalesContent?.["ar"] ?? content),
        second: mapContentToSecondForm(allLocalesContent?.["ar"] ?? content),
        features: mapFeaturesToForm((allLocalesContent?.["ar"] ?? content)?.features ?? []),
      },
      en: {
        main: mapContentToMainForm(allLocalesContent?.["en"] ?? content),
        second: mapContentToSecondForm(allLocalesContent?.["en"] ?? content),
        features: mapFeaturesToForm((allLocalesContent?.["en"] ?? content)?.features ?? []),
      },
      de: {
        main: mapContentToMainForm(allLocalesContent?.["de"] ?? content),
        second: mapContentToSecondForm(allLocalesContent?.["de"] ?? content),
        features: mapFeaturesToForm((allLocalesContent?.["de"] ?? content)?.features ?? []),
      },
    })
  )

  const currentTranslation = translations[editLocale]

  // Image files
  const [primaryImage, setPrimaryImage] = useState<File | null>(null)
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null)
  const [secondaryImage, setSecondaryImage] = useState<File | null>(null)
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null)

  // Video file (must be a file, not a URL string)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const isRTL = locale === "ar"

  function updateMainForm(updates: Partial<MainFormState>) {
    setTranslations(prev => ({
      ...prev,
      [editLocale]: { ...prev[editLocale], main: { ...prev[editLocale].main, ...updates } }
    }))
  }

  function updateSecondForm(updates: Partial<SecondFormState>) {
    setTranslations(prev => ({
      ...prev,
      [editLocale]: { ...prev[editLocale], second: { ...prev[editLocale].second, ...updates } }
    }))
  }

  function updateFeatures(features: FeatureForm[]) {
    setTranslations(prev => ({
      ...prev,
      [editLocale]: { ...prev[editLocale], features }
    }))
  }

  function handlePrimaryImage(f: File) {
    setPrimaryImage(f)
    setPrimaryPreview(URL.createObjectURL(f))
  }
  function handleSecondaryImage(f: File) {
    setSecondaryImage(f)
    setSecondaryPreview(URL.createObjectURL(f))
  }
  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setVideoFile(f)
    setVideoPreview(URL.createObjectURL(f))
  }

  // Features helpers
  function addFeature() {
    updateFeatures([
      ...currentTranslation.features,
      { title: emptyLocale(), description: emptyLocale() },
    ])
  }
  function removeFeature(idx: number) {
    updateFeatures(currentTranslation.features.filter((_, i) => i !== idx))
  }
  function updateFeatureField(idx: number, field: "title" | "description", lang: LocaleKey, value: string) {
    updateFeatures(
      currentTranslation.features.map((f, i) => 
        i === idx ? { ...f, [field]: { ...f[field], [lang]: value } } : f
      )
    )
  }

  function appendLocalized(fd: FormData, key: string, values: Record<LocaleKey, string>) {
    for (const lang of LOCALES) {
      const v = values[lang]?.trim()
      if (v) fd.append(`${key}[${lang}]`, v)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const fd = new FormData()

    // Collect all translations for each key
    for (const lang of LOCALES) {
      const trans = translations[lang]
      // Main section
      if (trans.main.title[lang]?.trim()) fd.append(`title[${lang}]`, trans.main.title[lang])
      if (trans.main.descriptionLeft[lang]?.trim()) fd.append(`description_left[${lang}]`, trans.main.descriptionLeft[lang])
      if (trans.main.descriptionRight[lang]?.trim()) fd.append(`description_right[${lang}]`, trans.main.descriptionRight[lang])
      // Second section
      if (trans.second.secondTitle[lang]?.trim()) fd.append(`second_title[${lang}]`, trans.second.secondTitle[lang])
      if (trans.second.secondDescription[lang]?.trim()) fd.append(`second_description[${lang}]`, trans.second.secondDescription[lang])
    }

    // Images - only file uploads (never URL strings to avoid "حقل video يجب أن يكون ملفًا")
    if (primaryImage) fd.append("image", primaryImage)
    if (secondaryImage) fd.append("second_image", secondaryImage)
    if (videoFile) fd.append("video", videoFile)

    // Features - use data from all locales
    const maxFeatures = Math.max(...LOCALES.map(lang => translations[lang].features.length))
    for (let idx = 0; idx < maxFeatures; idx++) {
      for (const lang of LOCALES) {
        const f = translations[lang].features[idx]
        if (!f) continue
        if (f.id) fd.append(`features[${idx}][id]`, String(f.id))
        if (f.title[lang]?.trim()) fd.append(`features[${idx}][title][${lang}]`, f.title[lang])
        if (f.description[lang]?.trim()) fd.append(`features[${idx}][description][${lang}]`, f.description[lang])
      }
    }

    startTransition(async () => {
      const result = await saveAboutAction(fd, locale)
      if (!result.ok) {
        setError(result.message ?? "تعذر الحفظ")
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  const tabClass = (tab: typeof activeTab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tab
      ? "border-b-2 border-[#006EA8] text-[#006EA8]"
      : "text-[#6B7280] hover:text-[#111827]"
    }`

  const localeTabClass = (loc: LocaleKey) =>
    `px-3 py-1.5 text-xs font-semibold rounded transition-colors ${editLocale === loc
      ? "bg-[#006EA8] text-white"
      : "bg-[#EBF5FB] text-[#006EA8] hover:bg-[#006EA8] hover:text-white"
    }`

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6"
    >
      {/* Language Selection Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-3">
        <label className="text-xs font-medium text-[#6B7280] self-center">{isRTL ? "اللغة:" : "Language:"}</label>
        {LOCALES.map((lang) => (
          <button
            key={lang}
            type="button"
            className={localeTabClass(lang)}
            onClick={() => setEditLocale(lang)}
            title={`Edit ${lang.toUpperCase()} translations`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
        <button type="button" className={tabClass("main")} onClick={() => setActiveTab("main")} title="Edit header section">
          {isRTL ? "عنوان الهيدر / وصف الهيدر" : "Header / Description"}
        </button>
        <button type="button" className={tabClass("second")} onClick={() => setActiveTab("second")} title="Edit second section">
          {isRTL ? "القسم الثاني" : "Second Section"}
        </button>
        <button type="button" className={tabClass("features")} onClick={() => setActiveTab("features")} title="Edit features">
          {isRTL ? `المزايا (${currentTranslation.features.length})` : `Features (${currentTranslation.features.length})`}
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          ✓ {isRTL ? "تم الحفظ بنجاح" : "Saved successfully"}
        </p>
      )}

      {/* ── TAB: Main ── */}
      {/* ── TAB: Main ── */}
      {activeTab === "main" && (
        <div className="space-y-5">
          <div className="space-y-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006EA8]">{editLocale.toUpperCase()}</p>
            <LocaleCard lang={editLocale} label={isRTL ? "العنوان" : "Title"}
              value={currentTranslation.main.title[editLocale]}
              onChange={(v) => updateMainForm({ title: { ...currentTranslation.main.title, [editLocale]: v } })}
            />
            <LocaleCard lang={editLocale} label={isRTL ? "الوصف الأيسر" : "Left Description"}
              value={currentTranslation.main.descriptionLeft[editLocale]} multiline
              onChange={(v) => updateMainForm({ descriptionLeft: { ...currentTranslation.main.descriptionLeft, [editLocale]: v } })}
            />
            <LocaleCard lang={editLocale} label={isRTL ? "الوصف الأيمن" : "Right Description"}
              value={currentTranslation.main.descriptionRight[editLocale]} multiline
              onChange={(v) => updateMainForm({ descriptionRight: { ...currentTranslation.main.descriptionRight, [editLocale]: v } })}
            />
          </div>

          <ImageUploadBox
            label={isRTL ? "الصورة الرئيسية" : "Primary Image"}
            file={primaryImage}
            preview={primaryPreview}
            existingUrl={content?.image}
            onFile={handlePrimaryImage}
            onClear={() => { setPrimaryImage(null); setPrimaryPreview(null) }}
            aspectRatio="21:9"
          />
        </div>
      )}

      {/* ── TAB: Second Section ── */}
      {activeTab === "second" && (
        <div className="space-y-5">
          <div className="space-y-3 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006EA8]">{editLocale.toUpperCase()}</p>
            <LocaleCard lang={editLocale} label={isRTL ? "عنوان القسم الثاني" : "Second Section Title"}
              value={currentTranslation.second.secondTitle[editLocale]}
              onChange={(v) => updateSecondForm({ secondTitle: { ...currentTranslation.second.secondTitle, [editLocale]: v } })}
            />
            <LocaleCard lang={editLocale} label={isRTL ? "وصف القسم الثاني" : "Second Section Description"}
              value={currentTranslation.second.secondDescription[editLocale]} multiline rows={4}
              onChange={(v) => updateSecondForm({ secondDescription: { ...currentTranslation.second.secondDescription, [editLocale]: v } })}
            />
          </div>

          {/* Secondary Image */}
          <ImageUploadBox
            label={isRTL ? "صورة القسم الثاني" : "Second Section Image"}
            file={secondaryImage}
            preview={secondaryPreview}
            existingUrl={content?.secondImage}
            onFile={handleSecondaryImage}
            onClear={() => { setSecondaryImage(null); setSecondaryPreview(null) }}
            aspectRatio="4:3"
          />

          {/* Video Upload - MUST be a file, NOT a URL string */}
          <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006EA8]">
              {isRTL ? "الفيديو (ملف مرفوع فقط)" : "Video (File Upload Only)"}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {isRTL
                ? "⚠️ يجب رفع الفيديو كملف وليس رابط URL. الـ API يقبل ملفات الفيديو فقط."
                : "⚠️ Video must be uploaded as a file, not a URL. The API only accepts file uploads."}
            </p>
            {videoPreview || content?.video ? (
              <div className="space-y-2">
                <video
                  src={videoPreview || content?.video || ""}
                  controls
                  className="w-full max-h-48 rounded-lg border border-[#E5E7EB] bg-black"
                />
                {videoFile && (
                  <p className="text-xs text-[#6B7280]">{videoFile.name}</p>
                )}
              </div>
            ) : (
              <div
                className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#78A3BE] bg-white transition-colors hover:border-[#006EA8]"
                onClick={() => videoInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-[#78A3BE]" />
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {isRTL ? "اضغط لرفع فيديو (MP4, WebM)" : "Click to upload video (MP4, WebM)"}
                </p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#006EA8] px-3 py-1.5 text-sm font-medium text-[#006EA8] hover:bg-[#006EA8]/10 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {videoFile ? (isRTL ? "تغيير الفيديو" : "Change Video") : (isRTL ? "رفع فيديو" : "Upload Video")}
              </button>
              {videoFile && (
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setVideoPreview(null) }}
                  className="text-xs text-red-500 hover:underline"
                >
                  {isRTL ? "إزالة" : "Remove"}
                </button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*,video/mp4,video/webm"
              className="hidden"
              aria-label="Upload video file"
              title="Upload video file"
              onChange={handleVideoFile}
            />
          </div>
        </div>
      )}

      {/* ── TAB: Features ── */}
      {activeTab === "features" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">
              {isRTL ? "أضف أو عدّل مزايا صفحة من نحن" : "Add or edit About page features"}
            </p>
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center gap-2 rounded-lg bg-[#006EA8] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#005685] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {isRTL ? "إضافة ميزة" : "Add Feature"}
            </button>
          </div>

          {currentTranslation.features.length === 0 && (
            <p className="rounded-lg bg-[#F9FAFB] py-8 text-center text-sm text-[#9CA3AF]">
              {isRTL ? "لا توجد مزايا. اضغط \"إضافة ميزة\" للبدء." : "No features. Click \"Add Feature\" to start."}
            </p>
          )}

          <div className="space-y-4">
            {currentTranslation.features.map((feature, idx) => (
              <FeatureCard
                key={feature.id ?? `new-${idx}`}
                feature={feature}
                idx={idx}
                isRTL={isRTL}
                editLocale={editLocale}
                onUpdate={(field, val) => updateFeatureField(idx, field, editLocale, val)}
                onRemove={() => removeFeature(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-wrap gap-3 border-t border-[#E5E7EB] pt-4">
        <PrimaryButton type="submit" disabled={pending} className="h-10 rounded-lg px-6 text-sm">
          {pending ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ التغييرات" : "Save Changes")}
        </PrimaryButton>
      </div>
    </form>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  feature, idx, isRTL, editLocale, onUpdate, onRemove,
}: {
  feature: FeatureForm; idx: number; isRTL: boolean; editLocale: LocaleKey
  onUpdate: (field: "title" | "description", val: string) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(true)
  const previewTitle = feature.title.ar || feature.title.en || `ميزة #${idx + 1}`

  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2 text-start" title="Toggle feature details">
          <span className="rounded bg-[#EAF4FB] px-1.5 py-0.5 text-xs font-bold text-[#006EA8]">
            #{idx + 1}
            {feature.id ? ` · ID:${feature.id}` : ` · ${isRTL ? "جديدة" : "New"}`}
          </span>
          <span className="truncate text-sm font-semibold text-[#111827]">{previewTitle}</span>
          {open ? <ChevronUp className="ms-auto h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="ms-auto h-4 w-4 text-[#9CA3AF]" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Remove feature"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="p-4">
          <div className="space-y-2 rounded border bg-white p-3">
            <span className="rounded bg-[#EAF4FB] px-1.5 py-0.5 text-xs font-bold text-[#006EA8]">
              {editLocale.toUpperCase()}
            </span>
            <input
              type="text"
              placeholder={isRTL ? "العنوان" : "Title"}
              value={feature.title[editLocale]}
              onChange={(e) => onUpdate("title", e.target.value)}
              dir={editLocale === "ar" ? "rtl" : "ltr"}
              className="mt-1 w-full rounded border border-[#E5E7EB] px-2 py-1.5 text-sm focus:border-[#006EA8] focus:outline-none"
            />
            <RichTextEditor
              key={`feature-${feature.id ?? idx}-${editLocale}`}
              value={feature.description[editLocale]}
              onChange={(v) => onUpdate("description", v)}
              placeholder={isRTL ? "الوصف" : "Description"}
              dir={editLocale === "ar" ? "rtl" : "ltr"}
              minHeight="72px"
              className="mt-0 rounded border"
            />
          </div>
        </div>
      )}
    </div>
  )
}
