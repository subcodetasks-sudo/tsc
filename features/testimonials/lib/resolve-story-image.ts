import { resolveImageUrl } from "@/lib/utils"

const FALLBACK_IMAGES = [
  "/home/content/testimonial-left.png",
  "/home/content/testimonial-center.png",
  "/home/content/testimonial-right-1.png",
  "/home/content/testimonial-right-2.png",
] as const

export function resolveStoryImageUrl(image?: string | null, index = 0): string {
  const src = image?.trim()
  if (!src) return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:") || src.startsWith("blob:")) {
    return src
  }

  if (src.startsWith("/home/") || src.startsWith("/process/") || src.startsWith("/footer/")) {
    return src
  }

  const resolved = resolveImageUrl(src)
  return resolved || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}
