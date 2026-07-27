"use client"

import { useState, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import type { SiteSetting } from "@/lib/api/services/settings.service"
import { saveSettingAction, saveLegalDocumentAction } from "@/features/admin/actions/admin-actions"
import {
  allLegalLocaleSettingKeys,
  parseLegalDocumentFromSettings,
} from "@/features/legal/lib/legal-setting-keys"
import { PrimaryButton } from "@/components/ui/primary-button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Settings, PhoneCall, Share2, BarChart3, Globe, Save, HelpCircle, FileText } from "lucide-react"

const LOCALE_TABS = ["ar", "en", "de"] as const
type LocaleTab = (typeof LOCALE_TABS)[number]

export function AdminSettingsPanel({
  settings,
  locale,
}: {
  settings: SiteSetting[]
  locale: string
}) {
  const isRTL = locale === "ar"
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 1. Helper to find a setting value
  const getSettingValue = (key: string, fallback = ""): string => {
    const s = settings.find((item) => item.key === key)
    if (!s) return fallback
    if (typeof s.value === "string") return s.value
    if (typeof s.value === "object" && s.value) return JSON.stringify(s.value)
    return String(s.value ?? fallback)
  }

  // Helper for footer_description (JSON object containing { ar, en, de })
  const getFooterDescription = () => {
    const val = settings.find((item) => item.key === "footer_description")?.value
    let ar = ""
    let en = ""
    let de = ""
    if (val) {
      if (typeof val === "object" && val !== null) {
        const obj = val as Record<string, string>
        ar = obj.ar || ""
        en = obj.en || ""
        de = obj.de || ""
      } else if (typeof val === "string") {
        try {
          const obj = JSON.parse(val)
          ar = obj.ar || ""
          en = obj.en || ""
          de = obj.de || ""
        } catch {
          ar = val
          en = val
          de = val
        }
      }
    }
    return { ar, en, de }
  }



  // Helper for title/content legal settings (per-locale keys or legacy monolithic JSON)
  const getLegalDocument = (key: string) => parseLegalDocumentFromSettings(settings, key)

  // 2. Component States (General, Contact, Socials, Hero Stats)
  const footerDescInit = getFooterDescription()
  const [generalState, setGeneralState] = useState({
    appName: getSettingValue("app_name", "TSC-Jobs"),
    logo: getSettingValue("logo", ""),
    footerDescAr: footerDescInit.ar,
    footerDescEn: footerDescInit.en,
    footerDescDe: footerDescInit.de,
  })

  const [contactState, setContactState] = useState({
    phone: getSettingValue("contact_phone", ""),
    email: getSettingValue("contact_email", ""),
    address: getSettingValue("contact_address", ""),
    latitude: getSettingValue("contact_latitude", "52.5200"),
    longitude: getSettingValue("contact_longitude", "13.4050"),
    googleMapsApiKey: getSettingValue("google_maps_api_key", ""),
  })

  const [socialsState, setSocialsState] = useState({
    telegram: getSettingValue("telegram_url", ""),
    youtube: getSettingValue("youtube_url", ""),
    facebook: getSettingValue("facebook_url", ""),
    linkedin: getSettingValue("linkedin_url", ""),
    twitter: getSettingValue("twitter_url", ""),
  })

  const defaultLocaleTab: LocaleTab = LOCALE_TABS.includes(locale as LocaleTab) ? (locale as LocaleTab) : "ar"

  const termsInit = getLegalDocument("terms_of_service")
  const [termsState, setTermsState] = useState(termsInit)
  const [termsLocale, setTermsLocale] = useState<LocaleTab>(defaultLocaleTab)

  const privacyInit = getLegalDocument("privacy_policy")
  const [privacyState, setPrivacyState] = useState(privacyInit)
  const [privacyLocale, setPrivacyLocale] = useState<LocaleTab>(defaultLocaleTab)

  const legalInfoInit = getLegalDocument("legal_information")
  const [legalInfoState, setLegalInfoState] = useState(legalInfoInit)
  const [legalInfoLocale, setLegalInfoLocale] = useState<LocaleTab>(defaultLocaleTab)



  // 3. For any unrecognized settings
  const knownKeys = [
    "app_name",
    "logo",
    "footer_description",
    "contact_phone",
    "contact_email",
    "contact_address",
    "contact_latitude",
    "contact_longitude",
    "google_maps_api_key",
    "telegram_url",
    "youtube_url",
    "facebook_url",
    "linkedin_url",
    "twitter_url",
    "hero_stats",
    "terms_of_service",
    "privacy_policy",
    "legal_information",
    ...allLegalLocaleSettingKeys("terms_of_service"),
    ...allLegalLocaleSettingKeys("privacy_policy"),
    ...allLegalLocaleSettingKeys("legal_information"),
  ]
  const otherSettings = settings.filter((s) => !knownKeys.includes(s.key))
  const [editingOtherKey, setEditingOtherKey] = useState<string | null>(null)
  const [otherValue, setOtherValue] = useState("")

  const termsTitleKey = termsLocale === "ar" ? "titleAr" : termsLocale === "en" ? "titleEn" : "titleDe"
  const termsContentKey = termsLocale === "ar" ? "contentAr" : termsLocale === "en" ? "contentEn" : "contentDe"
  const termsTitleValue = termsState[termsTitleKey]
  const termsContentValue = termsState[termsContentKey]
  const setTermsTitle = (v: string) => setTermsState((prev) => ({ ...prev, [termsTitleKey]: v }))
  const setTermsContent = (v: string) => setTermsState((prev) => ({ ...prev, [termsContentKey]: v }))

  const privacyTitleKey = privacyLocale === "ar" ? "titleAr" : privacyLocale === "en" ? "titleEn" : "titleDe"
  const privacyContentKey = privacyLocale === "ar" ? "contentAr" : privacyLocale === "en" ? "contentEn" : "contentDe"
  const privacyTitleValue = privacyState[privacyTitleKey]
  const privacyContentValue = privacyState[privacyContentKey]
  const setPrivacyTitle = (v: string) => setPrivacyState((prev) => ({ ...prev, [privacyTitleKey]: v }))
  const setPrivacyContent = (v: string) => setPrivacyState((prev) => ({ ...prev, [privacyContentKey]: v }))

  const legalInfoTitleKey = legalInfoLocale === "ar" ? "titleAr" : legalInfoLocale === "en" ? "titleEn" : "titleDe"
  const legalInfoContentKey = legalInfoLocale === "ar" ? "contentAr" : legalInfoLocale === "en" ? "contentEn" : "contentDe"
  const legalInfoTitleValue = legalInfoState[legalInfoTitleKey]
  const legalInfoContentValue = legalInfoState[legalInfoContentKey]
  const setLegalInfoTitle = (v: string) => setLegalInfoState((prev) => ({ ...prev, [legalInfoTitleKey]: v }))
  const setLegalInfoContent = (v: string) => setLegalInfoState((prev) => ({ ...prev, [legalInfoContentKey]: v }))

  // 4. Save functions
  function saveGeneral(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const r1 = await saveSettingAction(
          "app_name",
          { value: generalState.appName, type: "string", is_public: "1" },
          locale
        )

        const r2 = await saveSettingAction(
          "logo",
          { value: generalState.logo, type: "string", is_public: "1" },
          locale
        )

        const r3 = await saveSettingAction(
          "footer_description",
          {
            value: JSON.stringify({
              ar: generalState.footerDescAr,
              en: generalState.footerDescEn,
              de: generalState.footerDescDe,
            }),
            type: "json",
            is_public: "1",
          },
          locale
        )

        if (!r1.ok || !r2.ok || !r3.ok) {
          setError(isRTL ? "فشل في حفظ بعض الإعدادات العامة" : "Failed to save some general settings")
        } else {
          setSuccess(isRTL ? "تم حفظ الإعدادات العامة بنجاح" : "General settings saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  function saveContact(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const keys = [
          { k: "contact_phone", v: contactState.phone, type: "string" },
          { k: "contact_email", v: contactState.email, type: "string" },
          { k: "contact_address", v: contactState.address, type: "string" },
          { k: "contact_latitude", v: contactState.latitude, type: "string" },
          { k: "contact_longitude", v: contactState.longitude, type: "string" },
          { k: "google_maps_api_key", v: contactState.googleMapsApiKey, type: "string" },
        ]

        let ok = true
        for (const item of keys) {
          const res = await saveSettingAction(
            item.k,
            { value: item.v, type: item.type, is_public: "1" },
            locale
          )
          if (!res.ok) ok = false
        }

        if (!ok) {
          setError(isRTL ? "فشل في حفظ بعض معلومات الاتصال" : "Failed to save some contact settings")
        } else {
          setSuccess(isRTL ? "تم حفظ معلومات الاتصال بنجاح" : "Contact details saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  function saveSocials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const keys = [
          { k: "telegram_url",  v: socialsState.telegram },
          { k: "youtube_url",   v: socialsState.youtube },
          { k: "facebook_url",  v: socialsState.facebook },
          { k: "linkedin_url",  v: socialsState.linkedin },
          { k: "twitter_url",   v: socialsState.twitter },
        ]

        let ok = true
        for (const item of keys) {
          const res = await saveSettingAction(
            item.k,
            { value: item.v, type: "string", is_public: "1" },
            locale
          )
          if (!res.ok) ok = false
        }

        if (!ok) {
          setError(isRTL ? "فشل في حفظ بعض الروابط الاجتماعية" : "Failed to save some social links")
        } else {
          setSuccess(isRTL ? "تم حفظ روابط التواصل الاجتماعي بنجاح" : "Social media links saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }



  function saveTerms(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await saveLegalDocumentAction("terms_of_service", termsState, locale)

        if (!res.ok) {
          setError(
            res.message ||
              (isRTL ? "فشل في حفظ شروط الخدمة" : "Failed to save Terms of Service")
          )
        } else {
          setSuccess(isRTL ? "تم حفظ شروط الخدمة بنجاح" : "Terms of Service saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  function savePrivacy(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await saveLegalDocumentAction("privacy_policy", privacyState, locale)

        if (!res.ok) {
          setError(
            res.message ||
              (isRTL ? "فشل في حفظ سياسة الخصوصية" : "Failed to save Privacy Policy")
          )
        } else {
          setSuccess(isRTL ? "تم حفظ سياسة الخصوصية بنجاح" : "Privacy Policy saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  function saveLegalInfo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await saveLegalDocumentAction("legal_information", legalInfoState, locale)

        if (!res.ok) {
          setError(
            res.message ||
              (isRTL ? "فشل في حفظ البيانات القانونية" : "Failed to save Legal Information")
          )
        } else {
          setSuccess(isRTL ? "تم حفظ البيانات القانونية بنجاح" : "Legal Information saved successfully")
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  function saveOther(key: string) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await saveSettingAction(
          key,
          { value: otherValue, type: "string", is_public: "1" },
          locale
        )

        if (!res.ok) {
          setError(
            res.message ||
              (isRTL ? `فشل حفظ الإعداد: ${key}` : `Failed to save setting: ${key}`)
          )
        } else {
          setSuccess(isRTL ? "تم حفظ الإعداد بنجاح" : "Setting saved successfully")
          setEditingOtherKey(null)
          router.refresh()
        }
      } catch (err) {
        setError(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
      }
    })
  }

  return (
    <div className="space-y-6 pb-12 text-start">
      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: General Settings */}
        <form onSubmit={saveGeneral} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <Settings className="h-5 w-5 text-[#006EA8]" />
              <h3 className="font-bold text-[#111827]">{isRTL ? "الإعدادات العامة" : "General Settings"}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  {isRTL ? "اسم التطبيق / الموقع" : "App Name"}
                </label>
                <input
                  type="text"
                  value={generalState.appName}
                  onChange={(e) => setGeneralState((prev) => ({ ...prev, appName: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  {isRTL ? "رابط الشعار (Logo URL)" : "Logo URL"}
                </label>
                <input
                  type="text"
                  value={generalState.logo}
                  onChange={(e) => setGeneralState((prev) => ({ ...prev, logo: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                />
              </div>

              <div className="border-t pt-3 mt-2 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  {isRTL ? "وصف الفوتر (متعدد اللغات)" : "Footer Description (Multilingual)"}
                </span>

                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1">العربية (AR)</label>
                  <textarea
                    rows={2}
                    value={generalState.footerDescAr}
                    onChange={(e) => setGeneralState((prev) => ({ ...prev, footerDescAr: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1">English (EN)</label>
                  <textarea
                    rows={2}
                    value={generalState.footerDescEn}
                    onChange={(e) => setGeneralState((prev) => ({ ...prev, footerDescEn: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1">Deutsch (DE)</label>
                  <textarea
                    rows={2}
                    value={generalState.footerDescDe}
                    onChange={(e) => setGeneralState((prev) => ({ ...prev, footerDescDe: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
            <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
              <Save className="h-4 w-4 me-2" />
              {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
            </PrimaryButton>
          </div>
        </form>

        {/* Card 2: Contact Details */}
        <form onSubmit={saveContact} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <PhoneCall className="h-5 w-5 text-[#006EA8]" />
              <h3 className="font-bold text-[#111827]">{isRTL ? "معلومات الاتصال والموقع" : "Contact & Location Info"}</h3>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    {isRTL ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    type="text"
                    value={contactState.phone}
                    onChange={(e) => setContactState((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    {isRTL ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={contactState.email}
                    onChange={(e) => setContactState((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  {isRTL ? "العنوان بالكامل" : "Physical Address"}
                </label>
                <input
                  type="text"
                  value={contactState.address}
                  onChange={(e) => setContactState((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    {isRTL ? "خط العرض (Latitude)" : "Latitude"}
                  </label>
                  <input
                    type="text"
                    value={contactState.latitude}
                    onChange={(e) => setContactState((prev) => ({ ...prev, latitude: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    {isRTL ? "خط الطول (Longitude)" : "Longitude"}
                  </label>
                  <input
                    type="text"
                    value={contactState.longitude}
                    onChange={(e) => setContactState((prev) => ({ ...prev, longitude: e.target.value }))}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  {isRTL ? "مفتاح خرائط جوجل (Google Maps API Key)" : "Google Maps API Key"}
                </label>
                <input
                  type="text"
                  value={contactState.googleMapsApiKey}
                  onChange={(e) => setContactState((prev) => ({ ...prev, googleMapsApiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
            <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
              <Save className="h-4 w-4 me-2" />
              {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
            </PrimaryButton>
          </div>
        </form>

        {/* Card 3: Social Media Links */}
        <form onSubmit={saveSocials} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <Share2 className="h-5 w-5 text-[#006EA8]" />
              <h3 className="font-bold text-[#111827]">{isRTL ? "روابط التواصل الاجتماعي" : "Social Media Links"}</h3>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Telegram URL</label>
                  <input
                    type="url"
                    value={socialsState.telegram}
                    onChange={(e) => setSocialsState((prev) => ({ ...prev, telegram: e.target.value }))}
                    placeholder="https://t.me/..."
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={socialsState.youtube}
                    onChange={(e) => setSocialsState((prev) => ({ ...prev, youtube: e.target.value }))}
                    placeholder="https://youtube.com/@..."
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={socialsState.facebook}
                    onChange={(e) => setSocialsState((prev) => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={socialsState.linkedin}
                    onChange={(e) => setSocialsState((prev) => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">X (Twitter) URL</label>
                <input
                  type="url"
                  value={socialsState.twitter}
                  onChange={(e) => setSocialsState((prev) => ({ ...prev, twitter: e.target.value }))}
                  placeholder="https://x.com/..."
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
            <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
              <Save className="h-4 w-4 me-2" />
              {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
            </PrimaryButton>
          </div>
        </form>


      </div>

      {/* Card 4: Terms of Service */}
      <form onSubmit={saveTerms} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-5">
          <FileText className="h-5 w-5 text-[#006EA8]" />
          <h3 className="font-bold text-[#111827]">{isRTL ? "شروط الخدمة والأحكام" : "Terms of Service"}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6B7280]">{isRTL ? "اللغة" : "Language"}</label>
            {LOCALE_TABS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setTermsLocale(loc)}
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  termsLocale === loc ? "bg-[#006EA8] text-white" : "bg-[#EBF5FB] text-[#006EA8]"
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "العنوان" : "Title"}
            </label>
            <input
              type="text"
              dir={termsLocale === "ar" ? "rtl" : "ltr"}
              value={termsTitleValue}
              onChange={(e) => setTermsTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "المحتوى" : "Content"}
            </label>
            <RichTextEditor
              key={`terms-content-${termsLocale}`}
              value={termsContentValue}
              onChange={setTermsContent}
              dir={termsLocale === "ar" ? "rtl" : "ltr"}
              minHeight="280px"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
          <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
            <Save className="h-4 w-4 me-2" />
            {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
          </PrimaryButton>
        </div>
      </form>

      {/* Card 5: Privacy Policy */}
      <form onSubmit={savePrivacy} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-5">
          <FileText className="h-5 w-5 text-[#006EA8]" />
          <h3 className="font-bold text-[#111827]">{isRTL ? "سياسة الخصوصية" : "Privacy Policy"}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6B7280]">{isRTL ? "اللغة" : "Language"}</label>
            {LOCALE_TABS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setPrivacyLocale(loc)}
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  privacyLocale === loc ? "bg-[#006EA8] text-white" : "bg-[#EBF5FB] text-[#006EA8]"
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "العنوان" : "Title"}
            </label>
            <input
              type="text"
              dir={privacyLocale === "ar" ? "rtl" : "ltr"}
              value={privacyTitleValue}
              onChange={(e) => setPrivacyTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "المحتوى" : "Content"}
            </label>
            <RichTextEditor
              key={`privacy-content-${privacyLocale}`}
              value={privacyContentValue}
              onChange={setPrivacyContent}
              dir={privacyLocale === "ar" ? "rtl" : "ltr"}
              minHeight="280px"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
          <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
            <Save className="h-4 w-4 me-2" />
            {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
          </PrimaryButton>
        </div>
      </form>

      {/* Card 6: Legal Information */}
      <form onSubmit={saveLegalInfo} className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-5">
          <FileText className="h-5 w-5 text-[#006EA8]" />
          <h3 className="font-bold text-[#111827]">{isRTL ? "البيانات القانونية" : "Legal Information"}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6B7280]">{isRTL ? "اللغة" : "Language"}</label>
            {LOCALE_TABS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLegalInfoLocale(loc)}
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  legalInfoLocale === loc ? "bg-[#006EA8] text-white" : "bg-[#EBF5FB] text-[#006EA8]"
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "العنوان" : "Title"}
            </label>
            <input
              type="text"
              dir={legalInfoLocale === "ar" ? "rtl" : "ltr"}
              value={legalInfoTitleValue}
              onChange={(e) => setLegalInfoTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8] bg-white text-[#111827]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              {isRTL ? "المحتوى" : "Content"}
            </label>
            <RichTextEditor
              key={`legal-info-content-${legalInfoLocale}`}
              value={legalInfoContentValue}
              onChange={setLegalInfoContent}
              dir={legalInfoLocale === "ar" ? "rtl" : "ltr"}
              minHeight="280px"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4 mt-6">
          <PrimaryButton type="submit" disabled={pending} className="h-9 px-4 text-xs">
            <Save className="h-4 w-4 me-2" />
            {pending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التعديلات" : "Save Changes")}
          </PrimaryButton>
        </div>
      </form>

      {/* Card 7: Other Settings (if any exist) */}
      {otherSettings.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-4">
            <Globe className="h-5 w-5 text-[#006EA8]" />
            <h3 className="font-bold text-[#111827]">{isRTL ? "إعدادات أخرى للنظام" : "Other System Settings"}</h3>
          </div>

          <div className="space-y-4">
            {otherSettings.map((s) => (
              <div key={s.key} className="rounded-lg border border-[#E5E7EB] p-4 bg-[#F9FAFB] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-[#111827]">{s.key}</span>
                    {s.label && <span className="block text-xs text-[#6B7280]">{s.label}</span>}
                  </div>
                  {editingOtherKey !== s.key ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOtherKey(s.key)
                        setOtherValue(typeof s.value === "object" ? JSON.stringify(s.value, null, 2) : String(s.value ?? ""))
                      }}
                      className="text-xs font-semibold text-[#006EA8] hover:underline"
                    >
                      {isRTL ? "تعديل" : "Edit"}
                    </button>
                  ) : null}
                </div>

                {editingOtherKey === s.key ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={otherValue}
                      onChange={(e) => setOtherValue(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 font-mono text-xs focus:border-[#006EA8] focus:outline-none focus:ring-1 focus:ring-[#006EA8]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveOther(s.key)}
                        disabled={pending}
                        className="rounded-lg bg-[#006EA8] px-3 py-1 text-xs font-semibold text-white hover:bg-[#005685] disabled:opacity-60"
                      >
                        {pending ? (isRTL ? "حفظ..." : "Saving...") : (isRTL ? "حفظ" : "Save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOtherKey(null)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {isRTL ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="max-h-24 overflow-auto rounded border bg-white p-2 font-mono text-xs text-[#525252]">
                    {typeof s.value === "object" ? JSON.stringify(s.value, null, 2) : String(s.value ?? "")}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
