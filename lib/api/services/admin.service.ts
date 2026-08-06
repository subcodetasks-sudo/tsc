// lib/api/services/admin.service.ts
import { api, ApiError } from "../client"
import type {
  ApiResponse,
  Job,
  JobApplication,
  User,
  UserProfile,
  Country,
  City,
  Category,
  SubCategory,
  PaginationMeta,
} from "../types"
import {
  normalizeCompanyApplication,
  type CompanyApplication,
} from "@/features/company-jobs/lib/application-utils"
import {
  extractUserUuid,
  isUuidRouteId,
  resolveUserRouteId,
} from "@/lib/api/resolve-user-route-id"
import { enrichMissingApplicantNames } from "@/lib/api/services/application-enrichment.service"

const ADMIN_JOB_STATUSES = ["pending", "approved", "active", "rejected"] as const

export async function getAdminJobs(
  token: string,
  status?: string,
  page = 1,
  locale = "ar"
): Promise<{ data: Job[]; meta: PaginationMeta }> {
  // Backend exposes a dedicated GET /admin/jobs/pending endpoint for the
  // pending queue instead of /admin/jobs?status=pending.
  const path = status === "pending" ? "/admin/jobs/pending" : "/admin/jobs"
  const query = status && status !== "pending" ? `?status=${status}&page=${page}` : `?page=${page}`
  const response = await api.get<unknown>(`${path}${query}`, { token, locale, next: { revalidate: 15 } })

  const typed = response as
    | { data?: unknown[]; meta?: PaginationMeta }
    | unknown[]
    | undefined

  const rawList = Array.isArray(typed)
    ? typed
    : Array.isArray(typed?.data)
      ? (typed!.data as unknown[])
      : []

  const data = (Array.isArray(rawList) ? rawList : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, any>
      const id = Number(row.id)
      if (!Number.isFinite(id) || id <= 0) return null
      return {
        ...(row as Record<string, any>),
        id,
        applications_count: row.applications_count ?? row.applicationsCount,
      } as Job
    })
    .filter((item): item is Job => item !== null)

  const meta: PaginationMeta = Array.isArray(typed)
    ? { current_page: page, last_page: 1, per_page: data.length, total: data.length }
    : typed?.meta || { current_page: page, last_page: 1, per_page: data.length, total: data.length }

  return { data, meta }
}

export async function getAdminUserPortfolio(
  userId: number | string,
  token: string,
  locale = "ar"
): Promise<any | null> {
  try {
    const response = await api.get<any>(`/users/${userId}/portfolio`, { token, locale })
    return response.data ?? response
  } catch (err) {
    try {
      const response = await api.get<any>(`/portfolio/${userId}`, { token, locale })
      return response.data ?? response
    } catch (innerErr) {
      return null
    }
  }
}

export async function getAdminJobApplicationById(
  applicationId: number,
  token: string,
  locale = "ar"
): Promise<JobApplication | null> {
  try {
    const response = await api.get<unknown>(`/admin/job-applications/${applicationId}`, { token, locale })
    const raw = ((response as { data?: unknown })?.data ?? response) as Record<string, unknown> | undefined
    if (!raw) {
      // eslint-disable-next-line no-console
      console.error(
        `[getAdminJobApplicationById] GET /admin/job-applications/${applicationId} returned empty payload:`,
        response
      )
      return null
    }
    const normalized = normalizeCompanyApplication(raw) as JobApplication
    if (normalized.id <= 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[getAdminJobApplicationById] GET /admin/job-applications/${applicationId} normalized to invalid id:`,
        raw
      )
      return null
    }
    return normalized
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[getAdminJobApplicationById] GET /admin/job-applications/${applicationId} failed:`,
      err instanceof ApiError ? `status=${err.status} message=${err.message}` : err
    )
    return null
  }
}

export async function getAdminJobById(
  jobId: number,
  token: string,
  locale = "ar"
): Promise<Job | null> {
  // Postman exposes GET /public/jobs/:id — not /admin/jobs/:id
  try {
    const { getPublicJobDetail } = await import("./jobs.service")
    const detail = await getPublicJobDetail(jobId, locale)
    if (detail?.job) return detail.job
  } catch {
    // fall through
  }

  // Fast fallback: scan unfiltered admin list (max 3 pages)
  try {
    for (let page = 1; page <= 3; page++) {
      const { data, meta } = await getAdminJobs(token, undefined, page, locale)
      const job = data.find((entry) => entry.id === jobId)
      if (job) return job
      if (page >= (meta?.last_page ?? 1)) break
    }
  } catch {
    // ignore
  }

  return null
}

export async function getAdminJobApplications(
  jobId: number,
  token: string,
  page = 1,
  locale = "ar"
): Promise<{ data: JobApplication[]; meta: PaginationMeta }> {
  try {
    const response = await api.get<unknown>(
      `/admin/job-applications?job_id=${jobId}&page=${page}`,
      { token, locale }
    )

    const typedResponse = response as
      | { data?: JobApplication[]; meta?: PaginationMeta }
      | JobApplication[]
      | undefined

    const rawList = Array.isArray(typedResponse)
      ? typedResponse
      : Array.isArray(typedResponse?.data)
        ? typedResponse.data
        : []

    const data = await enrichMissingApplicantNames(
      rawList.map((item) => normalizeCompanyApplication(item) as unknown as JobApplication) as CompanyApplication[],
      token,
      locale
    ) as JobApplication[]

    const meta = Array.isArray(typedResponse)
      ? {
          current_page: page,
          last_page: 1,
          per_page: 10,
          total: data.length,
        }
      : typedResponse?.meta || {
          current_page: page,
          last_page: 1,
          per_page: 10,
          total: data.length,
        }

    return { data, meta }
  } catch (error) {
    throw error
  }
}

export async function approveJob(
  jobId: number,
  token: string,
  locale = "ar"
): Promise<Job> {
  const response = await api.patch<ApiResponse<Job>>(
    `/admin/jobs/${jobId}/approve`,
    {},
    { token, locale }
  )
  return response.data
}

export async function rejectJob(
  jobId: number,
  token: string,
  locale = "ar",
  reason?: string
): Promise<Job> {
  const response = await api.patch<ApiResponse<Job>>(
    `/admin/jobs/${jobId}/reject`,
    reason ? { reason } : {},
    { token, locale }
  )
  return response.data
}

type AdminJobMutation = {
  method: "delete" | "patch" | "post"
  path: string
  body?: FormData | Record<string, unknown>
}

async function runAdminJobMutation(
  attempts: AdminJobMutation[],
  token: string,
  locale: string,
  fallbackMessage: string
): Promise<void> {
  let lastError: ApiError | null = null

  for (const attempt of attempts) {
    try {
      if (attempt.method === "delete") {
        await api.delete(attempt.path, { token, locale })
      } else if (attempt.method === "patch") {
        await api.patch(attempt.path, attempt.body ?? {}, { token, locale })
      } else {
        await api.post(attempt.path, attempt.body, { token, locale })
      }
      return
    } catch (err) {
      if (err instanceof ApiError) {
        lastError = err
        if (err.status === 404 || err.status === 405) continue
      }
    }
  }

  if (lastError) throw lastError
  throw new ApiError(400, fallbackMessage)
}

export async function deleteAdminJob(
  jobId: number,
  token: string,
  locale = "ar"
): Promise<void> {
  await runAdminJobMutation(
    [
      { method: "delete", path: `/admin/jobs/${jobId}` },
      { method: "delete", path: `/jobs/${jobId}` },
      { method: "delete", path: `/company/jobs/${jobId}` },
    ],
    token,
    locale,
    "Failed to delete job"
  )
}

export async function stopAdminJob(
  jobId: number,
  token: string,
  locale = "ar"
): Promise<void> {
  await runAdminJobMutation(
    [
      { method: "patch", path: `/admin/jobs/${jobId}/stop` },
      { method: "patch", path: `/jobs/${jobId}/stop` },
      { method: "patch", path: `/company/jobs/${jobId}/stop` },
    ],
    token,
    locale,
    "Failed to stop job"
  )
}

export async function activateAdminJob(
  jobId: number,
  token: string,
  locale = "ar"
): Promise<void> {
  const formActive = new FormData()
  formActive.append("status", "active")
  const formApproved = new FormData()
  formApproved.append("status", "approved")

  await runAdminJobMutation(
    [
      { method: "patch", path: `/admin/jobs/${jobId}/approve` },
      { method: "post", path: `/jobs/${jobId}`, body: formActive },
      { method: "post", path: `/jobs/${jobId}`, body: formApproved },
      { method: "post", path: `/company/jobs/${jobId}`, body: formActive },
    ],
    token,
    locale,
    "Failed to activate job"
  )
}

export async function createAdminJob(
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<Job> {
  const response = await api.post<ApiResponse<Job>>("/admin/jobs", formData, { token, locale })
  const payload = (response as any)?.data ?? response
  return payload as Job
}

export async function updateAdminJob(
  jobId: number,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<Job> {
  // A literal PUT with a multipart body is unreliable on Laravel-style APIs —
  // PHP only auto-parses $_POST/$_FILES for POST requests, so fields can
  // silently fail to bind on a true PUT (see deleteUser/suspendUser above for
  // the same issue). Send it as POST with Laravel's `_method` override first,
  // and only try a literal PUT if that route rejects POST outright.
  if (!formData.has("_method")) formData.append("_method", "PUT")

  try {
    const response = await api.post<ApiResponse<Job>>(`/admin/jobs/${jobId}`, formData, { token, locale })
    return ((response as any)?.data ?? response) as Job
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      const response = await api.put<ApiResponse<Job>>(`/admin/jobs/${jobId}`, formData, { token, locale })
      return ((response as any)?.data ?? response) as Job
    }
    throw err
  }
}

async function resolveUserApiRouteId(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  token: string,
  locale: string
): Promise<string> {
  const direct = resolveUserRouteId(userId)
  if (isUuidRouteId(direct)) return direct

  if (typeof userId === "object" && userId?.uuid && isUuidRouteId(String(userId.uuid).trim())) {
    return String(userId.uuid).trim()
  }

  const numericId = typeof userId === "object" ? userId.id : userId
  const email =
    typeof userId === "object" && userId.email ? String(userId.email).trim() : ""

  if (email) {
    try {
      const response = await api.get<any>(
        `/users?filter[email]=${encodeURIComponent(email)}&per_page=1`,
        { token, locale }
      )
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : []
      const found = rawList[0] as Record<string, unknown> | undefined
      const uuid = found ? extractUserUuid(found) : undefined
      if (uuid && isUuidRouteId(uuid)) return uuid
      if (found?.id != null && isUuidRouteId(String(found.id))) return String(found.id)
    } catch {
      // fall through to role-based lookup
    }
  }

  if (numericId == null) return direct

  for (const role of ["user", "company", undefined] as const) {
    try {
      const { data } = await getAdminUsers(token, role, 1, locale, 100)
      const found = data.find(
        (entry) =>
          String(entry.id) === String(numericId) ||
          entry.uuid === String(numericId) ||
          (email && entry.email?.toLowerCase() === email.toLowerCase())
      )
      if (found?.uuid && isUuidRouteId(found.uuid)) return found.uuid
      if (found?.id != null && isUuidRouteId(String(found.id))) return String(found.id)
    } catch {
      // try next role filter
    }
  }

  return direct
}

function pickLocalizedString(value: unknown, locale = "ar"): string {
  if (typeof value === "string") return value.trim()
  if (!value || typeof value !== "object") return ""

  const map = value as Record<string, unknown>
  for (const key of [locale, "en", "ar", "de"]) {
    const candidate = map[key]
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  for (const candidate of Object.values(map)) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  return ""
}

function cleanOptString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeNamedRelation<T extends { id?: number; name?: string }>(
  raw: unknown,
  locale: string
): T | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const name = pickLocalizedString(row.name, locale)
  const id = row.id != null ? Number(row.id) : undefined
  if (!name && (id == null || !Number.isFinite(id))) return null
  return {
    ...(row as unknown as T),
    ...(id != null && Number.isFinite(id) ? { id } : {}),
    name: name || "",
  }
}

function resolveRawUserProfile(source: Record<string, unknown>): Record<string, unknown> | null {
  const candidates = [source.Userprofile, source.user_profile, source.userprofile, source.profile]
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>
    }
  }
  return null
}

function normalizeUserProfile(source: Record<string, unknown>): UserProfile | null {
  const raw = resolveRawUserProfile(source)
  if (!raw) return null

  return {
    firstName: cleanOptString(raw.firstName ?? raw.first_name),
    lastName: cleanOptString(raw.lastName ?? raw.last_name),
    gender: cleanOptString(raw.gender),
    dateOfBirth: cleanOptString(raw.dateOfBirth ?? raw.date_of_birth ?? raw.birth_date),
    maritalStatus: cleanOptString(raw.maritalStatus ?? raw.marital_status),
    categoryId: Number(raw.categoryId ?? raw.category_id) || null,
    subcategoryId: Number(raw.subcategoryId ?? raw.subcategory_id) || null,
    categoryName: cleanOptString(raw.categoryName ?? raw.category_name),
    subcategoryName: cleanOptString(raw.subcategoryName ?? raw.subcategory_name),
    facebook: cleanOptString(raw.facebook),
    linkedin: cleanOptString(raw.linkedin),
    twitterX: cleanOptString(raw.twitterX ?? raw.twitter_x),
    pinterest: cleanOptString(raw.pinterest),
  }
}

function extractAdminUserDetailPayload(response: unknown): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null
  const root = response as Record<string, unknown>

  const candidates: unknown[] = [root.data, root]
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue
    const row = candidate as Record<string, unknown>
    if (row.user && typeof row.user === "object" && !Array.isArray(row.user)) {
      return row.user as Record<string, unknown>
    }
    if (row.id != null || row.uuid != null || row.email != null) {
      return row
    }
  }

  return null
}

function normalizeAdminUser(item: unknown, locale = "ar"): User {
  const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
  const nestedUser =
    row.user && typeof row.user === "object" ? (row.user as Record<string, unknown>) : null
  const source = nestedUser ?? row

  const uuid =
    extractUserUuid(source) ||
    extractUserUuid(row) ||
    (typeof source.id === "string" && isUuidRouteId(source.id) ? source.id : undefined)

  const rawStatus = String(source.status ?? row.status ?? "active").toLowerCase()
  const status = (
    rawStatus === "suspended" ||
    rawStatus === "inactive" ||
    rawStatus === "pending" ||
    rawStatus === "active"
      ? rawStatus
      : source.is_active === false || source.is_active === 0 || source.is_active === "0"
        ? "suspended"
        : "active"
  ) as User["status"]

  const emailVerified = (() => {
    if (typeof source.emailVerified === "boolean") return source.emailVerified
    if (typeof source.email_verified === "boolean") return source.email_verified
    if (source.email_verified_at != null) return Boolean(source.email_verified_at)
    if (source.email_verified === 1 || source.email_verified === "1") return true
    if (source.email_verified === 0 || source.email_verified === "0") return false
    return undefined
  })()

  const idRaw = source.id ?? row.id
  const id =
    typeof idRaw === "number"
      ? idRaw
      : typeof idRaw === "string" && /^\d+$/.test(idRaw)
        ? Number(idRaw)
        : Number(source.user_id ?? row.user_id) || 0

  const Userprofile = normalizeUserProfile(source) ?? normalizeUserProfile(row)
  const country =
    normalizeNamedRelation<Country>(source.country ?? row.country, locale) ?? null
  const city = normalizeNamedRelation<City>(source.city ?? row.city, locale) ?? null
  const category =
    normalizeNamedRelation<Category>(source.category ?? row.category, locale) ??
    (Userprofile?.categoryName
      ? ({ id: Userprofile.categoryId ?? 0, name: Userprofile.categoryName, slug: "" } as Category)
      : null)
  const sub_category =
    normalizeNamedRelation<SubCategory>(
      source.sub_category ?? source.subCategory ?? row.sub_category ?? row.subCategory,
      locale
    ) ??
    (Userprofile?.subcategoryName
      ? ({ id: Userprofile.subcategoryId ?? 0, name: Userprofile.subcategoryName } as SubCategory)
      : null)

  const phone =
    cleanOptString(source.phone ?? row.phone ?? source.mobile ?? row.mobile) ?? undefined

  return {
    ...(source as unknown as User),
    id,
    uuid,
    email: String(source.email ?? row.email ?? ""),
    name: String(source.name ?? row.name ?? ""),
    phone,
    avatar: cleanOptString(source.avatar ?? row.avatar) ?? undefined,
    status,
    emailVerified,
    createdAt: (source.createdAt ??
      source.created_at ??
      row.createdAt ??
      row.created_at) as string | undefined,
    Userprofile,
    country,
    city,
    category,
    sub_category,
  }
}

export async function deleteUser(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  token: string,
  locale = "ar"
): Promise<void> {
  const routeId = await resolveUserApiRouteId(userId, token, locale)
  if (!routeId) throw new ApiError(400, "Missing user id")

  const attempts: Array<() => Promise<unknown>> = [
    () => api.delete(`/users/${routeId}`, { token, locale }),
  ]

  // Some Laravel setups only accept method spoofing over POST
  attempts.push(async () => {
    const formData = new FormData()
    formData.append("_method", "DELETE")
    return api.post(`/users/${routeId}`, formData, { token, locale })
  })

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      await attempt()
      return
    } catch (err) {
      lastError = err
      if (err instanceof ApiError && err.status !== 404 && err.status !== 405) {
        throw err
      }
    }
  }
  throw lastError instanceof Error ? lastError : new ApiError(500, "Failed to delete user")
}

export async function getAdminUserById(
  userId: number | string,
  token: string,
  locale = "ar"
): Promise<User | null> {
  try {
    // Prefer admin detail, then public/admin-shared users show endpoint.
    const endpoints = [`/admin/users/${userId}`, `/users/${userId}`]

    for (const path of endpoints) {
      try {
        const response = await api.get<unknown>(path, { token, locale })
        const item = extractAdminUserDetailPayload(response)
        if (item) return normalizeAdminUser(item, locale)
      } catch {
        continue
      }
    }

    return null
  } catch (err) {
    console.error("[getAdminUserById] error:", err)
    return null
  }
}

export async function getAdminJobApplicationStats(
  token: string,
  locale = "ar"
): Promise<{ total?: number; pending?: number; approved?: number; rejected?: number }> {
  try {
    const response = await api.get<
      ApiResponse<{ total?: number; pending?: number; approved?: number; rejected?: number }>
    >("/admin/job-applications/stats", { token, locale })
    return response.data
  } catch (err) {
    return {}
  }
}

function extractAdminUsersPayload(response: unknown): {
  rawList: unknown[]
  meta?: Partial<PaginationMeta>
} {
  if (Array.isArray(response)) {
    return { rawList: response }
  }

  if (!response || typeof response !== "object") {
    return { rawList: [] }
  }

  const root = response as Record<string, unknown>
  const data = root.data

  // Shape: { data: User[], meta }
  if (Array.isArray(data)) {
    return {
      rawList: data,
      meta: (root.meta && typeof root.meta === "object" ? root.meta : undefined) as
        | Partial<PaginationMeta>
        | undefined,
    }
  }

  // Shape: { success, data: { data: User[], meta, links } }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>
    const nestedList = Array.isArray(nested.data)
      ? nested.data
      : Array.isArray(nested.users)
        ? nested.users
        : []
    const nestedMeta =
      nested.meta && typeof nested.meta === "object"
        ? (nested.meta as Partial<PaginationMeta>)
        : root.meta && typeof root.meta === "object"
          ? (root.meta as Partial<PaginationMeta>)
          : undefined
    return { rawList: nestedList, meta: nestedMeta }
  }

  return {
    rawList: [],
    meta:
      root.meta && typeof root.meta === "object"
        ? (root.meta as Partial<PaginationMeta>)
        : undefined,
  }
}

export async function getAdminUsers(
  token: string,
  role?: string,
  page = 1,
  locale = "ar",
  perPage = 10
): Promise<{ data: User[]; meta: PaginationMeta }> {
  let query = `page=${page}&per_page=${perPage}`
  if (role) {
    const backendRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    query += `&filter[roles.name]=${backendRole}`
  }

  const response = await api.get<any>(`/users?${query}`, { token, locale })
  const { rawList, meta: rawMeta } = extractAdminUsersPayload(response)
  const data = rawList.map((item: unknown) => normalizeAdminUser(item, locale))

  const meta: PaginationMeta = {
    current_page: Number(rawMeta?.current_page) || page,
    last_page: Math.max(Number(rawMeta?.last_page) || 1, 1),
    per_page: Number(rawMeta?.per_page) || perPage,
    total: Number(rawMeta?.total) || data.length,
  }

  return { data, meta }
}

export async function getAdminUserStats(
  token: string,
  locale = "ar",
  role: string = "user"
): Promise<{ total: number; verified: number; unverified: number }> {
  const perPage = 100
  const first = await getAdminUsers(token, role, 1, locale, perPage)
  const lastPage = Math.max(first.meta?.last_page ?? 1, 1)

  let allUsers = first.data
  if (lastPage > 1) {
    const remainingPages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2)
    const rest = await Promise.all(
      remainingPages.map((page) =>
        getAdminUsers(token, role, page, locale, perPage).catch(() => ({ data: [] as User[] }))
      )
    )
    allUsers = allUsers.concat(...rest.map((r) => r.data))
  }

  const verified = allUsers.filter((u) => u.emailVerified).length
  const total = first.meta?.total ?? allUsers.length

  return { total, verified, unverified: Math.max(total - verified, 0) }
}

export async function getAdminStats(
  token: string,
  locale = "ar"
): Promise<{
  total_users: number
  total_companies: number
  total_jobs: number
  pending_jobs: number
  published_jobs?: number
}> {
  try {
    const [usersResult, companiesResult] = await Promise.all([
      getAdminUsers(token, "user", 1, locale, 1),
      getAdminUsers(token, "company", 1, locale, 1),
    ])

    const totalUsers = usersResult.meta?.total ?? 0
    const totalCompanies = companiesResult.meta?.total ?? 0

    let totalJobs = 0
    let pendingJobs = 0

    try {
      const allJobs = await getAdminJobs(token, undefined, 1, locale).catch(() => ({ data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } }))
      totalJobs = allJobs.meta?.total ?? 0
    } catch (e) {
      totalJobs = 0
    }

    try {
      const pendingRes = await getAdminJobs(token, "pending", 1, locale).catch(() => ({ data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } }))
      pendingJobs = pendingRes.meta?.total ?? 0
    } catch (e) {
      pendingJobs = 0
    }

    let publishedJobs = 0
    try {
      const [approvedRes, activeRes] = await Promise.all([
        getAdminJobs(token, "approved", 1, locale).catch(() => ({ data: [], meta: { total: 0 } })),
        getAdminJobs(token, "active", 1, locale).catch(() => ({ data: [], meta: { total: 0 } })),
      ])
      publishedJobs = (approvedRes.meta?.total ?? 0) + (activeRes.meta?.total ?? 0)
    } catch (e) {
      publishedJobs = Math.max(0, (totalJobs || 0) - (pendingJobs || 0))
    }

    if (!totalJobs) {
      try {
        const jobStatuses = ["pending", "approved", "active", "rejected"] as const
        const jobResults = await Promise.all(jobStatuses.map((status) => getAdminJobs(token, status, 1, locale).catch(() => ({ data: [], meta: { total: 0 } }))))
        totalJobs = jobResults.reduce((sum, result) => sum + (result.meta?.total ?? 0), 0)
      } catch {
        // ignore
      }
    }

    return {
      total_users: Number(totalUsers || 0),
      total_companies: Number(totalCompanies || 0),
      total_jobs: Number(totalJobs || 0),
      pending_jobs: Number(pendingJobs || 0),
      published_jobs: Number(publishedJobs || 0),
    }
  } catch (err) {
    return { total_users: 0, total_companies: 0, total_jobs: 0, pending_jobs: 0 }
  }
}

export async function suspendUser(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  suspend: boolean,
  token: string,
  locale = "ar"
): Promise<void> {
  const routeId = await resolveUserApiRouteId(userId, token, locale)
  if (!routeId) throw new ApiError(400, "Missing user id")

  const status = suspend ? "suspended" : "active"
  const attempts: Array<() => Promise<unknown>> = [
    async () => {
      const formData = new FormData()
      formData.append("status", status)
      formData.append("is_active", suspend ? "0" : "1")
      return api.post(`/users/${routeId}`, formData, { token, locale })
    },
    async () => {
      const formData = new FormData()
      formData.append("status", suspend ? "inactive" : "active")
      return api.post(`/users/${routeId}`, formData, { token, locale })
    },
    async () => {
      return api.put(
        `/users/${routeId}`,
        { status, is_active: suspend ? 0 : 1 },
        { token, locale }
      )
    },
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      await attempt()
      return
    } catch (err) {
      lastError = err
      if (err instanceof ApiError && ![404, 405, 422].includes(err.status)) {
        throw err
      }
    }
  }
  throw lastError instanceof Error ? lastError : new ApiError(500, "Failed to change user status")
}

export async function updateAdminUser(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  data: {
    name?: string
    email?: string
    password?: string
    password_confirmation?: string
    status?: string
    email_verified?: number | boolean
  },
  token: string,
  locale = "ar"
): Promise<void> {
  const routeId = await resolveUserApiRouteId(userId, token, locale)
  const formData = new FormData()
  if (data.name) formData.append("name", data.name)
  if (data.email) formData.append("email", data.email)
  if (data.password) {
    formData.append("password", data.password)
    formData.append("password_confirmation", data.password_confirmation ?? data.password)
  }
  if (data.status) formData.append("status", data.status)
  if (data.email_verified !== undefined) {
    formData.append("email_verified", data.email_verified ? "1" : "0")
  }

  try {
    const response = await api.post(`/users/${routeId}`, formData, { token, locale })
    console.log(
      "[updateAdminUser] upstream OK",
      JSON.stringify({ routeId, payload: data, response }, null, 2)
    )
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(
        "[updateAdminUser] upstream ERROR",
        JSON.stringify(
          { routeId, payload: data, status: err.status, message: err.message, errors: err.errors },
          null,
          2
        )
      )
    } else {
      console.error("[updateAdminUser] upstream ERROR", err)
    }
    throw err
  }
}