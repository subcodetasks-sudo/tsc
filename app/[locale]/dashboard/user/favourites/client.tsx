"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Trash2, Briefcase } from "lucide-react";
import { translateEmploymentType } from "@/features/jobs/lib/job-display";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  locale: string;
  initialJobs: any[];
};

export default function FavouritesClient({ locale, initialJobs }: Props) {
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const isAr = locale === "ar";
  const isDe = locale === "de";

  const handleDelete = async (jobId: number) => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to remove from favorites");
      }

      toast.success(isAr ? "تم إزالة الوظيفة من المفضلة" : isDe ? "Job aus den Favoriten entfernt" : "Job removed from favorites");
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err: any) {
      console.error("[Delete favourite error]", err);
      toast.error(err.message || (isAr ? "فشل إزالة الوظيفة" : isDe ? "Fehler beim Entfernen des Jobs" : "Failed to remove job"));
    } finally {
      setLoading(false);
      setDeleteTargetId(null);
    }
  };

  const getCompanyLogo = (logoUrl?: string | null) => {
    if (!logoUrl) return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23006EA8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:%23E0F2FE;width:100%;height:100%;padding:25%;box-sizing:border-box;border-radius:50%"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
    if (logoUrl.startsWith("http")) return logoUrl;
    return logoUrl;
  };

  const gradientTitleClasses = cn(
    "bg-clip-text text-transparent font-bold text-xl",
    isAr ? "bg-gradient-to-r" : "bg-gradient-to-l",
    "from-[#032C44] to-[#41A0CA]"
  );

  return (
    <div className="w-full space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      {/* Page content: list of favourite jobs (header provided by DashboardPageShell) */}

      <div className="w-full">
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const companyName = job.company?.name || "—";
              const categoryName = job.category?.name || job.company?.company_type?.name || "—";
              const logo = getCompanyLogo(job.company?.logo);
              const salaryFrom = job.salary_from;
              const salaryTo = job.salary_to;
              const salaryLabel = salaryFrom != null && salaryTo != null
                ? `€${salaryFrom} - €${salaryTo}`
                : salaryFrom != null ? `€${salaryFrom}` : salaryTo != null ? `€${salaryTo}` : null;
              const employmentType = translateEmploymentType(job.employment_type || job.job_type, locale) || (isAr ? "دوام كامل" : isDe ? "Vollzeit" : "Full-time");
              const salaryPeriod = isAr ? "/سنوياً" : isDe ? "/Jahr" : "/year";
              const companySubLabel = job.category?.name || job.company?.company_type?.name || "";

              return (
                <div
                  key={job.id}
                  className="rounded-[16px] border border-[#78A3BE]/40 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full"
                >
                  <div className="space-y-3">
                    {/* Title + category badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[17px] font-bold text-[#032C44] leading-snug line-clamp-2">
                        {typeof job.title === "object" ? (job.title[locale] || job.title.en || job.title.ar || "") : job.title}
                      </h3>
                      <span className="rounded-full bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)] px-3 py-1 text-[11px] font-semibold text-white shrink-0">
                        {categoryName}
                      </span>
                    </div>

                    {/* Employment type + salary */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[#002B46]">{employmentType}</span>
                      {salaryLabel && (
                        <p className="text-[14px] font-medium text-[#40A0CA]">
                          <span dir="ltr">{salaryLabel}</span>
                          <span className="text-[12px]">{salaryPeriod}</span>
                        </p>
                      )}
                    </div>

                    {/* Company info */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-gray-50 border border-[#78A3BE]/30 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={logo}
                          alt={companyName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23006EA8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:%23E0F2FE;width:100%;height:100%;padding:25%;box-sizing:border-box;border-radius:50%"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#032C44]">{companyName}</p>
                        {companySubLabel && <p className="text-[12px] text-gray-500">{companySubLabel}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-100 items-center">
                    <button
                      onClick={() => setDeleteTargetId(job.id)}
                      disabled={loading}
                      className="h-[42px] border border-[#FF5B5C] hover:bg-[#FFF5F5] text-[#FF5B5C] rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isAr ? "حذف" : isDe ? "Löschen" : "Delete"}</span>
                    </button>

                    <Link href={`/jobs/${job.id}`} className="w-full flex-1">
                      <PrimaryButton
                        type="button"
                        className="h-[42px] rounded-[10px] text-xs w-full flex items-center justify-center gap-2"
                      >
                        <Briefcase className="w-4 h-4 text-white inline-block" />
                        <span>{isAr ? "التفاصيل" : isDe ? "Details" : "Details"}</span>
                      </PrimaryButton>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
            <img src="/portfolio/drop.svg" alt="Empty" className="w-16 h-16 mx-auto opacity-40 mb-4" />
            <p className="text-gray-500 font-medium">
              {isAr ? "لا توجد وظائف مفضلة حالياً" : isDe ? "Derzeit keine gespeicherten Jobs" : "No saved jobs at the moment"}
            </p>
            <Link
              href="/jobs"
              className="inline-block mt-4 text-xs font-bold text-[#006EA8] hover:underline"
            >
              {isAr ? "تصفح الوظائف المتاحة" : isDe ? "Verfügbare Jobs durchsuchen" : "Browse available jobs"}
            </Link>
          </div>
        )}
      </div>

      <Dialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
        <DialogContent className="max-w-[400px] p-6 rounded-[20px] bg-white border-0 shadow-lg text-start" dir={isAr ? "rtl" : "ltr"}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-s-4 border-[#FF5B5C] ps-3 -ms-6">
              <DialogTitle className="text-[18px] font-bold text-[#032C44]">
                {isAr ? "تأكيد الحذف" : isDe ? "Löschen bestätigen" : "Confirm Deletion"}
              </DialogTitle>
            </div>
            
            <DialogDescription className="text-[14px] text-gray-600 leading-relaxed">
              {isAr
                ? "هل أنت متأكد أنك تريد حذف هذه الوظيفة من قائمة المفضلة؟"
                : isDe ? "Sind Sie sicher, dass Sie diesen Job aus Ihren Favoriten löschen möchten?" : "Are you sure you want to delete this job from your favorites?"}
            </DialogDescription>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                disabled={loading}
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-[10px] text-sm font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
              >
                {isAr ? "إلغاء" : isDe ? "Abbrechen" : "Cancel"}
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  if (deleteTargetId !== null) {
                    handleDelete(deleteTargetId);
                  }
                }}
                className="px-5 py-2 bg-[#FF5B5C] hover:bg-[#E04F50] text-white rounded-[10px] text-sm font-semibold transition cursor-pointer disabled:opacity-60 shadow-[0_4px_12px_rgba(255,91,92,0.2)]"
              >
                {loading ? (isAr ? "جاري الحذف..." : isDe ? "Wird gelöscht..." : "Deleting...") : (isAr ? "تأكيد" : isDe ? "Bestätigen" : "Confirm")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}