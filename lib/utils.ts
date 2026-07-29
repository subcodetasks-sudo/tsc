export { cn } from "@/hooks/lib/utils"

export function resolveImageUrl(src?: string | null): string {
  if (!src) return ""
  const clean = src.trim()
  if (!clean) return ""
  
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:") || clean.startsWith("blob:")) {
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      try {
        const url = new URL(clean)
        url.pathname = url.pathname
          .split("/")
          .map((segment) => (segment ? encodeURIComponent(decodeURIComponent(segment)) : segment))
          .join("/")
        return url.toString()
      } catch {
        return clean
      }
    }
    return clean
  }
  
  const base = (process.env.NEXT_PUBLIC_STORAGE_URL || process.env.NEXT_PUBLIC_API_URL || "https://dashboardtalent.talent-sc.de").replace(
    /\/api\/v1\/?$/,
    ""
  ).replace(/\/$/, "")

  // Absolute storage paths belong on the API origin, not the Next.js host
  if (clean.startsWith("/storage/") || clean.startsWith("storage/")) {
    return `${base}/${clean.replace(/^\//, "")}`
  }
  if (clean.startsWith("/")) {
    return `${base}${clean}`
  }
  return `${base}/${clean}`
}

/** Normalize category/media icon fields that may be a string URL or nested object. */
export function extractMediaUrl(value: unknown): string | null {
  if (!value) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    for (const key of ["url", "path", "src", "original_url", "full_url", "icon", "ar", "en", "de"]) {
      const nested = obj[key]
      if (typeof nested === "string" && nested.trim()) return nested.trim()
    }
  }
  return null
}
