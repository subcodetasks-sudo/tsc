"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { COUNTRIES } from "@/lib/countries"
import { invalidateSessionCache, updateSessionUser } from "@/hooks/use-auth"
import { PrimaryButton } from "@/components/ui/primary-button"
import { resolveImageUrl } from "@/lib/utils"
import { User as UserIcon, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { compressImageFile } from "@/lib/images/compress-image"
import { ImageDownloadButton } from "@/components/image-download-button"

type Props = {
  locale: string
  initialProfile?: Record<string, any>
}

type Category = { id: number; name: string; sub_categories?: { id: number; name: string }[] }
type Country = { id: number; name: string; code?: string; flag?: string; dialCode?: string }

const fieldBase =
  "w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#525252] bg-transparent outline-none transition-colors focus:border-[#40A0CA] placeholder:text-[#A3A3A3]"

const selectBase =
  "w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#525252] bg-transparent outline-none transition-colors focus:border-[#40A0CA] appearance-none cursor-pointer"

const formatDateForInput = (dobString: any) => {
  if (!dobString || typeof dobString !== "string") return ""
  const match = dobString.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ""
}

export default function UserProfileClient({ locale, initialProfile }: Props) {
  const isAr = locale === "ar"
  const isDe = locale === "de"

  const getInitialPhoneDetails = (fullPhone: string) => {
    let parsedPhone = fullPhone || ""
    let parsedDial = "+20"
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    for (const c of sortedCountries) {
      if (parsedPhone.startsWith(c.dialCode)) {
        parsedDial = c.dialCode
        parsedPhone = parsedPhone.slice(c.dialCode.length)
        break
      }
    }
    return { phone_raw: parsedPhone, phone_code: parsedDial }
  }

  const initialPhone = getInitialPhoneDetails(initialProfile?.phone || "")

  const [profile, setProfile] = useState<Record<string, any>>(() => {
    if (initialProfile) {
      return {
        ...initialProfile,
        phone_raw: initialPhone.phone_raw,
        phone_code: initialPhone.phone_code,
        dob: formatDateForInput(initialProfile.dob),
      }
    }
    return {
      first_name: "",
      last_name: "",
      email: "",
      phone_raw: "",
      phone_code: "+20",
      gender: "",
      dob: "",
      country_id: "",
      category_id: "",
      sub_category_id: "",
      avatar: "",
      facebook: "",
      linkedin: "",
      twitter: "",
      pinterest: "",
      locale: "",
    }
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar ?? null)
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [activeSocial, setActiveSocial] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const subCategories = useMemo(() => {
    if (profile.category_id && categories.length > 0) {
      const selectedCat = categories.find((c) => Number(c.id) === Number(profile.category_id))
      if (selectedCat && Array.isArray(selectedCat.sub_categories)) {
        return selectedCat.sub_categories
      }
    }
    return [] as { id: number; name: string }[]
  }, [profile.category_id, categories])
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      if (initialProfile) return
      setFetching(true)
      try {
        const res = await fetch("/api/auth/profile", { headers: { "x-locale": locale } })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || (isAr ? "فشل جلب البيانات" : (isDe ? "Daten konnten nicht geladen werden" : "Failed to fetch profile data")))
        if (!mounted) return
        const p: any = data.data || {}
        const userProfile = p.Userprofile || {}

        let firstName = userProfile.firstName || ""
        let lastName = userProfile.lastName || ""
        if (!firstName && !lastName && p.name) {
          const parts = (p.name || "").split(" ")
          firstName = parts.shift() || ""
          lastName = parts.join(" ") || ""
        }

        const categoryId = userProfile.categoryId || p.category?.id || undefined
        const subcategoryId = userProfile.subcategoryId || p.sub_category?.id || undefined
        const phoneDetails = getInitialPhoneDetails(p.phone || "")

        setProfile({
          first_name: firstName,
          last_name: lastName,
          email: p.email || "",
          phone_raw: phoneDetails.phone_raw,
          phone_code: phoneDetails.phone_code,
          gender: userProfile.gender || p.gender || "",
          dob: formatDateForInput(userProfile.dateOfBirth || p.dob || ""),
          country_id: p.country?.id ?? p.country_id,
          category_id: categoryId,
          sub_category_id: subcategoryId,
          avatar: p.avatar || "",
          facebook: userProfile.facebook || p.facebook || "",
          linkedin: userProfile.linkedin || p.linkedin || "",
          twitter: userProfile.twitterX || p.twitter || "",
          pinterest: userProfile.pinterest || p.pinterest || "",
          locale: p.locale || p.preferences?.locale || "",
        })
        setAvatarPreview(p.avatar || null)
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setFetching(false)
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [initialProfile, locale])

  useEffect(() => {
    let mounted = true
    async function loadMeta() {
      try {
        const [cRes, cntRes] = await Promise.all([
          fetch(`/api/categories?locale=${locale}`).then((r) => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/countries?locale=${locale}`).then((r) => r.json()).catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setCategories(Array.isArray(cRes?.data) ? cRes.data : [])
        setCountries(Array.isArray(cntRes?.data) ? cntRes.data : [])
      } catch (err) {
        // ignore
      }
    }
    loadMeta()
    return () => { mounted = false }
  }, [locale])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "category") {
      const id = Number(value) || undefined
      setProfile((s) => ({ ...s, category_id: id, sub_category_id: undefined }))
      return
    }
    if (name === "sub_category") {
      const id = Number(value) || undefined
      setProfile((s) => ({ ...s, sub_category_id: id }))
      return
    }
    if (name === "country") {
      const id = Number(value) || undefined
      const selected = countries.find((c) => Number(c.id) === Number(id))
      const dialCode = selected?.code || selected?.dialCode || "+20"
      setProfile((s) => ({ ...s, country_id: id, phone_code: dialCode }))
      return
    }
    setProfile((s) => ({ ...s, [name]: value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      let compressedFile: File = file
      try {
        compressedFile = await compressImageFile(file)
      } catch (error) {
        console.warn("Avatar compression failed, using original file", error)
      }
      setAvatarFile(compressedFile)
      setAvatarPreview(URL.createObjectURL(compressedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      // 1. Update password if present
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error(isAr ? "كلمتا المرور غير متطابقتين" : (isDe ? "Passwörter stimmen nicht überein" : "Passwords do not match"))
        }
        if (!currentPassword) {
          throw new Error(isAr ? "يجب إدخال كلمة المرور الحالية" : (isDe ? "Aktuelles Passwort ist erforderlich" : "Current password is required"))
        }
        const passRes = await fetch("/api/auth/profile/password", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept-Language": locale },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword,
          })
        })
        const passData = await passRes.json()
        if (!passRes.ok) {
          throw new Error(passData.message || (isAr ? "فشل تحديث كلمة المرور" : (isDe ? "Passwort konnte nicht aktualisiert werden" : "Failed to update password")))
        }
      }

      // 2. Upload avatar if present
      let uploadedAvatarUrl = ""
      if (avatarFile) {
        const avatarFd = new FormData()
        avatarFd.append("avatar", avatarFile)
        const avatarRes = await fetch("/api/auth/profile/avatar", {
          method: "POST",
          body: avatarFd,
          headers: { "Accept-Language": locale, "x-locale": locale },
        })
        const avatarData = await avatarRes.json()
        if (!avatarRes.ok) {
          throw new Error(avatarData.message || (isAr ? "فشل حفظ الصورة الشخصية" : (isDe ? "Profilbild konnte nicht gespeichert werden" : "Failed to save avatar image")))
        }
        const updatedObj = avatarData.data || avatarData
        uploadedAvatarUrl = updatedObj.avatar || updatedObj.avatar_url || ""
      }

      // 3. Update general profile info
      const form = new FormData()
      form.append("first_name", profile.first_name || "")
      form.append("last_name", profile.last_name || "")
      form.append("email", profile.email || "")
      const fullPhone = `${profile.phone_code || "+20"}${profile.phone_raw || ""}`
      form.append("phone", fullPhone)
      form.append("gender", profile.gender || "")
      form.append("date_of_birth", profile.dob || "")
      if (profile.category_id) form.append("category_id", String(profile.category_id))
      if (profile.sub_category_id) form.append("subcategory_id", String(profile.sub_category_id))
      form.append("user_facebook", profile.facebook || "")
      form.append("user_linkedin", profile.linkedin || "")
      form.append("user_twitter_x", profile.twitter || "")
      form.append("user_pinterest", profile.pinterest || "")
      if (profile.country_id) form.append("country_id", String(profile.country_id))
      if (profile.locale) form.append("locale", profile.locale)

      const res = await fetch("/api/auth/profile", {
        method: "POST",
        body: form,
        headers: { "Accept-Language": locale, "x-locale": locale },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || (isAr ? "فشل حفظ البيانات" : (isDe ? "Daten konnten nicht gespeichert werden" : "Failed to save data")))

      const updatedUser: Record<string, unknown> = {}
      const userProfileObj = data.data?.Userprofile || data.data?.user_profile || data.data?.profile || {}
      const latestAvatar = uploadedAvatarUrl || data.data?.avatar || data.data?.avatar_url || userProfileObj.avatar || userProfileObj.avatar_url || userProfileObj.image
      const newName = data.data?.name || (data.data?.first_name ? `${data.data.first_name} ${data.data.last_name || ""}`.trim() : "") || data.data?.username

      if (latestAvatar) updatedUser.avatar = latestAvatar
      if (newName) updatedUser.name = newName
      if (Object.keys(updatedUser).length > 0) updateSessionUser(updatedUser)
      invalidateSessionCache()

      const msg = isAr ? "تم حفظ البيانات بنجاح" : (isDe ? "Erfolgreich gespeichert" : "Saved successfully")
      toast.success(msg)
      if (latestAvatar) setAvatarPreview(latestAvatar)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (isAr ? "فشل حفظ البيانات" : (isDe ? "Speichern fehlgeschlagen" : "Failed to save"))
      toast.error(errMsg)
    } finally {
      setSaving(false)
    }
  }

  const selectedDialCode = profile.phone_code || "+20"
  const activeDialObj = COUNTRIES.find((c) => c.dialCode === selectedDialCode) || COUNTRIES[0]

  // Social platforms config (labels always English)
  const socialPlatforms = [
    { key: "facebook", label: "Facebook", icon: "/Linked_accounts/Facebook.svg" },
    { key: "linkedin", label: "LinkedIn", icon: "/Linked_accounts/LinkedIn.svg" },
    { key: "twitter", label: "X", icon: "/Linked_accounts/X.svg" },
    { key: "pinterest", label: "Pinterest", icon: "/Linked_accounts/pinterest.svg" },
  ]

  return (
    <div className="w-full flex flex-col gap-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Hide native date picker across all browsers — our SVG is the trigger */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide default calendar indicator in Chrome, Safari, Edge, Opera */
        .custom-date-input::-webkit-calendar-picker-indicator {
          display: none !important;
          -webkit-appearance: none !important;
        }
        /* Hide default calendar indicator/styles in Firefox and other standard inputs */
        .custom-date-input {
          -moz-appearance: textfield !important;
          appearance: none !important;
        }
        .custom-date-input[type="date"]::-webkit-inner-spin-button,
        .custom-date-input[type="date"]::-webkit-clear-button {
          display: none !important;
          -webkit-appearance: none !important;
        }
        /* IE / Edge Legacy */
        .custom-date-input::-ms-clear,
        .custom-date-input::-ms-reveal {
          display: none !important;
        }
      `}} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==================== CARD: BASIC INFO ==================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          <div className="px-8 pt-8 pb-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="h-36 w-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#E0F2FE] flex items-center justify-center relative">
                  <UserIcon className="h-20 w-20 text-[#006EA8]" />
                  {avatarPreview && avatarPreview.trim() !== "" && (
                    <img
                      src={resolveImageUrl(avatarPreview)}
                      alt="avatar"
                      className="h-full w-full object-cover absolute inset-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0" }}
                    />
                  )}
                </div>
                <label className="absolute bottom-1 right-1 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105 bg-gradient-to-b from-[#006EA8] to-[#005685] z-10">
                  <Image src="/update.svg" alt="update" width={16} height={16} />
                  <input accept="image/*" onChange={handleAvatarChange} type="file" className="hidden" />
                </label>
                {avatarPreview && avatarPreview.trim() !== "" ? (
                  <div className="absolute bottom-1 left-1 z-10">
                    <ImageDownloadButton
                      src={resolveImageUrl(avatarPreview)}
                      filename="avatar.jpg"
                      size="icon"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Fields Grid — matches screenshot order exactly */}
            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">

              {/* First Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "الاسم الأول" : (isDe ? "Vorname" : "First Name")}
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name || ""}
                  onChange={handleChange}
                  className={fieldBase}
                  placeholder={isAr ? "الاسم الأول" : (isDe ? "Vorname" : "First Name")}
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "اسم العائلة" : (isDe ? "Nachname" : "Last Name")}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name || ""}
                  onChange={handleChange}
                  className={fieldBase}
                  placeholder={isAr ? "اسم العائلة" : (isDe ? "Nachname" : "Last Name")}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "البريد الإلكتروني" : (isDe ? "E-Mail-Adresse" : "Email")}
                </label>
                <input
                  type="email"
                  disabled
                  name="email"
                  value={profile.email || ""}
                  className="w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#A3A3A3] bg-transparent outline-none cursor-not-allowed"
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "الجنس" : (isDe ? "Geschlecht" : "Gender")}
                </label>
                <div className="relative w-full">
                  <select name="gender" value={profile.gender || ""} onChange={handleChange} className={selectBase}>
                    <option value="">{isAr ? "اختر" : (isDe ? "Auswählen" : "Select")}</option>
                    <option value="male">{isAr ? "ذكر" : (isDe ? "Männlich" : "Male")}</option>
                    <option value="female">{isAr ? "أنثى" : (isDe ? "Weiblich" : "Female")}</option>
                    <option value="other">{isAr ? "أخرى" : (isDe ? "Andere" : "Other")}</option>
                  </select>
                  <Image src="/portfolio/arrow-down.svg" alt="arrow" width={20} height={20} className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2" />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "تاريخ الميلاد" : (isDe ? "Geburtsdatum" : "Date Of Birth")}
                </label>
                <div className="relative w-full">
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob || ""}
                    onChange={handleChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10 [color-scheme:light]"
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                  />
                  <div className={`${fieldBase} flex items-center justify-between pointer-events-none`}>
                    <span className={`text-sm ${!profile.dob ? "text-[#A3A3A3]" : "text-[#525252]"}`}>
                      {profile.dob
                        ? (() => {
                            const parts = profile.dob.split("-")
                            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : profile.dob
                          })()
                        : (isAr ? "يوم / شهر / سنة" : "dd / mm / yyyy")}
                    </span>
                    <Image src="/portfolio/calender.svg" alt="" width={20} height={20} className="h-5 w-5 opacity-70 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "البلد" : (isDe ? "Land" : "Country")}
                </label>
                <div className="relative w-full">
                  <select name="country" value={profile.country_id || ""} onChange={handleChange} className={selectBase}>
                    <option value="">{isAr ? "اختر البلد" : (isDe ? "Land auswählen" : "Select Country")}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Image src="/portfolio/arrow-down.svg" alt="arrow" width={20} height={20} className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2" />
                </div>
              </div>

              {/* Phone — dial-code selector on the START side, number fills the rest */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "رقم الهاتف" : (isDe ? "Telefonnummer" : "Phone")}
                </label>
                <div
                  className="flex items-center border-b border-[#D4D4D4] py-2.5 focus-within:border-[#40A0CA] transition-colors"
                >
                  {/* Dial-code selector — start side (right in RTL, left in LTR) */}
                  <div className="relative flex items-center shrink-0 pe-2 me-2 border-e border-[#D4D4D4] h-6">
                    <select
                      aria-label="phone-code"
                      value={selectedDialCode}
                      onChange={(e) => setProfile((s) => ({ ...s, phone_code: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={`dial-${c.id}`} value={c.dialCode}>
                          {c.flag} {c.dialCode} ({c.name})
                        </option>
                      ))}
                    </select>
                    <span className="text-base me-1">{activeDialObj.flag}</span>
                    <span className="text-sm text-[#525252] font-medium" dir="ltr">{activeDialObj.dialCode}</span>
                    <Image src="/portfolio/arrow-down.svg" alt="arrow" width={16} height={16} className="h-4 w-4 ms-1 pointer-events-none" />
                  </div>

                  {/* Number digits — always LTR digits, flex fills remaining space */}
                  <input
                    type="tel"
                    dir="ltr"
                    value={profile.phone_raw || ""}
                    onChange={(e) => setProfile((s) => ({ ...s, phone_raw: e.target.value }))}
                    placeholder="1003630088"
                    className="w-full min-w-0 bg-transparent text-sm text-[#525252] outline-none text-right"
                  />
                </div>
              </div>

              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "كلمة المرور الحالية" : (isDe ? "Aktuelles Passwort" : "Current password")}
                </label>
                <div className="relative w-full">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${fieldBase} pe-10`}
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute end-2 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#525252]">
                    {showCurrentPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "كلمة المرور الجديدة" : (isDe ? "Neues Passwort" : "New password")}
                </label>
                <div className="relative w-full">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${fieldBase} pe-10`}
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute end-2 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#525252]">
                    {showNewPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "تأكيد كلمة المرور" : (isDe ? "Passwort bestätigen" : "Confirm password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${fieldBase} pe-10`}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute end-2 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#525252]">
                    {showConfirmPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "التخصص" : (isDe ? "Bereich" : "Category")}
                </label>
                <div className="relative w-full">
                  <select name="category" value={profile.category_id || ""} onChange={handleChange} className={selectBase}>
                    <option value="">{isAr ? "اختر التخصص" : (isDe ? "Bereich auswählen" : "Select Category")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Image src="/portfolio/arrow-down.svg" alt="arrow" width={20} height={20} className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2" />
                </div>
              </div>

              {/* Sub Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "التخصص الفرعي" : (isDe ? "Fachrichtung" : "Sub Category")}
                </label>
                <div className="relative w-full">
                  <select
                    name="sub_category"
                    value={profile.sub_category_id || ""}
                    onChange={handleChange}
                    className={selectBase}
                    disabled={subCategories.length === 0}
                    suppressHydrationWarning
                  >
                    <option value="">{isAr ? "اختر التخصص الفرعي" : (isDe ? "Fachrichtung auswählen" : "Select Sub Category")}</option>
                    {subCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <Image src="/portfolio/arrow-down.svg" alt="arrow" width={20} height={20} className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ==================== CARD: LINKED ACCOUNTS ==================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-xl font-bold text-[#006EA8]">
              {isAr ? "الحسابات المرتبطة" : (isDe ? "Verknüpfte Konten" : "Linked accounts")}
            </h2>
          </div>

          <div className="px-8 pb-8">
            {/* 4 pill buttons — grid like company profile */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {socialPlatforms.map(({ key, label, icon }) => {
                const isEditing = activeSocial === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSocial(isEditing ? null : key)}
                    className={`inline-flex items-center justify-center gap-2.5 h-11 px-4 rounded-lg border transition-all font-semibold text-sm w-full ${
                      isEditing
                        ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-none shadow-[0_4px_12px_rgba(0,110,168,0.2)]"
                        : "bg-white border-[#E6EEF4] text-[#525252] hover:border-[#006EA8] hover:text-[#006EA8]"
                    }`}
                  >
                    <img
                      src={icon}
                      alt={label}
                      className="h-4 w-4 shrink-0"
                      style={{ filter: isEditing ? "brightness(0) invert(1)" : "none" }}
                    />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Inline edit input */}
            {activeSocial && (
              <div className="mt-5 p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#006EA8] uppercase tracking-wide">
                    {socialPlatforms.find(p => p.key === activeSocial)?.label} URL
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSocial(null)}
                    className="text-xs text-[#A3A3A3] hover:text-red-500 font-medium transition-colors"
                  >
                    {isAr ? "إغلاق" : (isDe ? "Schließen" : "Close")}
                  </button>
                </div>
                <input
                  key={activeSocial}
                  type="url"
                  name={activeSocial}
                  value={profile[activeSocial] || ""}
                  onChange={handleChange}
                  placeholder={`https://${activeSocial === "twitter" ? "x" : activeSocial}.com/...`}
                  className="w-full rounded-lg border border-[#D4D4D4] px-4 py-2.5 text-sm text-[#525252] bg-white outline-none focus:border-[#40A0CA] transition-colors"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-2 pb-4">
          <PrimaryButton
            type="submit"
            disabled={saving || fetching}
            className="w-auto min-w-[160px] max-w-[220px] h-[44px] px-8 text-sm font-semibold bg-gradient-to-b from-[#006EA8] to-[#005685] shadow-[0_4px_14px_rgba(0,110,168,0.3)] hover:from-[#005685] hover:to-[#004268]"
          >
            {saving ? (isAr ? "جاري التحديث..." : (isDe ? "Aktualisierung..." : "Updating...")) : (isAr ? "تحديث" : (isDe ? "Aktualisieren" : "Update"))}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
