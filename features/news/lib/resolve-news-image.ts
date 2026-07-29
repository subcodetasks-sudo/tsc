import { resolveImageUrl } from "@/lib/utils"

const FALLBACK_IMAGES = [
  "/home/content/news-feature.png",
  "/home/content/news-1.png",
  "/home/content/news-2.png",
  "/home/content/news-3.png",
] as const

export function resolveNewsImageUrl(image?: string | null, index = 0): string {
  const src = image?.trim()
  if (!src) return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:") || src.startsWith("blob:")) {
    return src
  }

  // Local Next public assets
  if (src.startsWith("/home/") || src.startsWith("/process/") || src.startsWith("/footer/")) {
    return src
  }

  const resolved = resolveImageUrl(src)
  return resolved || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

export function isImageOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true
  try {
    const url = new URL(src)
    if (url.protocol !== "https:") return false

    const allowedHosts = new Set<string>([
      "dashboardtalent.talent-sc.de",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com"
    ])
    
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (storageUrl) {
      try { allowedHosts.add(new URL(storageUrl).hostname) } catch {}
    }
    if (apiUrl) {
      try { allowedHosts.add(new URL(apiUrl).hostname) } catch {}
    }
    
    return allowedHosts.has(url.hostname)
  } catch {
    return false
  }
}

