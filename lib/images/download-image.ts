function filenameFromUrl(url: string, fallback: string): string {
  try {
    const path = url.startsWith("blob:") || url.startsWith("data:")
      ? fallback
      : new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost").pathname
    const base = path.split("/").pop()?.split("?")[0]?.trim()
    if (base && /\.[a-z0-9]{2,5}$/i.test(base)) return base
  } catch {
    // ignore
  }
  return fallback.includes(".") ? fallback : `${fallback}.jpg`
}

/**
 * Trigger a browser download for an image URL (remote, blob, or data URL).
 * Falls back to opening the URL in a new tab if fetch fails (e.g. CORS).
 */
export async function downloadImage(url: string, filename = "image.jpg"): Promise<void> {
  if (!url) return

  const name = filenameFromUrl(url, filename)

  try {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const a = document.createElement("a")
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }

    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}
