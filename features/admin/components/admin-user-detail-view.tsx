"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { updateAdminUserAction, suspendUserAction } from "@/features/admin/actions/admin-actions"
import { validateNewPassword } from "@/lib/password-validation"
import { User as UserIcon, ShieldAlert, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { AdminConfirmDialog } from "./admin-confirm-dialog"

export function AdminUserDetailView({ user, locale }: { user: User; locale: string }) {
  const t = useTranslations("Admin.users")
  const isAr = locale === "ar"
  const [pending, startTransition] = useTransition()
  const [statusPending, setStatusPending] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const userProfile =
    user.Userprofile ||
    (user as { user_profile?: User["Userprofile"] }).user_profile ||
    null
  const countryName = user.country?.name || ""
  const cityName = user.city?.name || ""
  const categoryName = user.category?.name || userProfile?.categoryName || ""
  const subcategoryName = user.sub_category?.name || userProfile?.subcategoryName || ""
  const isSuspended = user.status === "suspended" || user.status === "inactive"

  async function runStatusToggle() {
    if (statusPending) return
    setStatusError(null)
    setStatusPending(true)
    try {
      const res = await suspendUserAction(
        { id: user.id, uuid: user.uuid, email: user.email },
        !isSuspended,
        locale
      )
      if (!res.ok) {
        const msg = res.message || (isAr ? "فشل تغيير الحالة" : "Failed to update status")
        setStatusError(msg)
        toast.error(msg)
        return
      }
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated")
      setStatusConfirmOpen(false)
      location.reload()
    } finally {
      setStatusPending(false)
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedPassword = password.trim()
    if (trimmedPassword) {
      const passwordError = validateNewPassword(trimmedPassword, passwordConfirmation.trim(), locale)
      if (passwordError) {
        setError(passwordError)
        return
      }
    }

    startTransition(async () => {
      const payload: {
        name?: string
        email?: string
        password?: string
        password_confirmation?: string
      } = {}
      if (name.trim() !== user.name) payload.name = name.trim()
      if (email.trim() !== user.email) payload.email = email.trim()
      if (trimmedPassword) {
        payload.password = trimmedPassword
        payload.password_confirmation = passwordConfirmation.trim()
      }

      if (Object.keys(payload).length === 0) {
        setIsEditing(false)
        return
      }

      const res = await updateAdminUserAction({ id: user.id, uuid: user.uuid }, payload, locale)
      if (!res.ok) {
        setError(res.message || (isAr ? "فشل تحديث البيانات" : "Failed to update user"))
        return
      }
      setSuccess(isAr ? "تم تحديث البيانات بنجاح" : "User updated successfully")
      setIsEditing(false)
      setPassword("")
      setPasswordConfirmation("")
      setTimeout(() => location.reload(), 1000)
    })
  }

  // Common styling classes to match user profile page
  const fieldBase = "w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#525252] bg-transparent outline-none transition-colors focus:border-[#40A0CA] placeholder:text-[#A3A3A3]"

  return (
    <div className="w-full flex flex-col gap-6" dir={isAr ? "rtl" : "ltr"}>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{success}</p>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
        <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-[#F3F4F6]">
          <h2 className="text-xl font-bold text-[#006EA8]">
            {isAr ? "ملف المستخدم" : "User Profile"}
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-gradient-to-b from-[#006EA8] to-[#005685] px-5 py-2 text-sm font-semibold text-white hover:from-[#005685] hover:to-[#004268] shadow-sm transition"
            >
              {isAr ? "تعديل الملف الشخصي" : "Edit Profile"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          )}
        </div>

        <div className="p-8">
          {/* Avatar and Verification */}
          <div className="flex flex-col items-center mb-8 gap-4">
            <div className="relative">
              <div className="h-36 w-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#E0F2FE] flex items-center justify-center relative">
                <UserIcon className="h-20 w-20 text-[#006EA8]" />
                {user.avatar && user.avatar.trim() !== "" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover absolute inset-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0" }}
                  />
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-[#111827]">{user.name}</h3>
              <p className="text-sm text-[#6B7280]">{user.email}</p>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold normal-case",
                !isSuspended ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"
              )}>
                {!isSuspended ? (isAr ? "نشط" : "Active") : (isAr ? "معلق" : "Suspended")}
              </span>

              <button
                type="button"
                disabled={statusPending}
                onClick={() => {
                  setStatusError(null)
                  setStatusConfirmOpen(true)
                }}
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border transition",
                  isSuspended
                    ? "bg-[#DCFCE7] border-[#10B981] text-[#166534] hover:bg-[#ECFDF5]"
                    : "bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] hover:bg-[#FFFBEB]"
                )}
              >
                <ShieldAlert className="size-3.5" />
                {isSuspended ? (isAr ? "تفعيل الحساب" : "Activate account") : (isAr ? "تعليق الحساب" : "Suspend account")}
              </button>
            </div>
          </div>

          <AdminConfirmDialog
            open={statusConfirmOpen}
            onOpenChange={setStatusConfirmOpen}
            title={isSuspended ? (isAr ? "تأكيد التفعيل" : "Confirm activation") : (isAr ? "تأكيد التعليق" : "Confirm suspend")}
            description={
              isSuspended
                ? t("activateConfirm")
                : t("suspendConfirm")
            }
            subject={user.name}
            confirmLabel={t("confirm")}
            cancelLabel={t("cancel")}
            pending={statusPending}
            pendingLabel={isAr ? "جاري التحديث..." : "Updating..."}
            tone="warning"
            error={statusError}
            onConfirm={runStatusToggle}
          />

          {/* Form / Details view */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#262626]">
                    {isAr ? "الاسم" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldBase}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#262626]">
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldBase}
                    required
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#262626]">
                      {isAr ? "كلمة المرور الجديدة (اتركها فارغة في حال عدم التغيير)" : "New Password (leave empty to keep current)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cn(fieldBase, "pe-10")}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-0 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-[#525252]"
                        aria-label={showPassword ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#737373]">
                      {isAr
                        ? "8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز."
                        : "At least 8 characters, upper & lower case, a number, and a symbol."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#262626]">
                      {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="••••••••"
                        className={cn(fieldBase, "pe-10")}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirmation((v) => !v)}
                        className="absolute end-0 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-[#525252]"
                        aria-label={showPasswordConfirmation ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                      >
                        {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-gradient-to-b from-[#006EA8] to-[#005685] px-6 py-2.5 text-sm font-semibold text-white hover:from-[#005685] hover:to-[#004268] disabled:opacity-60 transition"
                >
                  {pending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Basic Section */}
              <div>
                <h4 className="text-base font-bold text-[#006EA8] mb-6 pb-2 border-b border-[#E5E7EB]">
                  {isAr ? "البيانات الأساسية" : "Basic Info"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "الاسم" : "Name"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {user.name}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "البريد الإلكتروني" : "Email"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {user.email}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "رقم الهاتف" : "Phone"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {user.phone || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "البلد" : "Country"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {countryName || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "المدينة" : "City"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {cityName || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Section */}
              <div>
                <h4 className="text-base font-bold text-[#006EA8] mb-6 pb-2 border-b border-[#E5E7EB]">
                  {isAr ? "بيانات الملف الشخصي" : "Profile Details"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "الجنس" : "Gender"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252] normal-case
">
                      {isAr
                        ? (userProfile?.gender === "male" ? "ذكر" : userProfile?.gender === "female" ? "أنثى" : userProfile?.gender || "—")
                        : (userProfile?.gender || "—")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "تاريخ الميلاد" : "Date of Birth"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {userProfile?.dateOfBirth || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "التخصص" : "Category"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {categoryName || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "التخصص الفرعي" : "Subcategory"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {subcategoryName || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Platforms Links */}
              {(userProfile?.facebook || userProfile?.linkedin || userProfile?.twitterX || userProfile?.pinterest) && (
                <div>
                  <h4 className="text-base font-bold text-[#006EA8] mb-6 pb-2 border-b border-[#E5E7EB]">
                    {isAr ? "الحسابات المرتبطة" : "Linked accounts"}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {userProfile?.facebook && (
                      <a
                        href={userProfile.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/Facebook.svg" alt="Facebook" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">Facebook</span>
                      </a>
                    )}
                    {userProfile?.linkedin && (
                      <a
                        href={userProfile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/LinkedIn.svg" alt="LinkedIn" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">LinkedIn</span>
                      </a>
                    )}
                    {userProfile?.twitterX && (
                      <a
                        href={userProfile.twitterX}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/X.svg" alt="X" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">X (Twitter)</span>
                      </a>
                    )}
                    {userProfile?.pinterest && (
                      <a
                        href={userProfile.pinterest}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/pinterest.svg" alt="Pinterest" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">Pinterest</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
