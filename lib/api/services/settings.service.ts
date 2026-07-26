import { api } from "../client"
import type { ApiResponse } from "../types"

export type SiteSetting = {
  key: string
  value: string | Record<string, unknown> | number | boolean
  type?: string
  is_public?: boolean
  label?: string
}

function parseSettingsList(raw: unknown): SiteSetting[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is SiteSetting => !!item && typeof item === "object" && "key" in item)
  }
  if (!raw || typeof raw !== "object") return []
  const root = raw as Record<string, unknown>
  const data = root.data
  if (Array.isArray(data)) {
    return data.filter((item): item is SiteSetting => !!item && typeof item === "object" && "key" in item)
  }
  return []
}

export async function getSettings(locale = "ar"): Promise<SiteSetting[]> {
  const response = await api.get<unknown>("/settings", { locale, next: { revalidate: 60 } })
  return parseSettingsList(response)
}

export async function getAdminSettings(token: string, locale = "ar"): Promise<SiteSetting[]> {
  const response = await api.get<unknown>("/settings", { token, locale })
  return parseSettingsList(response)
}

export async function updateSetting(
  key: string,
  formData: FormData,
  token: string,
  locale = "ar"
): Promise<SiteSetting> {
  const response = await api.post<ApiResponse<SiteSetting>>(`/settings/${key}`, formData, {
    token,
    locale,
  })
  return response.data
}
