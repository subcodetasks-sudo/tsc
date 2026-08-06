"use server"

import { revalidatePath } from "next/cache"
import { approveJob, rejectJob, deleteUser, deleteAdminJob, stopAdminJob, activateAdminJob, createAdminJob, updateAdminJob } from "@/lib/api/services/admin.service"
import { formatApiValidationMessage } from "@/features/company-jobs/lib/format-api-error"
import {
  createSuccessStory,
  deleteSuccessStory,
  updateSuccessStory,
} from "@/lib/api/services/success-stories.service"
import {
  createPartner,
  deletePartner,
  updatePartner,
} from "@/lib/api/services/partners.service"
import {
  createNewsItem,
  deleteNewsItem,
  updateNewsItem,
} from "@/lib/api/services/news.service"
import {
  createFaq,
  updateFaq,
  deleteFaq,
} from "@/lib/api/services/faqs.service"
import { updateSetting } from "@/lib/api/services/settings.service"
import {
  parseLegalDocumentFromSettings,
  type LegalDocumentState,
} from "@/features/legal/lib/legal-setting-keys"
import { updateAbout } from "../../../lib/api/services/about.service"
import { updateHomePageContent } from "@/lib/api/services/home-page.service"
import {
  deleteNotification,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/services/notifications.service"
import {
  createServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
} from "@/lib/api/services/services.service"
import {
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
} from "@/lib/api/services/categories.service"
import {
  createCountryAdmin,
  updateCountryAdmin,
  deleteCountryAdmin,
} from "@/lib/api/services/countries.service"
import { ApiError } from "@/lib/api/client"
import { getSession } from "@/lib/auth-token"
import { deleteContactMessage } from "@/lib/api/services/contact-messages.service"

async function requireAdmin(locale: string) {
  const session = await getSession()
  if (!session.accessToken || session.user?.role !== "admin") {
    throw new Error("Unauthorized")
  }
  return { token: session.accessToken, locale }
}

function revalidateAdmin(locale: string) {
  const base = `/${locale}/dashboard/admin`
  revalidatePath(base)
  revalidatePath(`${base}/jobs`)
  revalidatePath(`${base}/users`)
  revalidatePath(`${base}/companies`)
  revalidatePath(`${base}/success-stories`)
  revalidatePath(`${base}/partners`)
  revalidatePath(`${base}/settings`)
  revalidatePath(`/${locale}`)
}

export async function approveJobAction(jobId: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await approveJob(jobId, token, locale)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to approve"
    return { ok: false as const, message }
  }
}

export async function rejectJobAction(jobId: number, locale: string, reason?: string) {
  try {
    const { token } = await requireAdmin(locale)
    await rejectJob(jobId, token, locale, reason)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to reject"
    return { ok: false as const, message }
  }
}

export async function deleteAdminJobAction(jobId: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteAdminJob(jobId, token, locale)
    revalidateAdmin(locale)
    revalidatePath(`/${locale}/dashboard/admin/jobs/${jobId}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete job"
    return { ok: false as const, message }
  }
}

export async function stopAdminJobAction(jobId: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await stopAdminJob(jobId, token, locale)
    revalidateAdmin(locale)
    revalidatePath(`/${locale}/dashboard/admin/jobs/${jobId}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to stop job"
    return { ok: false as const, message }
  }
}

export async function activateAdminJobAction(jobId: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await activateAdminJob(jobId, token, locale)
    revalidateAdmin(locale)
    revalidatePath(`/${locale}/dashboard/admin/jobs/${jobId}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to activate job"
    return { ok: false as const, message }
  }
}

export async function createAdminJobAction(formData: FormData, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await createAdminJob(formData, token, locale)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to create job")
    return { ok: false as const, message }
  }
}

export async function updateAdminJobAction(jobId: number, formData: FormData, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await updateAdminJob(jobId, formData, token, locale)
    revalidateAdmin(locale)
    revalidatePath(`/${locale}/dashboard/admin/jobs/${jobId}`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to update job")
    return { ok: false as const, message }
  }
}

export async function deleteUserAction(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  locale: string
) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteUser(userId, token, locale)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete user"
    return { ok: false as const, message }
  }
}

export async function deleteSuccessStoryAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteSuccessStory(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/success-stories`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete"
    return { ok: false as const, message }
  }
}

export async function saveSuccessStoryAction(formData: FormData, locale: string, storyId?: number) {
  try {
    // server-side fast-fail: ensure location for current locale is present
    const locKey = `location[${locale}]`
    const locVal = formData.get(locKey)
    if (!locVal || String(locVal).trim() === "") {
      return { ok: false as const, message: "Location required" }
    }
    const { token } = await requireAdmin(locale)
    if (storyId) {
      await updateSuccessStory(storyId, formData, token, locale)
    } else {
      await createSuccessStory(formData, token, locale)
    }
    revalidatePath(`/${locale}/dashboard/admin/success-stories`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save story")
    return { ok: false as const, message }
  }
}

export async function deletePartnerAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deletePartner(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/partners`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete"
    return { ok: false as const, message }
  }
}

export async function savePartnerAction(formData: FormData, locale: string, partnerId?: number) {
  try {
    const { token } = await requireAdmin(locale)
    if (partnerId) {
      await updatePartner(partnerId, formData, token, locale)
    } else {
      await createPartner(formData, token, locale)
    }
    revalidatePath(`/${locale}/dashboard/admin/partners`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save partner")
    return { ok: false as const, message }
  }
}

export async function saveNewsAction(formData: FormData, locale: string, newsId?: number) {
  try {
    const { token } = await requireAdmin(locale)
    if (newsId) {
      await updateNewsItem(newsId, formData, token, locale)
    } else {
      await createNewsItem(formData, token, locale)
    }
    revalidatePath(`/${locale}/dashboard/admin/news`)
    revalidatePath(`/${locale}/news`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save news")
    return { ok: false as const, message }
  }
}

export async function deleteNewsAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteNewsItem(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/news`)
    revalidatePath(`/${locale}/news`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete news"
    return { ok: false as const, message }
  }
}

export async function deleteFaqAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteFaq(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/faqs`)
    revalidatePath(`/${locale}/faqs`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete FAQ"
    return { ok: false as const, message }
  }
}

export async function saveFaqAction(formData: FormData, locale: string, faqId?: number) {
  try {
    const { token } = await requireAdmin(locale)
    if (faqId) {
      await updateFaq(faqId, formData, token, locale)
    } else {
      await createFaq(formData, token, locale)
    }
    revalidatePath(`/${locale}/dashboard/admin/faqs`)
    revalidatePath(`/${locale}/faqs`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to save FAQ"
    return { ok: false as const, message }
  }
}

export async function saveSettingAction(
  key: string,
  data: { value: string; type?: string; is_public?: string },
  locale: string
) {
  try {
    const { token } = await requireAdmin(locale)

    // Rebuild FormData on the server. Passing client FormData through Server
    // Actions can truncate large payloads (e.g. long privacy/terms HTML).
    const formData = new FormData()
    formData.append("value", data.value ?? "")
    formData.append("type", data.type ?? "string")
    formData.append("is_public", data.is_public ?? "1")

    await updateSetting(key, formData, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/settings`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to save setting"
    return { ok: false as const, message }
  }
}

/** Save legal HTML (privacy / terms / legal info) as one settings JSON value. */
export async function saveLegalDocumentAction(
  key: string,
  doc: LegalDocumentState,
  locale: string
) {
  try {
    const { token } = await requireAdmin(locale)

    const formData = new FormData()
    formData.append(
      "value",
      JSON.stringify({
        title: { ar: doc.titleAr, en: doc.titleEn, de: doc.titleDe },
        content: { ar: doc.contentAr, en: doc.contentEn, de: doc.contentDe },
      })
    )
    formData.append("type", "json")
    formData.append("is_public", "1")
    await updateSetting(key, formData, token, locale)

    revalidatePath(`/${locale}/dashboard/admin/settings`)
    revalidatePath(`/${locale}/privacy`)
    revalidatePath(`/${locale}/terms`)
    revalidatePath(`/${locale}/legal-information`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to save legal document"
    return { ok: false as const, message }
  }
}

export async function saveAboutAction(formData: FormData, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await updateAbout(formData, token, locale)
    revalidatePath(`/${locale}/about`)
    revalidatePath(`/${locale}/dashboard/admin/about`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save about page")
    return { ok: false as const, message }
  }
}

export async function saveHomeContentAction(formData: FormData, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await updateHomePageContent(formData, token, locale)
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/dashboard/admin/home`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save home content")
    return { ok: false as const, message }
  }
}

export async function markNotificationReadAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await markAsRead(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/notifications`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to mark notification read"
    return { ok: false as const, message }
  }
}

export async function markAllNotificationsReadAction(locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await markAllAsRead(token, locale)
    revalidatePath(`/${locale}/dashboard/admin/notifications`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to mark all as read"
    return { ok: false as const, message }
  }
}

export async function deleteNotificationAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteNotification(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/notifications`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete notification"
    return { ok: false as const, message }
  }
}

// ─── Services ─────────────────────────────────────────────────────────────

export async function saveServiceAction(
  formData: FormData,
  locale: string,
  serviceId?: number
) {
  try {
    const { token } = await requireAdmin(locale)
    if (serviceId) {
      const updated = await updateServiceAdmin(serviceId, formData, token, locale)
      if (updated.id !== serviceId) {
        return {
          ok: false as const,
          message: `Update returned service id ${updated.id}, expected ${serviceId}`,
        }
      }
    } else {
      await createServiceAdmin(formData, token, locale)
    }
    revalidatePath(`/${locale}/services`)
    revalidatePath(`/${locale}/dashboard/admin/services`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save service")
    return { ok: false as const, message }
  }
}

export async function deleteServiceAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteServiceAdmin(id, token, locale)
    revalidatePath(`/${locale}/services`)
    revalidatePath(`/${locale}/dashboard/admin/services`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete service"
    return { ok: false as const, message }
  }
}

// ─── Categories ───────────────────────────────────────────────────────────

export async function saveCategoryAction(
  formData: FormData,
  locale: string,
  categoryId?: number
) {
  // Next.js action tracer prints FormData as {} — dump real fields here
  const payload: Record<string, string> = {}
  formData.forEach((value, key) => {
    payload[key] =
      value instanceof File
        ? `[File: ${value.name}, ${value.size} bytes, ${value.type}]`
        : String(value)
  })
  console.log("[categories] saveCategoryAction payload", {
    categoryId: categoryId ?? null,
    locale,
    op: categoryId ? "update" : "create",
    payload,
  })

  try {
    const { token } = await requireAdmin(locale)
    if (categoryId) {
      await updateCategoryAdmin(categoryId, formData, token, locale)
    } else {
      await createCategoryAdmin(formData, token, locale)
    }
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/jobs`)
    revalidatePath(`/${locale}/dashboard/admin/categories`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save category")
    return { ok: false as const, message }
  }
}

export async function deleteCategoryAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteCategoryAdmin(id, token, locale)
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/jobs`)
    revalidatePath(`/${locale}/dashboard/admin/categories`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete category"
    return { ok: false as const, message }
  }
}

// ─── Countries ────────────────────────────────────────────────────────────

export async function saveCountryAction(
  formData: FormData,
  locale: string,
  countryId?: number
) {
  try {
    const { token } = await requireAdmin(locale)
    if (countryId) {
      await updateCountryAdmin(countryId, formData, token, locale)
    } else {
      await createCountryAdmin(formData, token, locale)
    }
    revalidatePath(`/${locale}/dashboard/admin/countries`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = formatApiValidationMessage(err, "Failed to save country")
    return { ok: false as const, message }
  }
}

export async function deleteCountryAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteCountryAdmin(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/countries`)
    revalidatePath(`/${locale}`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete country"
    return { ok: false as const, message }
  }
}

// ─── Contact Messages ──────────────────────────────────────────────────────

export async function deleteContactMessageAction(id: number, locale: string) {
  try {
    const { token } = await requireAdmin(locale)
    await deleteContactMessage(id, token, locale)
    revalidatePath(`/${locale}/dashboard/admin/contact`)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to delete message"
    return { ok: false as const, message }
  }
}

export async function suspendUserAction(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  suspend: boolean,
  locale: string
) {
  try {
    const { token } = await requireAdmin(locale)
    const { suspendUser } = await import("@/lib/api/services/admin.service")
    await suspendUser(userId, suspend, token, locale)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to change user status"
    return { ok: false as const, message }
  }
}

export async function updateAdminUserAction(
  userId: number | string | { id?: number | string; uuid?: string | null; email?: string | null },
  data: {
    name?: string
    email?: string
    password?: string
    password_confirmation?: string
    status?: string
    email_verified?: boolean | number
  },
  locale: string
) {
  try {
    const { token } = await requireAdmin(locale)
    const { updateAdminUser } = await import("@/lib/api/services/admin.service")
    await updateAdminUser(userId, data, token, locale)
    revalidateAdmin(locale)
    return { ok: true as const }
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(
        "[updateAdminUserAction] failed",
        JSON.stringify(
          { userId, data, status: err.status, message: err.message, errors: err.errors },
          null,
          2
        )
      )
      return { ok: false as const, message: err.message, status: err.status, errors: err.errors }
    }
    const message = err instanceof Error ? err.message : "Failed to update user profile"
    console.error("[updateAdminUserAction] failed", message)
    return { ok: false as const, message }
  }
}


