"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { downloadImage } from "@/lib/images/download-image"
import { cn } from "@/lib/utils"

type ImageDownloadButtonProps = {
  src: string | null | undefined
  filename?: string
  className?: string
  /** Visual size of the control — `md` matches Change/Upload buttons */
  size?: "sm" | "md" | "icon"
  label?: string
}

export function ImageDownloadButton({
  src,
  filename = "image.jpg",
  className,
  size = "md",
  label,
}: ImageDownloadButtonProps) {
  const t = useTranslations("Admin.mediaUpload")
  const [pending, setPending] = useState(false)

  if (!src) return null

  const text = label ?? t("download")

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!src || pending) return
    setPending(true)
    try {
      await downloadImage(src, filename)
    } finally {
      setPending(false)
    }
  }

  if (size === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        title={text}
        aria-label={text}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#006EA8] bg-white text-[#006EA8] shadow-sm transition-colors hover:bg-[#006EA8]/10 disabled:opacity-50",
          className
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-[#006EA8] font-medium text-[#006EA8] transition-colors hover:bg-[#006EA8]/10 disabled:opacity-50",
        size === "md" && "px-4 py-2 text-sm",
        size === "sm" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      {pending ? (
        <Loader2 className={cn("animate-spin", size === "md" ? "h-4 w-4" : "h-3.5 w-3.5")} />
      ) : (
        <Download className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      )}
      {text}
    </button>
  )
}
