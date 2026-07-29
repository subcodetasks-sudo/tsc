// lib/api/client.ts

import { API_BASE_URL } from "./config"

const BASE_URL = API_BASE_URL
const isBrowser = typeof window !== "undefined"
const serverGetPromises = new Map<string, Promise<any>>()

export class ApiError extends Error {
  public status: number
  public errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

type FetchOptions = RequestInit & { locale?: string; token?: string; timeout?: number; requestId?: string }

const SECRET_FIELD_PATTERN =
  /("?(?:access_token|refresh_token|id_token|token|accessToken|refreshToken)"?\s*:\s*)"([^"]*)"/gi

/** Truncate a response body for logging and mask any credentials inside it. */
function redactBodyForLog(text: string, maxLength = 4096): string {
  const sample = text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
  return sample.replace(SECRET_FIELD_PATTERN, `$1"[REDACTED]"`)
}

function ensureBrowserSafeRequest(endpoint: string) {
  if (!isBrowser) {
    return
  }

  if (!endpoint.startsWith("/")) {
    throw new Error("Browser-side API calls must use a local path such as /api/...")
  }

  if (!BASE_URL.startsWith(window.location.origin)) {
    throw new Error(
      "Browser-side API calls are blocked for external API origins. Use a local Next.js route instead."
    )
  }
}

function appendLocaleQuery(endpoint: string, locale?: string) {
  if (!locale) {
    return endpoint
  }

  try {
    const url = new URL(endpoint, "http://localhost")
    if (!url.searchParams.has("locale")) {
      url.searchParams.set("locale", locale)
    }

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return url.toString()
    }

    return `${url.pathname}${url.search}`
  } catch {
    return endpoint
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  ensureBrowserSafeRequest(endpoint)
  const { locale: optLocale, token, timeout, ...fetchOptions } = options

  // Determine locale automatically when not provided:
  // - On the server read the `X-NEXT-INTL-LOCALE` / `x-requested-locale` / `accept-language` header
  // - In the browser infer from the pathname (e.g. /ar/..., /en/...)
  let locale = optLocale
  if (!locale) {
    if (!isBrowser) {
      try {
        const mod = await import("next/headers")
        const h = await mod.headers()
        const headerLocale = h.get("X-NEXT-INTL-LOCALE") || h.get("x-requested-locale") || h.get("accept-language")
        if (headerLocale) {
          locale = headerLocale.split(",")[0]
        }
      } catch {
        // ignore - fallback handled below
      }
    } else {
      try {
        const m = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/)
        locale = m && m[1] ? m[1] : "ar"
      } catch {
        locale = "ar"
      }
    }
  }

  const method = (fetchOptions.method || "GET").toUpperCase()
  const isGet = method === "GET"
  const endpointWithLocale =
    isGet ? appendLocaleQuery(endpoint, locale) : endpoint
  const requestUrl =
    endpointWithLocale.startsWith("http://") || endpointWithLocale.startsWith("https://")
      ? endpointWithLocale
      : `${BASE_URL}${endpointWithLocale}`

  // Deduplicate and cache GET requests on server side
  const cacheKey = !isBrowser && isGet ? `${requestUrl}::${token || ""}::${locale || ""}` : null
  if (cacheKey) {
    const existing = serverGetPromises.get(cacheKey)
    if (existing) {
      return existing
    }
  }

  const fetchPromise = (async () => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": locale || "ar",
      // Some backends expect a custom locale header — include it for robustness
      "X-Requested-Locale": locale || "ar",
      // Laravel-style APIs in this project localize via the `lang` header
      lang: locale || "ar",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // For FormData do not set Content-Type (browser/node fetch will set it)
    const isMultipartUpload = fetchOptions.body instanceof FormData
    if (!isMultipartUpload) {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json"
      }
    }

    const nextOption = (fetchOptions as any).next
    const cacheOption =
      (fetchOptions as unknown as { cache?: RequestCache }).cache ??
      (nextOption ? undefined : "no-store")

    // Add an AbortController-based timeout to avoid hanging requests.
    // Multipart bodies carry image uploads (CMS forms send one file per locale,
    // up to 5 MB each), so they need far more headroom than a JSON call.
    const controller = new AbortController()
    const timeoutMs = timeout ?? (isMultipartUpload ? 120000 : 20000)
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const start = Date.now()
    const requestId = (options as any)?.requestId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

    // Include the correlation id in outgoing headers so upstream logs can be
    // correlated to our internal request ids during debugging.
    try {
      if (!headers["X-Request-Id"]) headers["X-Request-Id"] = requestId
    } catch {}

    let res: Response
    try {
      // Server-side: forward incoming request cookies to the upstream API so
      // cookie-based auth works without exchanging refresh tokens. If no
      // Authorization header was provided, attempt to derive a bearer token
      // from the current NextAuth session (JWT) so server-side rendering can
      // call upstream APIs that require an access token.
      if (!isBrowser) {
        try {
          const mod = await import("next/headers")
          const cookieFactory = (mod as any).cookies
          const cookieStore = typeof cookieFactory === "function" ? await cookieFactory() : cookieFactory
          const all = cookieStore?.getAll ? cookieStore.getAll() : []
          if (all && all.length > 0) {
            const cookieHeader = all
              .map((c: any) => {
                const name = encodeURIComponent(c.name)
                const val = /^[ -~]*$/.test(c.value) ? c.value : encodeURIComponent(c.value)
                return `${name}=${val}`
              })
              .join("; ")
            if (!headers["Cookie"]) headers["Cookie"] = cookieHeader
            // If no explicit Authorization token was provided, try to
            // read a known access cookie name first as a fast-path.
            try {
              if (!headers["Authorization"]) {
                const accessCookie = all.find((c: any) => ["access_token", "accessToken", "auth_token", "token"].includes(c.name))
                if (accessCookie && accessCookie.value) {
                  const decoded = decodeURIComponent(accessCookie.value)
                  headers["Authorization"] = `Bearer ${decoded}`
                }
              }
            } catch {}
          }
        } catch {}
      }
      
      res = await fetch(requestUrl, {
        ...fetchOptions,
        headers,
        cache: cacheOption,
        signal: controller.signal,
      })
    } catch (err: any) {
      clearTimeout(timeoutId)
      const elapsed = Date.now() - start
      if (err && err.name === "AbortError") {
        console.error(
          `[API] ${method} ${requestUrl} aborted after ${elapsed}ms (timeout ${timeoutMs}ms, requestId ${requestId})`
        )
        throw new ApiError(0, `Request timed out after ${timeoutMs}ms`)
      }
      console.error(
        `[API] ${method} ${requestUrl} network error after ${elapsed}ms (requestId ${requestId}): ${err?.message || err}`,
        err?.cause ?? ""
      )
      throw new ApiError(0, err?.message || "Network error")
    }
    clearTimeout(timeoutId)

    // Read raw text body once so we can both inspect error samples and parse JSON safely
    const rawText = await res.text().catch(() => "")

    if (!res.ok) {
      let errorData: any = {}
      try {
        if (rawText) errorData = JSON.parse(rawText)
      } catch {
        errorData = {}
      }
      const message = errorData?.message || `Request failed with status ${res.status}`
      const errors = errorData?.errors as Record<string, string[]> | undefined

      console.error(
        `[API] ${method} ${requestUrl} failed with ${res.status} ${res.statusText} in ${Date.now() - start}ms (requestId ${requestId})`,
        {
          message,
          errors: errors ?? null,
          body: rawText ? redactBodyForLog(rawText) : "<empty body>",
        }
      )

      throw new ApiError(res.status, message, errors)
    }

    // Some endpoints return an empty body
    if (!rawText) return (null as unknown) as T

    try {
      return JSON.parse(rawText) as T
    } catch (err) {
      if (!isBrowser) {
        try {
          console.warn(
            `[API] Invalid JSON response from ${requestUrl} (status ${res.status}). Sample: ${redactBodyForLog(rawText)}`
          )
        } catch {}
      }
      throw new ApiError(res.status || 500, `Invalid JSON response from ${requestUrl}`)
    }
  })()

  if (cacheKey) {
    serverGetPromises.set(cacheKey, fetchPromise)
    fetchPromise.finally(() => {
      setTimeout(() => {
        serverGetPromises.delete(cacheKey)
      }, 5000)
    }).catch(() => {})
  }

  return fetchPromise
}

export const api = {
  get: <T>(
    endpoint: string,
    opts?: {
      locale?: string
      token?: string
      timeout?: number
      requestId?: string
      cache?: RequestCache
      next?: { revalidate?: number; tags?: string[] }
    }
  ) => fetchApi<T>(endpoint, { method: "GET", ...opts }),

  post: <T>(endpoint: string, body?: FormData | Record<string, unknown> | string, opts?: { locale?: string; token?: string; timeout?: number; requestId?: string; headers?: Record<string,string> }) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  put: <T>(endpoint: string, body: FormData | Record<string, unknown> | string, opts?: { locale?: string; token?: string; timeout?: number; requestId?: string }) =>
    fetchApi<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  patch: <T>(endpoint: string, body?: FormData | Record<string, unknown> | string, opts?: { locale?: string; token?: string; timeout?: number; requestId?: string }) =>
    fetchApi<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  delete: <T>(endpoint: string, opts?: { locale?: string; token?: string; timeout?: number; requestId?: string }) =>
    fetchApi<T>(endpoint, { method: "DELETE", ...opts }),
}
