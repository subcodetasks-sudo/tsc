"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { AdminTicketDetail } from "./admin-ticket-detail"
import { AdminCreateTicketDialog } from "./admin-create-ticket-dialog"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp } from "lucide-react"

type Props = {
  tickets: any[]
  locale: string
}

export function AdminTicketsPanel({ tickets: initialTickets = [], locale }: Props) {
  const [tickets, setTickets] = useState<any[]>(initialTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const isAr = locale === "ar"
  const isDe = locale === "de"

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/admin/tickets?locale=${locale}`, {
        credentials: "include",
        headers: { "Accept-Language": locale },
      })
      if (res.ok) {
        const json = await res.json()
        // Response shape: { data: Ticket[], meta: {...} }
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
        setTickets(list)
      }
    } catch (err) {
      console.error("Failed to fetch admin tickets", err)
    }
  }

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter tickets by search query and status tabs
  const filteredTickets = tickets.filter((ticket) => {
    const status = ticket.status || "pending"
    let matchesStatus = statusFilter === "all" || status === statusFilter
    if (statusFilter === "open") {
      matchesStatus = status === "open" || status === "answered"
    }

    const userText = ticket.user
      ? `${ticket.user.name || ""} ${ticket.user.email || ""}`
      : ""
    const searchText = `${ticket.subject || ""} ${ticket.message || ""} ${userText}`.toLowerCase()
    const matchesSearch = searchText.includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  // Statistics
  const totalTickets = tickets.length
  const pendingCount = tickets.filter((t) => (t.status || "pending") === "pending").length
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "answered").length
  const closedCount = tickets.filter((t) => t.status === "closed").length

  const getPriorityLabel = (pri: string) => {
    const map: Record<string, string> = {
      high: isAr ? "عالي" : isDe ? "Hoch" : "High",
      medium: isAr ? "متوسط" : isDe ? "Mittel" : "Medium",
      low: isAr ? "منخفض" : isDe ? "Niedrig" : "Low",
    }
    return map[pri] || pri
  }

  const getPriorityColor = (pri: string) => {
    if (pri === "high") return "bg-red-600"
    if (pri === "medium") return "bg-amber-500"
    return "bg-green-500"
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: isAr ? "معلق" : isDe ? "Ausstehend" : "Pending",
      open: isAr ? "مفتوح" : isDe ? "Offen" : "Open",
      answered: isAr ? "تم الرد" : isDe ? "Beantwortet" : "Answered",
      closed: isAr ? "مغلق" : isDe ? "Geschlossen" : "Closed",
      rejected: isAr ? "مرفوض" : isDe ? "Abgelehnt" : "Rejected",
    }
    return map[status] || status
  }

  const formatLastReply = (dateStr?: string) => {
    if (!dateStr) return isAr ? "منذ فترة" : isDe ? "vor einiger Zeit" : "some time ago"
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) {
        return isAr ? `منذ ${diffMins} دقيقة` : isDe ? `vor ${diffMins} Minuten` : `${diffMins} minutes ago`
      }
      if (diffHours < 24) {
        return isAr ? `منذ ${diffHours} ساعة` : isDe ? `vor ${diffHours} Stunden` : `${diffHours} hours ago`
      }
      if (diffDays < 30) {
        return isAr ? `منذ ${diffDays} يوم` : isDe ? `vor ${diffDays} Tagen` : `${diffDays} days ago`
      }
      return isAr ? "منذ شهر" : isDe ? "vor 1 Monat" : "1 month ago"
    } catch {
      return isAr ? "منذ شهر" : isDe ? "vor 1 Monat" : "1 month ago"
    }
  }

  const getFilenameFromUrl = (url?: string | null) => {
    if (!url) return ""
    return url.substring(url.lastIndexOf("/") + 1)
  }

  const handleOpenDetail = (id: number) => {
    setSelectedTicketId(id)
    setShowDetailModal(true)
  }

  return (
    <div className="w-full space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm text-start">
          <div className="text-xs font-semibold text-[#6B7280] mb-1">
            {isAr ? "إجمالي التذاكر" : isDe ? "Tickets insgesamt" : "Total Tickets"}
          </div>
          <div className="text-2xl font-bold text-[#032C44]">{totalTickets}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm text-start">
          <div className="text-xs font-semibold text-[#FFB64D] mb-1">
            {isAr ? "تذاكر معلقة" : isDe ? "Ausstehende Tickets" : "Pending Tickets"}
          </div>
          <div className="text-2xl font-bold text-[#FFB64D]">{pendingCount}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm text-start">
          <div className="text-xs font-semibold text-[#39DA8A] mb-1">
            {isAr ? "تذاكر مفتوحة" : isDe ? "Offene Tickets" : "Open Tickets"}
          </div>
          <div className="text-2xl font-bold text-[#39DA8A]">{openCount}</div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm text-start">
          <div className="text-xs font-semibold text-[#FF5B5C] mb-1">
            {isAr ? "تذاكر مغلقة" : isDe ? "Geschlossene Tickets" : "Closed Tickets"}
          </div>
          <div className="text-2xl font-bold text-[#FF5B5C]">{closedCount}</div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "open", "closed"] as const).map((status) => {
            const labels: Record<string, string> = {
              all: isAr ? "الكل" : isDe ? "Alle" : "All",
              pending: isAr ? "معلق" : isDe ? "Ausstehend" : "Pending",
              open: isAr ? "مفتوح" : isDe ? "Offen" : "Open",
              closed: isAr ? "مغلق" : isDe ? "Geschlossen" : "Closed",
            }
            const count =
              status === "all"
                ? totalTickets
                : status === "pending"
                  ? pendingCount
                  : status === "open"
                    ? openCount
                    : closedCount
            const isActive = statusFilter === status

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer",
                  isActive
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-transparent shadow-md"
                    : "bg-white text-[#525252] border-[#E5E7EB] hover:border-[#40A0CA] hover:text-[#006EA8]"
                )}
              >
                {labels[status]} ({count})
              </button>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Input
              type="text"
              placeholder={isAr ? "البحث عن تذكرة..." : isDe ? "Tickets suchen..." : "Search tickets..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] focus:border-[#40A0CA] rounded-lg text-sm bg-white outline-none"
            />
            <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-gray-400", isAr ? "left-3" : "right-3")}>
              <Search className="h-4 w-4" />
            </div>
          </div>

          <PrimaryButton
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-[42px] w-auto px-5 whitespace-nowrap shrink-0 text-sm"
          >
            <span className="text-[16px] font-bold me-1">+</span>
            {isAr ? "بدء محادثة" : isDe ? "Chat starten" : "Start Chat"}
          </PrimaryButton>
        </div>
      </div>

      {/* ── Tickets Grid/List ── */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const lastUpdated = ticket.updated_at || ticket.created_at
            const status = ticket.status || "pending"
            const attachment = ticket.file || ticket.attachment
            const isExpanded = expandedIds.has(ticket.id)
            const messageText: string = ticket.message || ""
            const MSG_PREVIEW = 140
            const isLong = messageText.length > MSG_PREVIEW

            return (
              <div
                key={ticket.id}
                className="rounded-[16px] border border-[#E5E7EB] bg-white shadow-sm hover:shadow-md hover:border-[#40A0CA]/40 transition-all text-start overflow-hidden group"
              >
                {/* ── Card Header (clickable → opens detail modal) ── */}
                <div
                  onClick={() => handleOpenDetail(ticket.id)}
                  className="p-6 pb-4 cursor-pointer space-y-3"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[17px] font-bold text-[#032C44] group-hover:text-[#006EA8] transition-colors truncate">
                          {ticket.subject}
                        </h3>
                        <span className={cn(
                          "text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full normal-case",
                          getPriorityColor(ticket.priority || "high")
                        )}>
                          {getPriorityLabel(ticket.priority || "high")}
                        </span>
                      </div>

                      {/* Sender info */}
                      {ticket.user && (
                        <p className="text-xs text-gray-500 font-semibold">
                          {isAr ? "المرسل:" : isDe ? "Absender:" : "From:"}{" "}
                          <span className="text-[#006EA8]">{ticket.user.name}</span>{" "}
                          ({ticket.user.email})
                        </p>
                      )}

                      <p className="text-[11px] text-gray-400 font-medium">
                        {isAr ? "آخر تحديث:" : isDe ? "Letzte Aktualisierung:" : "Last Update:"} {formatLastReply(lastUpdated)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "text-[11px] font-bold px-3 py-1 rounded-full border shrink-0",
                        status === "pending" && "border-[#FFB64D] bg-[#FFF8EE] text-[#FFB64D]",
                        status === "open" && "border-[#39DA8A] bg-[#EAFBF3] text-[#39DA8A]",
                        status === "answered" && "border-[#006EA8] bg-[#F0F9FF] text-[#006EA8]",
                        status === "closed" && "border-[#FF5B5C] bg-[#FFF5F5] text-[#FF5B5C]",
                        status === "rejected" && "border-[#FF5B5C] bg-[#FFF5F5] text-[#FF5B5C]"
                      )}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </div>
                </div>

                {/* ── Inline Collapsible Message Body ── */}
                {messageText && (
                  <div className="border-t border-gray-100">
                    {/* Toggle button */}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(ticket.id, e)}
                      className="w-full flex items-center justify-between px-6 py-2.5 text-xs font-semibold text-[#006EA8] hover:bg-[#F0F9FF] transition-colors"
                    >
                      <span>{isAr ? "نص الرسالة" : isDe ? "Nachrichtentext" : "Message Body"}</span>
                      {isExpanded
                        ? <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                        : <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4 bg-[#F8FBFF]">
                        <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                          {messageText}
                        </p>
                      </div>
                    )}

                    {!isExpanded && (
                      <div className="px-6 pb-4">
                        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                          {isLong ? messageText.slice(0, MSG_PREVIEW) + "…" : messageText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Card Footer: Attachment + "Review" hint ── */}
                <div
                  onClick={() => handleOpenDetail(ticket.id)}
                  className="flex items-center justify-between px-6 py-3 border-t border-gray-100 cursor-pointer"
                >
                  {attachment ? (
                    <div className="flex items-center gap-2 text-xs text-[#006EA8] truncate">
                      <img src="/portfolio/pdf.svg" alt="File" className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate font-semibold">{getFilenameFromUrl(attachment)}</span>
                    </div>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-[#40A0CA] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAr ? "مراجعة والتفاصيل ←" : isDe ? "Überprüfen & Details →" : "Review & Details →"}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
            <img src="/portfolio/drop.svg" alt="Empty" className="w-16 h-16 mx-auto opacity-40 mb-4" />
            <p className="text-gray-500 font-medium">
              {isAr ? "لا توجد تذاكر دعم فني تطابق البحث حالياً" : isDe ? "Derzeit entsprechen keine Support-Tickets den Filtern" : "No support tickets match the current filters"}
            </p>
          </div>
        )}
      </div>

      {/* ── Ticket Detail/Reply Modal ── */}
      <AdminTicketDetail
        ticketId={selectedTicketId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedTicketId(null)
        }}
        locale={locale}
        onTicketUpdated={fetchTickets}
      />

      <AdminCreateTicketDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        locale={locale}
        onCreated={() => {
          fetchTickets()
        }}
      />
    </div>
  )
}
