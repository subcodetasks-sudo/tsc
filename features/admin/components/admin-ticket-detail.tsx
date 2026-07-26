"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useTicketChat, TicketChatThread } from "@/features/tickets"
import { Loader2 } from "lucide-react"

type ReceiverInfo = { id: number; name: string; email: string }

type Props = {
  ticketId: number | null
  isOpen: boolean
  onClose: () => void
  locale: string
  onTicketUpdated: () => void
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

export function AdminTicketDetail({ ticketId, isOpen, onClose, locale, onTicketUpdated }: Props) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusOverride, setStatusOverride] = useState<string | null>(null)
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null)
  const isAr = locale === "ar"

  const { ticket: chatTicket, messages, loading, sending, sendMessage } = useTicketChat({
    ticketId,
    role: "admin",
    locale,
    enabled: isOpen,
  })
  const ticket = chatTicket ? { ...chatTicket, status: statusOverride ?? chatTicket.status } : null

  useEffect(() => {
    if (!isOpen) {
      // Reset local UI state so the next ticket opened doesn't inherit it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatusOverride(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiver(null)
      return
    }
    if (ticketId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiver(readReceiver(ticketId))
    }
  }, [isOpen, ticketId])

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return
    try {
      setUpdatingStatus(true)
      const formData = new FormData()
      formData.append("status", newStatus)

      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Accept-Language": locale },
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to update status")

      setStatusOverride(newStatus)
      toast.success(isAr ? "تم تحديث حالة التذكرة بنجاح" : "Ticket status updated successfully")
      onTicketUpdated()
    } catch (err: unknown) {
      console.error("Status change error:", err)
      const msg = err instanceof Error ? err.message : undefined
      toast.error(msg || (isAr ? "فشل تحديث حالة التذكرة" : "Failed to update ticket status"))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSend = async (message: string, file?: File | null) => {
    await sendMessage(message, file)
    onTicketUpdated()
  }

  const getPriorityLabel = (pri: string) => {
    const map: Record<string, string> = {
      high: isAr ? "عالي" : "High",
      medium: isAr ? "متوسط" : "Medium",
      low: isAr ? "منخفض" : "Low",
    }
    return map[pri] || pri
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: isAr ? "معلق" : "Pending",
      open: isAr ? "مفتوح" : "Open",
      answered: isAr ? "تم الرد" : "Answered",
      closed: isAr ? "مغلق" : "Closed",
      rejected: isAr ? "مرفوض" : "Rejected",
    }
    return map[status] || status
  }

  const getFilenameFromUrl = (url?: string | null) => {
    if (!url) return ""
    return url.substring(url.lastIndexOf("/") + 1)
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

  const gradientTitleClasses = cn(
    "bg-clip-text text-transparent font-bold",
    isAr ? "bg-gradient-to-r" : "bg-gradient-to-l",
    "from-[#032C44] to-[#41A0CA]"
  )

  const ticketUser = ticket
    ? (ticket as typeof ticket & { user?: { name?: string; email?: string; role?: string } }).user
    : undefined
  const attachments = ticket && Array.isArray(ticket.attachments) ? ticket.attachments : []
  const attachment = ticket
    ? (ticket as typeof ticket & { file?: string; attachment?: string }).file ||
    (ticket as typeof ticket & { attachment?: string }).attachment ||
    attachments[0]
    : undefined

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[650px] p-0 rounded-[20px] bg-white border-0 shadow-lg h-[90vh] overflow-hidden flex flex-col"
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogTitle className="sr-only">
          {ticket?.subject || (isAr ? "تفاصيل التذكرة" : "Ticket Details")}
        </DialogTitle>

        {loading && !ticket && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#006EA8]" />
            <p className="text-sm text-gray-500">
              {isAr ? "جاري تحميل تفاصيل التذكرة..." : "Loading ticket details..."}
            </p>
          </div>
        )}

        {ticket && (
          <>
            <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className={cn("text-[18px] font-bold leading-snug", gradientTitleClasses)}>
                  {ticket.subject}
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-2.5">
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0",
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

                  <span className="text-[12px] text-gray-400">{formatDate(ticket.created_at)}</span>
                </div>

                {ticketUser && (
                  <div className="mt-3 text-xs bg-[#F8FAFC] border border-gray-100 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-600">{isAr ? "المرسل: " : "Sender: "}</span>
                      <span className="text-gray-900 font-semibold">{ticketUser.name}</span>
                      <span className="text-gray-400 mx-1.5">|</span>
                      <span className="text-gray-500">{ticketUser.email}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E4ECF5] text-[#006EA8] normal-case
">
                      {ticketUser.role === "company"
                        ? isAr
                          ? "شركة"
                          : "Company"
                        : isAr
                          ? "باحث عن عمل"
                          : "Job Seeker"}
                    </span>
                  </div>
                )}

                {receiver && (
                  <div className="mt-2 text-xs bg-[#FFF8EE] border border-[#FFE4B8] rounded-lg p-2.5">
                    <span className="font-bold text-gray-600">{isAr ? "المستلم: " : "To: "}</span>
                    <span className="text-gray-900 font-semibold">{receiver.name}</span>
                    <span className="text-gray-400 mx-1.5">|</span>
                    <span className="text-gray-500">{receiver.email}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition cursor-pointer shrink-0"
              >
                <img src="/portfolio/close-circle.svg" alt="Close" className="w-7 h-7" />
              </button>
            </div>

            <div className="px-6 pt-4 space-y-3 shrink-0">
              {attachment && (
                <div className="flex items-center gap-2 text-xs text-[#006EA8] pb-1">
                  <img src="/portfolio/pdf.svg" alt="File" className="w-5 h-5 flex-shrink-0" />
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-semibold hover:underline"
                  >
                    {getFilenameFromUrl(attachment)}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-xs font-bold text-[#032C44]">
                  {isAr ? "تحديث حالة التذكرة:" : "Change Status:"}
                </span>

                <div className="flex flex-wrap gap-2 justify-end">
                  {(["pending", "open", "answered", "closed"] as const).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
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

            <div className="flex-1 min-h-0">
              <TicketChatThread
                messages={messages}
                loading={loading}
                sending={sending}
                disabled={ticket.status === "closed"}
                locale={locale}
                onSend={handleSend}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
