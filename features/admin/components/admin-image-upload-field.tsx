"use client"

import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { ImageIcon, Loader2, Pencil } from "lucide-react"
import { ImageDownloadButton } from "@/components/image-download-button"
import { compressImageFile } from "@/lib/images/compress-image"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function toCssAspectRatio(ratio: string): string {
  return ratio.replace(":", " / ")
}

export function AdminImageUploadField({
  title,
  imageSrc,
  hasNewFile,
  onSelect,
  onRemove,
  onError,
  shape = "rect",
  aspectRatio,
  /** When true, accept any image MIME type (image/*) instead of PNG/JPG/WEBP only. */
  acceptAllImages = false,
  /** When set, shows a locale badge so editors know which language this image belongs to. */
  locale,
}: {
  title: string
  imageSrc: string | null
  hasNewFile: boolean
  onSelect: (file: File) => void
  onRemove: () => void
  onError: (message: string) => void
  shape?: "rect" | "circle"
  /** Website display aspect ratio, e.g. "21:9" or "1:1" */
  aspectRatio?: string
  acceptAllImages?: boolean
  locale?: string
}) {
  const t = useTranslations("Admin.mediaUpload")
  const [compressing, setCompressing] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const isAllowed = acceptAllImages
      ? file.type.startsWith("image/")
      : ALLOWED_TYPES.includes(file.type)

    if (!isAllowed) {
      onError(acceptAllImages ? t("errors.unsupportedImageType") : t("errors.unsupportedFileType"))
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError(t("errors.fileTooLarge"))
      return
    }

    // CMS forms post one image per locale in a single multipart request, so
    // shrink here to keep the upload well inside the request timeout.
    setCompressing(true)
    try {
      onSelect(await compressImageFile(file))
    } catch {
      onSelect(file)
    } finally {
      setCompressing(false)
    }
  }

  const isCircle = shape === "circle"
  const frameClass = isCircle
    ? "h-24 w-24 rounded-full"
    : aspectRatio
      ? "w-full max-w-md rounded-xl"
      : "w-full h-56 sm:h-48 md:h-56 rounded-xl"
  const frameStyle =
    !isCircle && aspectRatio ? { aspectRatio: toCssAspectRatio(aspectRatio) } : undefined

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
        <ImageIcon className="h-4 w-4 text-[#006EA8]" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#006EA8]">{title}</p>
        {locale ? (
          <span className="rounded bg-[#EAF4FB] px-1.5 py-0.5 text-xs font-bold text-[#006EA8]">
            {locale.toUpperCase()}
          </span>
        ) : null}
      </div>
      <div className={isCircle ? "flex flex-wrap items-center gap-4" : "flex flex-col items-center gap-4"}>
        {imageSrc ? (
          <div
            className={`relative overflow-hidden border border-[#E5E7EB] bg-gray-50 shadow-sm ${frameClass}`}
            style={frameStyle}
          >
            <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center border border-dashed border-[#78A3BE] bg-[#F8FBFF] ${frameClass}`}
            style={frameStyle}
          >
            <ImageIcon className={isCircle ? "h-8 w-8 text-[#78A3BE]" : "h-10 w-10 text-[#78A3BE]"} />
          </div>
        )}

        <div className={isCircle ? "space-y-2" : "flex flex-col items-center gap-2 w-full"}>
          <div className={isCircle ? "flex flex-wrap items-center gap-2" : "flex flex-wrap items-center justify-center gap-2"}>
            <label className={compressing ? "cursor-wait" : "cursor-pointer"}>
              <span className="inline-flex items-center gap-2 rounded-lg border border-[#006EA8] px-4 py-2 text-sm font-medium text-[#006EA8] hover:bg-[#006EA8]/10 transition-colors mx-auto">
                {compressing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {compressing ? t("compressing") : imageSrc ? t("change") : t("upload")}
              </span>
              <input
                type="file"
                accept={acceptAllImages ? "image/*" : "image/png,image/jpeg,image/jpg,image/webp"}
                className="hidden"
                disabled={compressing}
                onChange={handleFileChange}
              />
            </label>
            {imageSrc ? <ImageDownloadButton src={imageSrc} /> : null}
          </div>

          {hasNewFile && (
            <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
              {t("remove")}
            </button>
          )}

          <p className="text-xs text-[#9CA3AF]">{acceptAllImages ? t("hintAll") : t("hint")}</p>
          {aspectRatio ? (
            <p className="text-xs font-medium text-[#006EA8]">{t("aspectRatio", { ratio: aspectRatio })}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
