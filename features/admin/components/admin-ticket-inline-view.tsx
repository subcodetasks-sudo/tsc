"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { useTicketChat, TicketChatThread } from "@/features/tickets"
import type { Ticket } from "@/lib/api/types"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

type ReceiverInfo = { id: number; name: string; email: string }

type Props = {
  initialTicket: Ticket | null
  ticketId: number
  locale: string
}

function readReceiver(ticketId: number): ReceiverInfo | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(`ticket-receiver-${ticketId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReceiverInfo
    if (!parsed?.id || !parsed?.name) return null
    return parsed
  } catch {
    return null
  }
}

export function AdminTicketInlineView({ initialTicket, ticketId, locale }: Props) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusOverride, setStatusOverride] = useState<string | null>(null)
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null)
  const isAr = locale === "ar"

  useEffect(() => {
    setReceiver(readReceiver(ticketId))
  }, [ticketId])

  const { ticket: chatTicket, messages, loading, sending, sendMessage } = useTicketChat({
    ticketId,
    role: "admin",
    locale,
    initialTicket,
  })
  const ticket = chatTicket ? { ...chatTicket, status: statusOverride ?? chatTicket.status } : initialTicket

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    try {
      setUpdatingStatus(true)
      const formData = new FormData()
      formData.append("status", newStatus)
      const res = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Accept-Language": locale },
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to update status")
      setStatusOverride(newStatus)
      toast.success(isAr ? "تم تحديث حالة التذكرة" : "Ticket status updated")
    } catch (err: any) {
      toast.error(err.message || (isAr ? "فشل تحديث الحالة" : "Failed to update status"))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: isAr ? "معلق" : "Pending",
      open: isAr ? "مفتوح" : "Open",
      answered: isAr ? "تم الرد" : "Answered",
      closed: isAr ? "مغلق" : "Closed",
      rejected: isAr ? "مرفوض" : "Rejected",
    }
    return map[s] || s
  }

  const getPriorityLabel = (p: string) => {
    const map: Record<string, string> = {
      high: isAr ? "عالي" : "High",
      medium: isAr ? "متوسط" : "Medium",
      low: isAr ? "منخفض" : "Low",
    }
    return map[p] || p
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getFilenameFromUrl = (url?: string | null) => {
    if (!url) return ""
    return url.substring(url.lastIndexOf("/") + 1)
  }

  const gradientTitleClasses = cn(
    "bg-clip-text text-transparent font-bold",
    isAr ? "bg-gradient-to-r" : "bg-gradient-to-l",
    "from-[#032C44] to-[#41A0CA]"
  )

  if (!ticket) {
    return (
      <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500 font-medium">{isAr ? "لم يتم العثور على التذكرة" : "Ticket not found"}</p>
        <Link locale={locale} href="/dashboard/admin/tickets" className="mt-4 inline-flex items-center gap-2 text-[#006EA8] text-sm font-semibold hover:underline">
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {isAr ? "العودة إلى التذاكر" : "Back to Tickets"}
        </Link>
      </div>
    )
  }

  const ticketUser = (ticket as Ticket & { user?: { name?: string; email?: string; role?: string } }).user
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : []
  const attachment =
    (ticket as Ticket & { file?: string; attachment?: string }).file ||
    (ticket as Ticket & { attachment?: string }).attachment ||
    attachments[0]

  return (
    <div className="w-full space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      <Link locale={locale} href="/dashboard/admin/tickets" className="inline-flex items-center gap-1.5 text-[#006EA8] text-sm font-semibold hover:underline">
        {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {isAr ? "العودة إلى جميع التذاكر" : "Back to all tickets"}
      </Link>

      <div className="rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className={cn("text-xl", gradientTitleClasses)}>{ticket.subject}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                    ticket.status === "pending" && "border-[#FFB64D] bg-[#FFF8EE] text-[#FFB64D]",
                    ticket.status === "open" && "border-[#39DA8A] bg-[#EAFBF3] text-[#39DA8A]",
                    ticket.status === "answered" && "border-[#006EA8] bg-[#F0F9FF] text-[#006EA8]",
                    ticket.status === "closed" && "border-[#FF5B5C] bg-[#FFF5F5] text-[#FF5B5C]",
                    ticket.status === "rejected" && "border-[#FF5B5C] bg-[#FFF5F5] text-[#FF5B5C]"
                  )}
                >
                  {getStatusLabel(ticket.status || "pending")}
                </span>
                <span className="bg-[#032C44] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full normal-case
">
                  {getPriorityLabel(ticket.priority || "high")}
                </span>
                <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
              </div>

              {ticketUser && (
                <div className="mt-3 text-xs bg-[#F8FAFC] border border-gray-100 rounded-lg p-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-gray-600">{isAr ? "المرسل: " : "From: "}</span>
                    <span className="text-gray-900 font-semibold">{ticketUser.name}</span>
                    <span className="text-gray-400 mx-1.5">|</span>
                    <span className="text-gray-500">{ticketUser.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E4ECF5] text-[#006EA8] normal-case
">
                    {ticketUser.role === "company" ? (isAr ? "شركة" : "Company") : (isAr ? "باحث عن عمل" : "Job Seeker")}
                  </span>
                </div>
              )}

              {receiver && (
                <div className="mt-3 text-xs bg-[#FFF8EE] border border-[#FFE4B8] rounded-lg p-2.5">
                  <span className="font-bold text-gray-600">{isAr ? "المستلم: " : "To: "}</span>
                  <span className="text-gray-900 font-semibold">{receiver.name}</span>
                  <span className="text-gray-400 mx-1.5">|</span>
                  <span className="text-gray-500">{receiver.email}</span>
                </div>
              )}

              {attachment && (
                <div className="flex items-center gap-2 text-xs text-[#006EA8] mt-3">
                  <img src="/portfolio/pdf.svg" alt="file" className="w-5 h-5 flex-shrink-0" />
                  <a href={attachment} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline truncate">
                    {getFilenameFromUrl(attachment)}
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["pending", "open", "answered", "closed"] as const).map((st) => (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer disabled:opacity-60",
                    ticket.status === st
                      ? st === "pending"
                        ? "bg-[#FFB64D] border-transparent text-white"
                        : st === "open"
                          ? "bg-[#39DA8A] border-transparent text-white"
                          : st === "answered"
                            ? "bg-[#006EA8] border-transparent text-white"
                            : "bg-[#FF5B5C] border-transparent text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {getStatusLabel(st)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[420px]">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[420px]">
              <Loader2 className="h-6 w-6 animate-spin text-[#006EA8]" />
            </div>
          ) : (
            <TicketChatThread
              messages={messages}
              loading={loading}
              sending={sending}
              disabled={ticket.status === "closed"}
              locale={locale}
              onSend={sendMessage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
