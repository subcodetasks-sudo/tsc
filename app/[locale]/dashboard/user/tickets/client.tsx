"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardPageShell } from "@/features/dashboard/components/dashboard-page-shell";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { useTicketChat, TicketChatThread } from "@/features/tickets";
import type { Ticket, PaginationMeta } from "@/lib/api/types";
import { Trash2 } from "lucide-react";

type Props = {
  locale: string;
  initialTickets: Ticket[];
  initialMeta: PaginationMeta | null;
};

type StatusFilter = "all" | "pending" | "open" | "closed";

export default function TicketsClient({ locale, initialTickets, initialMeta }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [meta, setMeta] = useState<PaginationMeta | null>(initialMeta);
  const [loadingList, setLoadingList] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail / reply states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { ticket: chatTicket, messages, loading: loadingDetail, sending, sendMessage } = useTicketChat({
    ticketId: selectedTicket?.id ?? null,
    role: "user",
    locale,
    enabled: showDetailModal,
  });
  const activeTicket = chatTicket || selectedTicket;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Delete state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
  const [message, setMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const fetchTickets = async (page = meta?.current_page || 1) => {
    try {
      setLoadingList(true);
      const res = await fetch(`/api/user/tickets?locale=${locale}&page=${page}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.data || []);
        setMeta(data.meta || null);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isAr ? "حجم الملف يجب أن يكون أقل من 10 ميجا بايت" : isDe ? "Dateigröße muss weniger als 10 MB betragen" : "File size should be less than 10MB");
      return;
    }
    setAttachmentFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error(isAr ? "الرجاء إدخال موضوع التذكرة" : isDe ? "Bitte geben Sie den Betreff des Tickets ein" : "Please enter the ticket subject");
      return;
    }
    if (!message.trim()) {
      toast.error(isAr ? "الرجاء إدخال نص الرسالة" : isDe ? "Bitte geben Sie den Inhalt der Nachricht ein" : "Please enter the message content");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("priority", priority);
      if (attachmentFile) {
        formData.append("file", attachmentFile);
      }

      const res = await fetch("/api/user/tickets", {
        method: "POST",
        headers: {
          "Accept-Language": locale,
        },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to create ticket");
      }

      toast.success(isAr ? "تم إنشاء التذكرة بنجاح" : isDe ? "Ticket erfolgreich erstellt" : "Ticket created successfully");
      setShowNewTicketModal(false);

      // Reset form
      setSubject("");
      setMessage("");
      setPriority("high");
      setAttachmentFile(null);

      // Refresh list from page 1 so the new ticket is visible
      await fetchTickets(1);
    } catch (err) {
      console.error("[Create ticket error]", err);
      const errMessage = err instanceof Error ? err.message : undefined;
      toast.error(errMessage || (isAr ? "فشل إنشاء التذكرة" : isDe ? "Fehler beim Erstellen des Tickets" : "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open ticket detail ── (full detail + replies are loaded by useTicketChat)
  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleDetailModalOpenChange = (open: boolean) => {
    setShowDetailModal(open);
    if (!open) {
      setSelectedTicket(null);
      // Pick up any status/last-reply changes made while the chat was open
      fetchTickets();
    }
  };

  // ── Delete ticket ──
  const handleDeleteTicket = async (ticketId: number) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/user/tickets/${ticketId}`, {
        method: "DELETE",
        headers: { "Accept-Language": locale },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete ticket");
      }

      toast.success(isAr ? "تم حذف التذكرة بنجاح" : isDe ? "Ticket erfolgreich gelöscht" : "Ticket deleted successfully");
      setShowDetailModal(false);
      setSelectedTicket(null);
      setDeleteTargetId(null);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setMeta((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
    } catch (err) {
      console.error("[Delete ticket error]", err);
      const errMessage = err instanceof Error ? err.message : undefined;
      toast.error(errMessage || (isAr ? "فشل حذف التذكرة" : isDe ? "Fehler beim Löschen des Tickets" : "Failed to delete ticket"));
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityLabel = (pri: string) => {
    const map: Record<string, string> = {
      high: isAr ? "عالي" : isDe ? "Hoch" : "High",
      medium: isAr ? "متوسط" : isDe ? "Mittel" : "Medium",
      low: isAr ? "منخفض" : isDe ? "Niedrig" : "Low",
    };
    return map[pri] || pri;
  };

  const getPriorityColor = (pri: string) => {
    if (pri === "high") return "bg-red-600";
    if (pri === "medium") return "bg-amber-500";
    return "bg-green-500";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: isAr ? "معلق" : isDe ? "Ausstehend" : "Pending",
      open: isAr ? "مفتوح" : isDe ? "Offen" : "Open",
      answered: isAr ? "تم الرد" : isDe ? "Beantwortet" : "Answered",
      closed: isAr ? "مغلق" : isDe ? "Geschlossen" : "Closed",
      rejected: isAr ? "مرفوض" : isDe ? "Abgelehnt" : "Rejected",
    };
    return map[status] || status;
  };

  const getFilenameFromUrl = (url?: string | null) => {
    if (!url) return "";
    return url.substring(url.lastIndexOf("/") + 1);
  };

  const formatLastReply = (dateStr?: string) => {
    if (!dateStr) return isAr ? "منذ فترة" : isDe ? "vor einiger Zeit" : "some time ago";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        if (isAr) return `منذ ${diffMins} دقيقة`;
        return isDe ? `vor ${diffMins} Minuten` : `${diffMins} minutes ago`;
      }
      if (diffHours < 24) {
        if (isAr) return `منذ ${diffHours} ساعة`;
        return isDe ? `vor ${diffHours} Stunden` : `${diffHours} hours ago`;
      }
      if (diffDays < 30) {
        if (isAr) {
          if (diffDays === 1) return "منذ يوم واحد";
          if (diffDays === 2) return "منذ يومين";
          if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
          return `منذ ${diffDays} يومًا`;
        }
        return isDe ? `vor ${diffDays} Tagen` : `${diffDays} days ago`;
      }
      return isAr ? "منذ أكثر من شهر" : isDe ? "vor über 1 Monat" : "over 1 month ago";
    } catch {
      return isAr ? "منذ فترة" : isDe ? "vor einiger Zeit" : "some time ago";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : isDe ? "de-DE" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Status counts — "all" reflects the true server-side total, the rest reflect the loaded page
  const statusCounts = {
    all: meta?.total ?? tickets.length,
    pending: tickets.filter((t) => (t.status || "pending") === "pending").length,
    open: tickets.filter((t) => t.status === "open" || t.status === "answered").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  // Filtered list (within the currently loaded page)
  const filteredTickets =
    statusFilter === "all"
      ? tickets
      : tickets.filter((t) => {
        const status = t.status || "pending";
        if (statusFilter === "open") {
          return status === "open" || status === "answered";
        }
        return status === statusFilter;
      });

  const gradientTitleClasses = cn(
    "bg-clip-text text-transparent font-bold",
    isAr ? "bg-gradient-to-r" : "bg-gradient-to-l",
    "from-[#032C44] to-[#41A0CA]"
  );

  return (
    <DashboardPageShell
      title={isAr ? "الدعم الفني والتذاكر" : isDe ? "Tickets & Support" : "Tickets & Support"}
      description={isAr ? "تابع تذاكر الدعم الفني الخاصة بك واستفساراتك" : isDe ? "Verfolgen Sie Ihre Support-Tickets und Anfragen" : "Track your support tickets and inquiries"}
      isRTL={isAr}
      action={
        <PrimaryButton
          onClick={() => setShowNewTicketModal(true)}
          className="h-9 rounded-lg px-4 w-auto text-sm"
        >
          <span className="text-[16px] font-bold me-1">+</span>
          <span>{isAr ? "تذكرة جديدة" : isDe ? "Neues Ticket" : "New Ticket"}</span>
        </PrimaryButton>
      }
    >
      <div className="w-full space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>

        {/* ── Status Filter Tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "open", "closed"] as const).map((status) => {
            const labels: Record<string, string> = {
              all: isAr ? "الكل" : isDe ? "Alle" : "All",
              pending: isAr ? "معلق" : isDe ? "Ausstehend" : "Pending",
              open: isAr ? "مفتوح" : isDe ? "Offen" : "Open",
              closed: isAr ? "مغلق" : isDe ? "Geschlossen" : "Closed",
            };
            const count = statusCounts[status];
            const isActive = statusFilter === status;
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
            );
          })}
        </div>

        {/* Tickets List */}
        <div className={cn("space-y-4", loadingList && "opacity-60 pointer-events-none")}>
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => {
              const lastUpdated = ticket.updated_at || ticket.created_at;
              const status = ticket.status || "pending";
              const attachments = ticket.attachments || [];

              return (
                <div
                  key={ticket.id}
                  onClick={() => openTicketDetail(ticket)}
                  className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#40A0CA]/40 transition-all space-y-4 cursor-pointer group text-start"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[17px] font-bold text-[#032C44] group-hover:text-[#006EA8] transition-colors truncate">
                          {ticket.subject}
                        </h3>
                        {/* Priority badge */}
                        <span className={cn(
                          "text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full normal-case
",
                          getPriorityColor(ticket.priority || "high")
                        )}>
                          {getPriorityLabel(ticket.priority || "high")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        {isAr ? "آخر تحديث:" : isDe ? "Letztes Update:" : "Last Update:"} {ticket.last_reply || formatLastReply(lastUpdated)}
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

                  {/* Message body */}
                  <p className="text-[14px] text-gray-600 leading-relaxed line-clamp-2">
                    {ticket.message}
                  </p>

                  {/* Footer: Attachment + View Detail hint */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {attachments.length > 0 ? (
                      <div className="flex items-center gap-2 text-xs text-[#006EA8] truncate">
                        <img src="/portfolio/pdf.svg" alt="File Icon" className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate font-semibold">
                          {getFilenameFromUrl(attachments[0])}
                          {attachments.length > 1 && ` +${attachments.length - 1}`}
                        </span>
                      </div>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-[#40A0CA] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAr ? "عرض التفاصيل →" : isDe ? "Details anzeigen →" : "View Details →"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
              <img src="/portfolio/drop.svg" alt="Empty" className="w-16 h-16 mx-auto opacity-40 mb-4" />
              <p className="text-gray-500 font-medium">
                {statusFilter === "all"
                  ? (isAr ? "لا توجد تذاكر دعم فني مفتوحة حالياً" : isDe ? "Derzeit keine Support-Tickets offen" : "No support tickets open at the moment")
                  : (isAr ? "لا توجد تذاكر بهذه الحالة" : isDe ? "Keine Tickets mit diesem Status" : "No tickets with this status")}
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <AdminPagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            onPageChange={(page) => fetchTickets(page)}
            isAr={isAr}
            summary={
              isAr
                ? `الصفحة ${meta.current_page} من ${meta.last_page} · ${meta.total} تذكرة`
                : `Page ${meta.current_page} of ${meta.last_page} · ${meta.total} tickets`
            }
          />
        )}

        {/* ── TICKET DETAIL / CHAT MODAL ── */}
        <Dialog open={showDetailModal} onOpenChange={handleDetailModalOpenChange}>
          <DialogContent className="max-w-[600px] lg:max-w-[750px] p-0 rounded-[20px] bg-white border-0 shadow-lg h-[90vh] overflow-hidden flex flex-col text-start">
            {activeTicket && (
              <>
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogTitle className={cn("text-[18px] leading-snug", gradientTitleClasses)}>
                      {activeTicket.subject}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn(
                        "text-[11px] font-bold px-3 py-1 rounded-full border",
                        (activeTicket.status || "pending") === "pending" && "border-[#FFB64D] bg-[#FFF8EE] text-[#FFB64D]",
                        (activeTicket.status || "pending") === "open" && "border-[#39DA8A] bg-[#EAFBF3] text-[#39DA8A]",
                        (activeTicket.status || "pending") === "answered" && "border-[#006EA8] bg-[#F0F9FF] text-[#006EA8]",
                        (activeTicket.status || "pending") === "closed" && "border-[#FF5B5C] bg-[#FFF5F5] text-[#FF5B5C]"
                      )}>
                        {getStatusLabel(activeTicket.status || "pending")}
                      </span>
                      <span className={cn(
                        "text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full normal-case
",
                        getPriorityColor(activeTicket.priority || "high")
                      )}>
                        {getPriorityLabel(activeTicket.priority || "high")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(activeTicket.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTargetId(activeTicket.id); }}
                      className="p-1.5 hover:bg-red-50 rounded-full transition cursor-pointer group/del"
                      title={isAr ? "حذف التذكرة" : isDe ? "Ticket löschen" : "Delete ticket"}
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 group-hover/del:text-[#FF5B5C] transition-colors" />
                    </button>
                    <button
                      onClick={() => handleDetailModalOpenChange(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition cursor-pointer shrink-0"
                    >
                      <img src="/portfolio/close-circle.svg" alt="Close" className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                {/* Original message */}
                <div className="px-6 pt-4 space-y-3 shrink-0">
                  <div className="rounded-[12px] bg-[#F4FAFF] border border-[#E0F0FF] p-4">
                    <p className="text-xs font-semibold text-[#006EA8] mb-2">
                      {isAr ? "الرسالة الأصلية" : isDe ? "Originalnachricht" : "Original Message"}
                    </p>
                    <p className="text-[14px] text-[#032C44] leading-relaxed whitespace-pre-wrap">
                      {activeTicket.message}
                    </p>
                  </div>

                  {(activeTicket.attachments || []).length > 0 && (
                    <div className="space-y-2">
                      {(activeTicket.attachments || []).map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#006EA8]">
                          <img src="/portfolio/pdf.svg" alt="File" className="w-5 h-5 flex-shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-semibold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getFilenameFromUrl(url)}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real-time chat thread */}
                <div className="flex-1 min-h-0">
                  <TicketChatThread
                    messages={messages}
                    loading={loadingDetail}
                    sending={sending}
                    disabled={(activeTicket.status || "pending") === "closed"}
                    locale={locale}
                    onSend={sendMessage}
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* NEW TICKET MODAL */}
        <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
          <DialogContent className="max-w-[550px] p-6 rounded-[20px] bg-white border-0 shadow-lg max-h-[90vh] overflow-y-auto text-start">
            <div className="flex items-center justify-between mb-5">
              <DialogTitle className={gradientTitleClasses}>
                {isAr ? "تذكرة جديدة" : isDe ? "Neues Ticket" : "New Ticket"}
              </DialogTitle>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <img src="/portfolio/close-circle.svg" alt="Close" className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject and Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[14px] font-bold text-[#032C44]">
                    {isAr ? "الموضوع *" : isDe ? "Betreff *" : "Subject *"}
                  </label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={isAr ? "موضوع التذكرة" : isDe ? "Ticket-Betreff" : "Ticket Subject"}
                    className="border border-[#E5E7EB] focus:border-[#40A0CA] rounded-[8px] px-3 py-2 text-sm w-full outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[14px] font-bold text-[#032C44]">
                    {isAr ? "الأولوية *" : isDe ? "Priorität *" : "Priority *"}
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                      className="appearance-none border border-[#E5E7EB] focus:border-[#40A0CA] bg-white rounded-[8px] px-3 py-2 pr-8 text-sm w-full outline-none text-[#032C44]"
                    >
                      <option value="high">{isAr ? "عالي" : isDe ? "Hoch" : "High"}</option>
                      <option value="medium">{isAr ? "متوسط" : isDe ? "Mittel" : "Medium"}</option>
                      <option value="low">{isAr ? "منخفض" : isDe ? "Niedrig" : "Low"}</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <img src="/portfolio/arrow-down.svg" alt="Select" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1">
                <label className="text-[14px] font-bold text-[#032C44]">
                  {isAr ? "نص الرسالة *" : isDe ? "Nachricht *" : "Message *"}
                </label>
                <Textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAr ? "اكتب تفاصيل المشكلة أو الاستفسار هنا..." : isDe ? "Beschreiben Sie Ihr Problem oder Ihre Anfrage hier..." : "Write details about your issue here..."}
                  className="border border-[#E5E7EB] focus:border-[#40A0CA] rounded-[8px] px-3 py-2 text-sm w-full outline-none resize-none"
                />
              </div>

              {/* File Upload Zone */}
              <div className="space-y-1">
                <label className="text-[14px] font-bold text-[#032C44]">
                  {isAr ? "المرفقات" : isDe ? "Anhänge" : "Attachments"}
                </label>
                <div
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-[#40A0CA] bg-[#F4FAFF] hover:bg-[#EBF7FF] transition rounded-[12px] py-8 px-4 flex flex-col items-center justify-center cursor-pointer text-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <img src="/portfolio/drop.svg" alt="Upload" className="w-[42px] h-[42px] mb-2" />
                  <p className="text-[#032C44] text-[13px] font-medium">
                    {attachmentFile ? (
                      <span className="text-[#006EA8]">{attachmentFile.name}</span>
                    ) : isAr ? (
                      <>قم بسحب الملف هنا، أو <span className="text-[#006EA8] underline">تصفح</span></>
                    ) : isDe ? (
                      <>Datei hierher ziehen oder <span className="text-[#006EA8] underline">durchsuchen</span></>
                    ) : (
                      <>Drop a file, or <span className="text-[#006EA8] underline">browse</span></>
                    )}
                  </p>
                  <p className="text-[#6B7280] text-[10px] mt-1.5">
                    {isAr
                      ? "حجم الملف أقل من 10MB وصيغ الملفات المقبولة pdf, png, jpg, jpeg"
                      : isDe ? "Dateigröße unter 10MB und erlaubte Formate pdf, png, jpg, jpeg" : "File size should be less than 10MB and file type should be jpg, jpeg, png, pdf"}
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-10 h-[44px] border border-[#006EA8] text-[#006EA8] bg-white hover:bg-[#F0F9FF] font-bold rounded-[12px] text-[15px] transition cursor-pointer"
                >
                  {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
                </button>
                <PrimaryButton
                  type="submit"
                  disabled={submitting}
                  className="px-10 w-auto cursor-pointer"
                >
                  {isAr ? "إرسال التذكرة" : isDe ? "Ticket senden" : "Submit"}
                </PrimaryButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── DELETE TICKET CONFIRMATION ── */}
        <Dialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
          <DialogContent className="max-w-[400px] p-6 rounded-[20px] bg-white border-0 shadow-lg text-start" dir={isAr ? "rtl" : "ltr"}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-s-4 border-[#FF5B5C] ps-3 -ms-6">
                <DialogTitle className="text-[18px] font-bold text-[#032C44]">
                  {isAr ? "حذف التذكرة" : isDe ? "Ticket löschen" : "Delete Ticket"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-[14px] text-gray-600 leading-relaxed">
                {isAr
                  ? "هل أنت متأكد أنك تريد حذف هذه التذكرة؟ لا يمكن التراجع عن هذا الإجراء."
                  : isDe ? "Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
                    : "Are you sure you want to delete this ticket? This action cannot be undone."}
              </DialogDescription>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteTargetId(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-[10px] text-sm font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
                >
                  {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
                </button>
                <button
                  disabled={deleting}
                  onClick={() => { if (deleteTargetId !== null) handleDeleteTicket(deleteTargetId); }}
                  className="px-5 py-2 bg-[#FF5B5C] hover:bg-[#E04F50] text-white rounded-[10px] text-sm font-semibold transition cursor-pointer disabled:opacity-60 shadow-[0_4px_12px_rgba(255,91,92,0.2)]"
                >
                  {deleting ? (isAr ? "جاري الحذف..." : isDe ? "Wird gelöscht..." : "Deleting...") : (isAr ? "تأكيد الحذف" : isDe ? "Löschen bestätigen" : "Confirm Delete")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardPageShell>
  );
}
