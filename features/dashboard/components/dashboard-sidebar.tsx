"use client"

import * as React from "react"
import Image from "next/image"
import { Link, stripLocalePrefix, usePathname } from "@/i18n/navigation"
import { useAuth } from "@/hooks/use-auth"
import LogoutButton from "@/components/ui/logout-button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

const ACTIVE_GRADIENT_CLASS = "bg-[linear-gradient(180deg,#006EA8_0%,#005685_100%)]"

type SidebarNavItem = {
  icon: string
  label: string
  href: string
}

type SidebarGroup = {
  title: string
  items: SidebarNavItem[]
}

interface SidebarItemProps {
  iconSrc: string
  label: string
  href: string
  locale: string
  active?: boolean
  flipIcon?: boolean
  isRTL?: boolean
}

function SidebarItem({ iconSrc, label, href, locale, active, flipIcon, isRTL }: SidebarItemProps) {
  return (
    <Link
      locale={locale}
      href={href}
      className={cn(
        "relative isolate flex w-full flex-none items-center gap-2.5 self-stretch px-4 transition-colors rounded-[8px]",
        "h-12 lg:h-10 py-2.5 lg:py-1.5",
        active ? "text-transparent bg-[#E4ECF5]" : "text-[#6B7280] hover:bg-[#E4ECF5] hover:text-[#374151]"
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute top-1/2 z-[2] h-8 w-0.5 -translate-y-1/2",
            ACTIVE_GRADIENT_CLASS,
            isRTL ? "right-0" : "left-0"
          )}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative z-0 flex h-6 w-6 flex-none items-center justify-center",
          active &&
            "[filter:brightness(0)_saturate(100%)_invert(28%)_sepia(89%)_saturate(1200%)_hue-rotate(176deg)_brightness(92%)_contrast(101%)]"
        )}
      >
        <Image
          src={iconSrc}
          alt=""
          width={24}
          height={24}
          className={cn(flipIcon && "scale-x-[-1]")}
          aria-hidden
        />
      </div>

      <span
        className={cn(
          "relative z-[1] flex-none text-base lg:text-[14px] leading-[150%]",
          active
            ? cn("bg-clip-text font-semibold text-transparent", ACTIVE_GRADIENT_CLASS)
            : "font-medium text-[#6B7280]"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

function SidebarLogout({ label, flipIcon, initialUser }: { label: string; flipIcon?: boolean; initialUser?: any }) {
  // Start with the server-provided snapshot so the SSR render matches the
  // initial HTML. After hydration, subscribe to the client auth state and
  // enable the button if a session is present client-side. This keeps the
  // UX consistent with the header while avoiding hydration mismatches.
  const { user: clientUser, isLoading: clientLoading } = useAuth()
  // Consider any non-null `initialUser` as authenticated on the server
  // (some backends use id=0 as a placeholder). After hydration, enable the
  // button when a client-side user object exists regardless of `id` value.
  const initiallyAuthenticated = Boolean(initialUser)
  const [enabled, setEnabled] = React.useState<boolean>(initiallyAuthenticated)

  React.useEffect(() => {
    if (clientUser) {
      setEnabled(true)
    } else if (!clientLoading) {
      setEnabled(false)
    }
  }, [clientUser, clientLoading])

  return (
    <LogoutButton
      label={label}
      disabled={!enabled}
      className={cn(
        "relative flex h-12 lg:h-10 w-full items-center gap-2 px-4 py-3 lg:py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-[8px] disabled:opacity-60 text-base lg:text-[14px]",
        flipIcon && ""
      )}
    />
  )
}

function resolveActivePath(pathname: string, hrefs: string[]): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/"
  const sorted = [...hrefs].sort((a, b) => b.length - a.length)

  for (const href of sorted) {
    const h = href.replace(/\/$/, "")
    if (normalized === h || normalized.startsWith(`${h}/`)) {
      return h
    }
  }

  return null
}

function getLabel(locale: string, arabic: string, english: string, german: string) {
  if (locale === "ar") {
    return arabic
  }

  if (locale === "de") {
    return german
  }

  return english
}

function getAdminGroups(locale: string): SidebarGroup[] {
  return [
    {
      title: getLabel(locale, "نظرة عامة", "Overview", "Übersicht"),
      items: [
        {
          icon: "/dashboard/dashboard.svg",
          label: getLabel(locale, "لوحة التحكم", "Dashboard", "Dashboard"),
          href: "/dashboard/admin",
        },
      ],
    },
    {
      title: getLabel(locale, "المحتوى", "Content", "Inhalt"),
      items: [
        {
          icon: "/dashboard/dashboard.svg",
          label: getLabel(locale, "الصفحة الرئيسية", "Home Page", "Startseite"),
          href: "/dashboard/admin/home",
        },
        {
          icon: "/dashboard/profile.svg",
          label: getLabel(locale, "من نحن", "About Page", "Über uns"),
          href: "/dashboard/admin/about",
        },
        {
          icon: "/dashboard/education_Info.svg",
          label: getLabel(locale, "قصص النجاح", "Success Stories", "Erfolgsgeschichten"),
          href: "/dashboard/admin/success-stories",
        },
        {
          icon: "/dashboard/profile.svg",
          label: getLabel(locale, "الشركاء", "Partners", "Partner"),
          href: "/dashboard/admin/partners",
        },
        {
          icon: "/dashboard/tickets.svg",
          label: getLabel(locale, "الأخبار", "News", "Neuigkeiten"),
          href: "/dashboard/admin/news",
        },
        {
          icon: "/dashboard/jobs.svg",
          label: getLabel(locale, "الخدمات", "Services", "Dienstleistungen"),
          href: "/dashboard/admin/services",
        },
        {
          icon: "/dashboard/tickets.svg",
          label: getLabel(locale, "الأسئلة الشائعة", "FAQs", "FAQs"),
          href: "/dashboard/admin/faqs",
        },
        {
          icon: "/dashboard/favourites.svg",
          label: getLabel(locale, "الفئات", "Categories", "Kategorien"),
          href: "/dashboard/admin/categories",
        },
        {
          icon: "/dashboard/profile.svg",
          label: getLabel(locale, "الدول", "Countries", "Länder"),
          href: "/dashboard/admin/countries",
        },
      ],
    },
    {
      title: getLabel(locale, "الإدارة", "Management", "Verwaltung"),
      items: [
        {
          icon: "/dashboard/education_Info.svg",
          label: getLabel(locale, "المستخدمين", "Users", "Benutzer"),
          href: "/dashboard/admin/users",
        },
        {
          icon: "/dashboard/profile.svg",
          label: getLabel(locale, "الشركات", "Companies", "Unternehmen"),
          href: "/dashboard/admin/companies",
        },
        {
          icon: "/dashboard/jobs.svg",
          label: getLabel(locale, "الوظائف", "Jobs", "Stellenanzeigen"),
          href: "/dashboard/admin/jobs",
        },
        {
          icon: "/dashboard/education_Info.svg",
          label: getLabel(locale, "الإشعارات", "Notifications", "Benachrichtigungen"),
          href: "/dashboard/admin/notifications",
        },
        {
          icon: "/dashboard/tickets.svg",
          label: getLabel(locale, "رسائل التواصل", "Contact Messages", "Kontaktnachrichten"),
          href: "/dashboard/admin/contact",
        },
        {
          icon: "/dashboard/tickets.svg",
          label: getLabel(locale, "التذاكر", "Tickets", "Tickets"),
          href: "/dashboard/admin/tickets",
        },
        {
          icon: "/dashboard/favourites.svg",
          label: getLabel(locale, "الإعدادات", "Settings", "Einstellungen"),
          href: "/dashboard/admin/settings",
        },
        {
          icon: "/dashboard/profile.svg",
          label: getLabel(locale, "الملف الشخصي", "My Profile", "Mein Profil"),
          href: "/dashboard/admin/profile",
        },
      ],
    },
  ]
}

function getUserItems(locale: string, userRole: "user" | "company") {
  const isRTL = locale === "ar"
  const isDE = locale === "de"

  if (userRole === "user") {
    return [
      { icon: "/dashboard/dashboard.svg", label: isRTL ? "لوحة التحكم" : isDE ? "Dashboard" : "Dashboard", href: "/dashboard/user" },
      { icon: "/dashboard/profile.svg", label: isRTL ? "تحديث الملف الشخصي" : isDE ? "Profil aktualisieren" : "Update Profile", href: "/dashboard/user/profile" },
      { icon: "/dashboard/education_Info.svg", label: isRTL ? "المؤهلات والتعليم" : isDE ? "Bildungsinfo" : "Education Info", href: "/dashboard/user/education" },
      { icon: "/dashboard/jobs.svg", label: isRTL ? "طلبات الوظائف" : isDE ? "Bewerbungen" : "Job Application", href: "/dashboard/user/applications" },
      { icon: "/dashboard/favourites.svg", label: isRTL ? "الوظائف المفضلة" : isDE ? "Favoriten" : "Favourite Job", href: "/dashboard/user/favourites" },
      { icon: "/dashboard/tickets.svg", label: isRTL ? "التذاكر" : isDE ? "Tickets" : "Tickets", href: "/dashboard/user/tickets" },
    ]
  }

  return [
    { icon: "/dashboard/dashboard.svg", label: isRTL ? "لوحة التحكم" : isDE ? "Dashboard" : "Dashboard", href: "/dashboard/company" },
    { icon: "/dashboard/profile.svg", label: isRTL ? "تحديث الملف الشخصي" : isDE ? "Profil aktualisieren" : "Update Profile", href: "/dashboard/company/profile" },
    { icon: "/dashboard/jobs.svg", label: isRTL ? "كل الوظائف" : isDE ? "Alle Jobs" : "All Jobs", href: "/dashboard/company/jobs" },
    { icon: "/dashboard/tickets.svg", label: isRTL ? "التذاكر" : isDE ? "Tickets" : "Tickets", href: "/dashboard/company/tickets" },
  ]
}

function SidebarNav({
  locale,
  userRole,
  initialUser,
  onNavigate,
}: {
  locale: string
  userRole: "user" | "company" | "admin"
  initialUser?: any
  onNavigate?: () => void
}) {
  const rawPathname = usePathname() ?? ""
  const pathname = stripLocalePrefix(rawPathname)
  const isRTL = locale === "ar"
  const flipIcon = isRTL
  const groups = userRole === "admin" ? getAdminGroups(locale) : []
  const menuItems = userRole === "admin" ? [] : getUserItems(locale, userRole)
  const hrefs = groups.flatMap((group) => group.items.map((item) => item.href))

  if (userRole !== "admin") {
    hrefs.push(...menuItems.map((item) => item.href))
  }

  const activeHref = resolveActivePath(pathname, hrefs)

  const viewSiteLabel = locale === "ar" ? "عرض الموقع" : locale === "de" ? "Seite ansehen" : "View Site"

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden lg:h-auto lg:min-h-0 lg:overflow-visible">
      <nav 
        className={cn(
          "flex-1 min-h-0 overflow-y-auto flex flex-col gap-0 pt-4 pb-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent lg:overflow-y-visible lg:flex-none lg:min-h-0 lg:p-4",
          isRTL ? "pl-2 pr-3" : "pl-3 pr-2"
        )} 
        onClick={onNavigate}
      >
        <div className="space-y-0.5">
          {userRole === "admin"
            ? (<>
                {groups.map((group, index) => (
                  <div key={group.title} className={cn("px-1 pb-1 pt-2 lg:px-0", index === 0 ? "lg:pt-0" : "lg:pt-4")}>
                    <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF] lg:px-4 lg:pb-1.5">
                      {group.title}
                    </p>
                    <div className="space-y-0.5 px-1 lg:px-0">
                      {group.items.map((item) => (
                        <SidebarItem
                          key={item.href}
                          iconSrc={item.icon}
                          label={item.label}
                          href={item.href}
                          locale={locale}
                          active={activeHref === item.href.replace(/\/$/, "")}
                          flipIcon={flipIcon}
                          isRTL={isRTL}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>)
            : menuItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  iconSrc={item.icon}
                  label={item.label}
                  href={item.href}
                  locale={locale}
                  active={activeHref === item.href.replace(/\/$/, "")}
                  flipIcon={flipIcon}
                  isRTL={isRTL}
                />
              ))}
        </div>
      </nav>
      <div className="border-t border-[#E2E8F0] px-3 py-3 space-y-2 bg-[#F0F4F8] shrink-0 lg:px-4 lg:py-4">
        <Link locale={locale} href="/"
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-[8px] border border-[#006EA8]/20 bg-gradient-to-r from-[#EBF5FB] to-[#F0F9FF] px-4 text-[#006EA8] transition-all lg:hidden",
            "hover:border-[#006EA8]/40 hover:from-[#D6EFFA] hover:to-[#E4F4FC] hover:shadow-sm"
          )}
        >
          <ExternalLink className="h-[16px] w-[16px] flex-none opacity-70" />
          <span className="text-[13px] font-semibold">{viewSiteLabel}</span>
        </Link>
        <SidebarLogout label={isRTL ? "تسجيل الخروج" : locale === "de" ? "Abmelden" : "Logout"} flipIcon={flipIcon} initialUser={initialUser} />
      </div>
    </div>
  )
}

interface DashboardSidebarProps {
  locale: string
  userRole: "user" | "company" | "admin"
  initialUser?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DashboardSidebar({
  locale,
  userRole,
  initialUser,
  open,
  onOpenChange,
}: DashboardSidebarProps) {
  const isRTL = locale === "ar"
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const sidebarPanel = (
    <aside className="flex h-full w-full min-h-0 flex-col rounded-[8px] border border-[#E5E7EB] bg-[#F0F4F8] p-0 lg:w-[280px] overflow-hidden lg:overflow-visible lg:h-auto lg:min-h-0">
        <SidebarNav locale={locale} userRole={userRole} initialUser={initialUser} />
    </aside>
  )

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side={isRTL ? "right" : "left"} className="w-[min(100vw,310px)] p-0 lg:hidden">
          <SheetTitle className="sr-only">{isRTL ? "القائمة" : "Menu"}</SheetTitle>
          <div className="bg-[#F0F4F8] h-dvh flex flex-col overflow-hidden">
            <div className="flex h-[88px] sm:h-[110px] items-center border-b border-[#E2E8F0] bg-[#F0F4F8] px-4 justify-between flex-row">
              <Link locale={locale} href="/" className="flex shrink-0 items-center">
                <Image src="/logo-dark.png" alt="" width={180} height={60} className="h-[56px] sm:h-[68px] w-auto" priority />
              </Link>

              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                aria-label={isRTL ? "إغلاق القائمة" : "Close menu"}
              >
                <Image src="/jobs/icon-close-circle.svg" alt="" width={28} height={28} className="h-7 w-7" aria-hidden />
              </button>
            </div>
            <SidebarNav locale={locale} userRole={userRole} initialUser={initialUser} onNavigate={() => handleOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:flex lg:flex-col">{sidebarPanel}</div>
    </>
  )
}
