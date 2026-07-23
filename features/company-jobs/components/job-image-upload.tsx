"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { compressImageFile } from "@/lib/images/compress-image"
import { cn } from "@/lib/utils"

type JobImageUploadProps = {
  file: File | null
  previewUrl: string | null
  onChange: (file: File | null, previewUrl: string | null) => void
  label: string
  hint: string
  removeLabel: string
  compressingLabel: string
  sizeHintLabel: string
  tooLargeLabel: string
  compressFailedLabel: string
  /** Website display aspect ratio, e.g. "21:9" */
  aspectRatio?: string
  error?: string
  className?: string
  required?: boolean
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg"
const MAX_INPUT_BYTES = 12 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function JobImageUpload({
  file,
  previewUrl,
  onChange,
  label,
  hint,
  removeLabel,
  compressingLabel,
  sizeHintLabel,
  tooLargeLabel,
  compressFailedLabel,
  aspectRatio = "21:9",
  error,
  className,
  required = true,
}: JobImageUploadProps) {
  const tMedia = useTranslations("Admin.mediaUpload")
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  const displayError = error ?? localError

  const handleFile = async (next: File | null) => {
    setLocalError(null)
    if (!next) {
      onChange(null, null)
      return
    }
    if (!next.type.startsWith("image/")) return
    if (next.size > MAX_INPUT_BYTES) {
      setLocalError(tooLargeLabel)
      return
    }

    setCompressing(true)
    try {
      const compressed = await compressImageFile(next)
      const url = URL.createObjectURL(compressed)
      onChange(compressed, url)
    } catch (err) {
      console.error(err)
      setLocalError(compressFailedLabel)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className="flex items-center gap-0.5 text-start">
        <span className="text-base font-medium leading-[150%] text-[#262626]">{label}</span>
        {required ? (
          <span className="text-base font-medium leading-[150%] text-[#FF2D55]">*</span>
        ) : null}
      </div>

      <div className="rounded-[16px] border border-[#E8F2FF] bg-[#F8FBFD] p-4 sm:p-5">
        <div className="flex flex-col gap-4 items-stretch">
          <button
            type="button"
            disabled={compressing}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "group relative flex w-full items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#78A3BE] bg-white transition",
              "hover:border-[#40A0CA] hover:shadow-[0_8px_24px_rgba(0,110,168,0.08)]",
              previewUrl ? "border-solid border-[#D4D4D4]" : "py-6",
              compressing && "pointer-events-none opacity-70"
            )}
            style={{ aspectRatio: aspectRatio.replace(":", " / ") }}
          >
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, 380px"
                  unoptimized
                />
                <span className="absolute inset-0 flex items-center justify-center bg-[#001222]/0 opacity-0 transition group-hover:bg-[#001222]/35 group-hover:opacity-100">
                  <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-[#006EA8] shadow-md">
                    {hint}
                  </span>
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center justify-center gap-3 px-6 text-center w-full">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#E8F2FF] text-[#006EA8]">
                  {compressing ? (
                    <Loader2 className="size-6 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="size-6" aria-hidden />
                  )}
                </span>
                <span className="text-sm text-[#525252]">
                  {compressing ? compressingLabel : hint}
                </span>
              </span>
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 text-start text-sm text-[#525252]">
            <p>{sizeHintLabel}</p>
            {aspectRatio ? (
              <p className="text-xs font-medium text-[#006EA8]">
                {tMedia("aspectRatio", { ratio: aspectRatio })}
              </p>
            ) : null}
            {file ? (
              <>
                <div className="rounded-lg border border-[#E8F2FF] bg-white px-3 py-2">
                  <p className="truncate font-medium text-[#171717]">{file.name}</p>
                  <p className="mt-1 text-xs text-[#737373]">{formatBytes(file.size)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => inputRef.current?.click()}
                    className="text-[#006EA8] underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {hint}
                  </button>
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => handleFile(null)}
                    className="text-[#FF2D55] hover:underline disabled:opacity-50"
                  >
                    {removeLabel}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          void handleFile(picked)
          e.target.value = ""
        }}
      />

      {displayError ? (
        <p className="text-sm text-[#FF2D55]" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
