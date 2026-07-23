"use client"

import { useRef } from "react"
import { Tag, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export function CategoryIconUpload({
  iconSrc,
  hasNewFile,
  labels,
  onChange,
  onRemove,
  onError,
  aspectRatio = "1:1",
}: {
  iconSrc: string | null
  hasNewFile: boolean
  labels: { icon: string; changeIcon: string; uploadIcon: string; remove: string }
  onChange: (file: File) => void
  onRemove: () => void
  onError?: (message: string) => void
  aspectRatio?: string
}) {
  const tMedia = useTranslations("Admin.mediaUpload")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.(tMedia("errors.unsupportedFileType"))
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError?.(tMedia("errors.fileTooLarge"))
      return
    }

    onChange(file)
  }

  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-[#006EA8]">{labels.icon}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#78A3BE] bg-white">
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconSrc} alt="" className="h-7 w-7 object-contain" />
          ) : (
            <Tag className="h-6 w-6 text-[#78A3BE]" />
          )}
        </div>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#006EA8] px-3 py-1.5 text-sm font-medium text-[#006EA8] hover:bg-[#006EA8]/10 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
            {iconSrc ? labels.changeIcon : labels.uploadIcon}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {hasNewFile && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
            {labels.remove}
          </button>
        )}
      </div>
      <p className="text-[11px] text-[#9CA3AF]">{tMedia("hint")}</p>
      {aspectRatio ? (
        <p className="text-[11px] font-medium text-[#006EA8]">
          {tMedia("aspectRatio", { ratio: aspectRatio })}
        </p>
      ) : null}
    </div>
  )
}
