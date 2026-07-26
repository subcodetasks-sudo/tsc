"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { updateAdminUserAction, suspendUserAction } from "@/features/admin/actions/admin-actions"
import { toast } from "sonner"
import { ShieldAlert } from "lucide-react"
import { AdminConfirmDialog } from "./admin-confirm-dialog"

export function AdminCompanyDetailView({ company, locale }: { company: User; locale: string }) {
  const t = useTranslations("Admin.companies")
  const isAr = locale === "ar"
  const [pending, startTransition] = useTransition()
  const [statusPending, setStatusPending] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(company.name || "")
  const [email, setEmail] = useState(company.email || "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const companyProfile = (company as any).companyProfile || (company as any).company_profile || {}
  const country = (company as any).country
  const city = (company as any).city
  const socialMedia = companyProfile.socialMedia || companyProfile.social_media || {}
  const isSuspended = company.status === "suspended" || company.status === "inactive"

  async function runStatusToggle() {
    if (statusPending) return
    setStatusError(null)
    setStatusPending(true)
    try {
      const res = await suspendUserAction(
        { id: company.id, uuid: company.uuid, email: company.email },
        !isSuspended,
        locale
      )
      if (!res.ok) {
        const msg = res.message || (isAr ? "فشل تغيير الحالة" : "Failed to update status")
        setStatusError(msg)
        toast.error(msg)
        return
      }
      toast.success(isAr ? "تم تحديث حالة الشركة" : "Company status updated")
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
    startTransition(async () => {
      const payload: { name?: string; email?: string; password?: string } = {}
      if (name.trim() !== company.name) payload.name = name.trim()
      if (email.trim() !== company.email) payload.email = email.trim()
      if (password.trim() !== "") payload.password = password.trim()

      if (Object.keys(payload).length === 0) {
        setIsEditing(false)
        return
      }

      const res = await updateAdminUserAction({ id: company.id, uuid: company.uuid }, payload, locale)
      if (!res.ok) {
        setError(res.message || (isAr ? "فشل تحديث البيانات" : "Failed to update company"))
        return
      }
      setSuccess(isAr ? "تم تحديث البيانات بنجاح" : "Company updated successfully")
      setIsEditing(false)
      setPassword("")
      setTimeout(() => location.reload(), 1000)
    })
  }

  // Common styling classes to match company profile page
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

        {/* Cover Banner */}
        <div className="relative w-full h-[180px] md:h-[260px] bg-gradient-to-r from-[#032C44] to-[#41A0CA]">
          {companyProfile.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyProfile.coverImageUrl}
              alt="Cover Banner"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Action Header bar inside padding */}
        <div className="px-8 pt-6 pb-4 flex justify-between items-center border-b border-[#F3F4F6]">
          <h2 className="text-xl font-bold text-[#006EA8]">
            {isAr ? "ملف الشركة" : "Company Profile"}
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-gradient-to-b from-[#006EA8] to-[#005685] px-5 py-2 text-sm font-semibold text-white hover:from-[#005685] hover:to-[#004268] shadow-sm transition"
            >
              {isAr ? "تعديل حساب الشركة" : "Edit Company Profile"}
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
          {/* Logo/Avatar and Details Header */}
          <div className="flex flex-col items-center mb-8 gap-4">
            <div className="relative -mt-24 z-10">
              <div className="h-32 w-32 rounded-xl border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center relative">
                {companyProfile.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyProfile.logoUrl}
                    alt={companyProfile.companyName || company.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Avatar className="h-full w-full rounded-none">
                    {company.avatar ? (
                      <AvatarImage src={company.avatar} alt={company.name} />
                    ) : (
                      <AvatarFallback className="text-4xl bg-[#EBF5FB] font-bold text-[#006EA8] rounded-none">
                        {(companyProfile.companyName || company.name || "C").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-[#111827]">
                {companyProfile.companyName || company.name}
              </h3>
              {companyProfile.ceoName && (
                <p className="text-sm text-[#6B7280]">
                  {isAr ? "الرئيس التنفيذي:" : "CEO:"} {companyProfile.ceoName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold normal-case
",
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
                {isSuspended
                  ? (isAr ? "تفعيل الحساب" : "Activate account")
                  : (isAr ? "تعليق الحساب" : "Suspend account")}
              </button>
            </div>
          </div>

          <AdminConfirmDialog
            open={statusConfirmOpen}
            onOpenChange={setStatusConfirmOpen}
            title={isSuspended ? (isAr ? "تأكيد التفعيل" : "Confirm activation") : (isAr ? "تأكيد التعليق" : "Confirm suspend")}
            description={
              isSuspended
                ? isAr
                  ? "هل تريد تفعيل حساب هذه الشركة؟"
                  : "Do you want to activate this company account?"
                : isAr
                  ? "هل تريد تعليق حساب هذه الشركة؟"
                  : "Do you want to suspend this company account?"
            }
            subject={companyProfile.companyName || company.name}
            confirmLabel={isAr ? "تأكيد" : "Confirm"}
            cancelLabel={isAr ? "إلغاء" : "Cancel"}
            pending={statusPending}
            pendingLabel={isAr ? "جاري التحديث..." : "Updating..."}
            tone="warning"
            error={statusError}
            onConfirm={runStatusToggle}
          />

          {/* Form / Details content */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#262626]">
                    {isAr ? "اسم الشركة" : "Company Name"}
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
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#262626]">
                    {isAr ? "كلمة المرور الجديدة (اتركها فارغة في حال عدم التغيير)" : "New Password (leave empty to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={fieldBase}
                  />
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
                  {isAr ? "البيانات الأساسية للشركة" : "Company Basic Info"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "اسم الشركة" : "Company Name"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.companyName || company.name}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "البريد الإلكتروني" : "Email"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {company.email}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "الرئيس التنفيذي" : "CEO Name"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.ceoName || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "رقم الهاتف" : "Phone"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {company.phone || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "البلد" : "Country"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {country ? country.name : "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "المدينة" : "City"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {city?.name || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Details Section */}
              <div>
                <h4 className="text-base font-bold text-[#006EA8] mb-6 pb-2 border-b border-[#E5E7EB]">
                  {isAr ? "بيانات إضافية" : "Additional Info"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "وصف الشركة" : "Description"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252] whitespace-pre-line leading-relaxed">
                      {companyProfile.description || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "نوع الشركة" : "Company Type"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.companyType || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "عدد الموظفين" : "Number of Employees"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.numOfEmployees || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "الموقع الإلكتروني" : "Website"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.website ? (
                        <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-[#006EA8] hover:underline font-semibold">
                          {companyProfile.website}
                        </a>
                      ) : "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#262626]">
                      {isAr ? "الرمز البريدي" : "Postal Code"}
                    </span>
                    <div className="w-full border-b border-[#E5E7EB] py-2 text-sm text-[#525252]">
                      {companyProfile.postalCode || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              {(socialMedia.facebook || socialMedia.linkedin || socialMedia.twitterX || socialMedia.pinterest) && (
                <div>
                  <h4 className="text-base font-bold text-[#006EA8] mb-6 pb-2 border-b border-[#E5E7EB]">
                    {isAr ? "الحسابات المرتبطة للشركة" : "Linked accounts"}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {socialMedia.facebook && (
                      <a
                        href={socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/Facebook.svg" alt="Facebook" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">Facebook</span>
                      </a>
                    )}
                    {socialMedia.linkedin && (
                      <a
                        href={socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/LinkedIn.svg" alt="LinkedIn" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">LinkedIn</span>
                      </a>
                    )}
                    {socialMedia.twitterX && (
                      <a
                        href={socialMedia.twitterX}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 border border-[#E6EEF4] rounded-xl hover:border-[#006EA8] transition"
                      >
                        <img src="/Linked_accounts/X.svg" alt="X" className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold text-[#525252]">X (Twitter)</span>
                      </a>
                    )}
                    {socialMedia.pinterest && (
                      <a
                        href={socialMedia.pinterest}
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
