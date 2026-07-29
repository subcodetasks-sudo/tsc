import { ApiError } from "@/lib/api/client"

/**
 * Flatten Laravel-style validation errors into a single user-facing message.
 * Prefers field keys so localized media errors like `image.en` / `icon.ar` /
 * `steps.0.icon.de` are visible in the admin UI.
 */
export function formatApiValidationMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const parts: string[] = []
    if (err.errors) {
      for (const [field, messages] of Object.entries(err.errors)) {
        if (!Array.isArray(messages) || messages.length === 0) continue
        const label = field.replace(/\.(\d+)\./g, "[$1].")
        for (const msg of messages) {
          if (!msg) continue
          // Avoid duplicating the key when the backend message already includes it
          const alreadyLabeled =
            msg.toLowerCase().includes(field.toLowerCase()) ||
            msg.toLowerCase().includes(label.toLowerCase())
          parts.push(alreadyLabeled ? msg : `${label}: ${msg}`)
        }
      }
    }
    if (parts.length > 0) return parts.join(" · ")
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
