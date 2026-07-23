"use client"

import * as React from "react"
import Image from "next/image"
import { Bell, ChevronDown, Check, Menu, User as UserIcon, X, ExternalLink, LogOut, Settings, LayoutDashboard } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { safeTranslate } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, stripLocalePrefix, usePathname } from "@/i18n/navigation"
import { useSession, useAuth, updateSessionUser, seedSessionCache } from "@/hooks/use-auth"
import LogoutButton from "@/components/ui/logout-button"
import { useDashboardMobileMenu } from "@/features/shared-home/components/dashboard-mobile-menu-context"
import { cn, resolveImageUrl } from "@/lib/utils"
import type { User } from "@/lib/api/types"
import { SharedSidebar } from "./shared-sidebar"
import { getDashboardPath, normalizeRole } from "@/lib/auth-token"
import { fetchUnreadCountClient, invalidateUnreadCountCache } from "@/lib/notifications/unread-count-client"
import {
  fetchNotificationsPageClient,
  type HeaderNotification,
} from "@/lib/notifications/map-notification"

type NavItemKey = "home" | "about" | "services" | "jobs" | "news" | "contact"

type SiteHeaderProps = {
  activeItem?: NavItemKey
  initialIsLoggedIn?: boolean
  initialUser?: User | null
  isDashboard?: boolean
  onMobileMenuClick?: () => void
}

const NAV_ITEMS: Array<{ key: NavItemKey; href: string }> = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "jobs", href: "/jobs" },
  { key: "news", href: "/news" },
  { key: "contact", href: "/contact" },
]

function DEFlag({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" className={cn("w-5 h-3.5 shadow-sm rounded-[2px] object-cover shrink-0", className)}>
      <rect width="5" height="1" fill="#000"/>
      <rect width="5" height="1" y="1" fill="#D00"/>
      <rect width="5" height="1" y="2" fill="#FFCE00"/>
    </svg>
  )
}

function GBFlag({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={cn("w-5 h-3.5 shadow-sm rounded-[2px] object-cover shrink-0", className)}>
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2"/>
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  )
}

function SAFlag({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className={cn("w-5 h-3.5 shadow-sm rounded-[2px] object-cover shrink-0", className)}>
      <rect width="30" height="20" fill="#006C35"/>
      <path d="M8 6.5c1-1 3 0 4-1s2 1 4 0c1 1 2 0 3.5.5c.5.5.5 1-.5 1c-1 0-1.5-.5-2.5-.5c-1 0-1.5.5-2.5.5s-1.5-.5-2.5-.5s-1.5.5-2.5.5c-1 0-1-.5-2-.5z" fill="#fff" />
      <path d="M10 8c1-.5 2 0 3-.5c1 .5 2 0 3.5-.5c.5.5 0 1-.5 1c-1 0-1-.5-2-.5s-1.5.5-2 .5c-1 0-1-.5-2 0z" fill="#fff" />
      <path d="M8 11.5 h14 M9 11.5 v1 M9 11 h-1 v1" stroke="#fff" strokeWidth="1" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function DropdownChevron({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-hidden="true"
    >
      <path 
        d="M4 6L8 10L12 6" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LOCALE_OPTIONS = [
  { locale: "de", label: "Deutsch", flag: <DEFlag /> },
  // TEMP: English hidden from locale switcher
  // { locale: "en", label: "English", flag: <GBFlag /> },
  { locale: "ar", label: "العربية", flag: <SAFlag /> },
] as const

interface Notification extends HeaderNotification {}

export function SiteHeader({ 
  activeItem, 
  initialIsLoggedIn, 
  initialUser,
  isDashboard = false,
  onMobileMenuClick 
}: SiteHeaderProps) {
  const t = useTranslations("Landing.hero")
  const th = useTranslations("SiteHeader")
  const currentLocale = useLocale()
  const rawPathname = usePathname()
  const normalizedHref = stripLocalePrefix(rawPathname ?? "/")
  const pathname = normalizedHref || "/"
  const safeT = (key: string, fallback?: string) => safeTranslate(t, key, fallback)
  const mobileMenu = useDashboardMobileMenu()
  const router = useRouter()

  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showLocaleMenu, setShowLocaleMenu] = React.useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = React.useState(false)
  const [publicMobileMenuOpen, setPublicMobileMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  const notificationsRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const localeMenuRef = React.useRef<HTMLDivElement>(null)
  const avatarMenuRef = React.useRef<HTMLDivElement>(null)
  const isRTL = currentLocale === "ar"
  
  const session = useSession()
  const { signOut } = useAuth()

  // Trust the server-provided initial auth props for the first render.
  const [authState, setAuthState] = React.useState<{
    isLoggedIn: boolean
    user: User | null
    checked: boolean
  }>(() => ({ isLoggedIn: Boolean(initialIsLoggedIn), user: initialUser || null, checked: initialIsLoggedIn !== undefined }))

  // Ensure other client auth consumers (sidebar, mobile menu) see the
  // same server-provided session immediately to avoid render mismatch.
  React.useEffect(() => {
    if (initialIsLoggedIn && initialUser) {
      try {
        updateSessionUser({
          id: initialUser.id,
          name: initialUser.name,
          email: initialUser.email,
          avatar: (initialUser as any).avatar || (initialUser as any).avatar_url || undefined,
          role: (initialUser as any).role || undefined,
          company: (initialUser as any).company || undefined,
          company_profile: (initialUser as any).company_profile || undefined,
          companyProfile: (initialUser as any).companyProfile || undefined,
        })
      } catch {
        // non-fatal
      }
    }
  }, [initialIsLoggedIn, initialUser])

  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = React.useState(false)
  const [notificationsLoadingMore, setNotificationsLoadingMore] = React.useState(false)
  const [notificationsPage, setNotificationsPage] = React.useState(1)
  const [notificationsHasMore, setNotificationsHasMore] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState<number>(0)

  const activeNav = React.useMemo(() => {
    if (activeItem) return activeItem
    const item = NAV_ITEMS.find((item) => {
      if (item.href === "/") return pathname === "/"
      return pathname.startsWith(item.href)
    })
    return item?.key
  }, [activeItem, pathname])

  const currentLocaleOption = LOCALE_OPTIONS.find((opt) => opt.locale === currentLocale) ?? LOCALE_OPTIONS[0]
  const { isLoggedIn, user } = authState

  // Resolve correct display avatar prioritizing company logo for companies.
  // Use session.user as the freshest source for avatar (it updates after re-fetch);
  // fall back to authState.user if session hasn't loaded yet.
  // To avoid hydration mismatch, use user (authState.user, which matches server-rendered state)
  // during the first render, and only switch to the client-cached session.user after mounting.
  const displayUser = mounted ? (session.user ?? user) : user
  const displayUserRole = displayUser ? normalizeRole(displayUser) : (user ? normalizeRole(user) : "user")
  const cp = displayUser?.companyProfile || (displayUser as any)?.company_profile || (displayUser as any)?.company
  const companyLogo = cp?.logoUrl || cp?.logo || cp?.logo_url || cp?.avatar || cp?.avatar_url
  const displayAvatar = (displayUserRole === "company" && companyLogo)
    ? companyLogo
    : ((displayUser as any)?.avatar || (displayUser as any)?.avatar_url || user?.avatar || (user as any)?.avatar_url)

  const effectiveIsDashboard = Boolean(isDashboard)

  const headerClassName = cn(
    "sticky top-0 z-50 w-full bg-[#001222] shadow-2xl",
    !effectiveIsDashboard && "px-4"
  )

  // Sync auth state from useSession after mount.
  // IMPORTANT: Do NOT overwrite a logged-in authState with logged-out session
  // data while the profile fetch is still in-flight. This prevents the brief
  // flash of sign-in buttons that occurs when the page refreshes and the SSR
  // provides isLoggedIn=true but the client hook hasn't completed its fetch.
  React.useEffect(() => {
    if (!session.checked) return
    // If session says not logged in but we are still loading, wait.
    if (!session.isLoggedIn && session.isLoading && authState.isLoggedIn) return
    const next = { isLoggedIn: session.isLoggedIn, user: session.user as User | null, checked: true }
    if (next.isLoggedIn !== authState.isLoggedIn || next.user !== authState.user || !authState.checked) {
      setAuthState(next)
    }
  }, [session.checked, session.isLoggedIn, session.isLoading, session.user, authState.isLoggedIn, authState.user, authState.checked])

  // Close notification panel on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showNotifications &&
        notificationsRef.current && 
        !notificationsRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [showNotifications])

  // Close locale menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showLocaleMenu && localeMenuRef.current && !localeMenuRef.current.contains(event.target as Node)) {
        setShowLocaleMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [showLocaleMenu])

  // Close avatar menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAvatarMenu && avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [showAvatarMenu])

  // Fetch unread count once when logged in (deduped module cache)
  React.useEffect(() => {
    if (!isLoggedIn) return
    let mounted = true
    fetchUnreadCountClient()
      .then((count) => {
        if (mounted) setUnreadCount(count)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [isLoggedIn])

  // Fetch notifications list when panel opens (page 1)
  React.useEffect(() => {
    if (!isLoggedIn || !showNotifications) return
    let mounted = true

    async function fetchNotifications() {
      setNotificationsLoading(true)
      setNotificationsHasMore(false)
      try {
        const result = await fetchNotificationsPageClient({
          page: 1,
          locale: currentLocale,
          role: displayUserRole,
        })
        if (!mounted) return
        setNotifications(result.items)
        setNotificationsPage(result.currentPage)
        setNotificationsHasMore(result.hasMore)
      } catch {
        // Silently handle notification fetch errors
      } finally {
        if (mounted) setNotificationsLoading(false)
      }
    }

    fetchNotifications()
    return () => { mounted = false }
  }, [isLoggedIn, showNotifications, currentLocale, displayUserRole])

  const loadMoreNotifications = React.useCallback(async () => {
    if (!isLoggedIn || notificationsLoadingMore || !notificationsHasMore) return
    const nextPage = notificationsPage + 1
    setNotificationsLoadingMore(true)
    try {
      const result = await fetchNotificationsPageClient({
        page: nextPage,
        locale: currentLocale,
        role: displayUserRole,
      })
      setNotifications((prev) => {
        const seen = new Set(prev.map((n) => n.id))
        const appended = result.items.filter((n) => !seen.has(n.id))
        return [...prev, ...appended]
      })
      setNotificationsPage(result.currentPage)
      setNotificationsHasMore(result.hasMore && result.items.length > 0)
    } catch {
      // Silently handle load-more errors
    } finally {
      setNotificationsLoadingMore(false)
    }
  }, [
    isLoggedIn,
    notificationsLoadingMore,
    notificationsHasMore,
    notificationsPage,
    currentLocale,
    displayUserRole,
  ])

  const handleNotificationClick = async (notification: Notification) => {
    // Optimistically mark as read in UI
    if (!notification.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: "PUT", credentials: "include" })
        invalidateUnreadCountCache()
      } catch {
        // Silently handle read error
      }
    }

    // Navigate to action URL if present, then close panel
    setShowNotifications(false)

    let targetPath = notification.actionUrl
    if (!targetPath) {
      targetPath = getDashboardPath(displayUserRole)
    }

    if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
      try {
        const parsedUrl = new URL(targetPath)
        if (typeof window !== "undefined" && parsedUrl.host === window.location.host) {
          targetPath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
        } else {
          if (typeof window !== "undefined") {
            window.location.href = targetPath
          }
          return
        }
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = targetPath
        }
        return
      }
    }

    const hasLocalePrefix = /^\/(ar|en|de)(\/|$)/.test(targetPath)
    const finalUrl = hasLocalePrefix
      ? targetPath
      : `/${currentLocale}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`

    router.push(finalUrl)
  }

  const closePublicMobileMenu = React.useCallback(() => {
    setPublicMobileMenuOpen(false)
  }, [])

  return (
    <header className={headerClassName}>
      <div className={cn("relative z-50 mx-auto flex h-[88px] w-full items-center justify-between gap-3 lg:h-[128px] lg:gap-6", effectiveIsDashboard ? "max-w-[1512px] px-4 sm:px-6 lg:px-4" : "max-w-[1312px]")}>
        <div className={cn("flex shrink-0 items-center")}>
          <Link locale={currentLocale} href="/" aria-label={safeT("brand", "Brand")} className="flex shrink-0 items-center relative z-50">
            <Image
              src="/home/hero/hero-logo.svg"
              alt={safeT("brand", "Brand")}
              width={220}
              height={88}
              className="h-[56px] w-auto sm:h-[72px] lg:h-[92px]"
              loading="eager"
              priority
            />
          </Link>
        </div>

        <nav className={cn(
          "hidden lg:flex lg:items-center lg:gap-4 flex-1 justify-center",
          effectiveIsDashboard && "lg:opacity-0 lg:pointer-events-none"
        )}>
          {NAV_ITEMS.map((item, index) => (
            <React.Fragment key={item.key}>
              {index > 0 && <div className="h-[18px] w-px bg-white/20" aria-hidden="true" />}
              <Link
                locale={currentLocale}
                href={item.href}
                className={cn(
                  "whitespace-nowrap px-2 text-[16px] leading-[1.16] font-normal text-white transition-colors duration-200 hover:text-[#7CCEF3]",
                  activeNav === item.key && "font-semibold text-[#40A0CA]"
                )}
              >
                {safeT(`nav.${item.key}`, item.key)}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Notification Bell */}
          <div
            ref={notificationsRef}
            className={cn(
              "relative",
              (!isLoggedIn || !user) && "opacity-0 pointer-events-none",
              !authState.checked && "opacity-0 pointer-events-none"
            )}
          >
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-[12px] bg-gradient-to-br from-[#006EA8] to-[#005685] shadow-[0px_42px_107px_rgba(123,190,255,0.34)] transition-transform duration-150 hover:scale-105 sm:h-[44px] sm:w-[44px]"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={th("notificationsAria")}
            >
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div
                className={cn(
                  "z-[200] flex max-h-[min(70vh,460px)] w-[min(calc(100vw-16px),380px)] flex-col overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-2xl pointer-events-auto",
                  "fixed start-2 end-2 top-[76px] sm:absolute sm:start-auto sm:end-auto sm:top-full sm:mt-2 sm:w-[380px]",
                  isRTL ? "sm:left-0" : "sm:right-0"
                )}
              >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-[#006EA8]/5 to-[#005685]/5 flex-row shrink-0">
                    <h3 className="font-bold text-gray-900 text-[15px] sm:text-base">
                      {th("notificationsTitle", { count: unreadCount })}
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                              setUnreadCount(0)
                              await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" })
                              invalidateUnreadCountCache()
                            } catch {}
                          }}
                          className="text-xs text-[#006EA8] hover:underline font-semibold cursor-pointer shrink-0"
                        >
                          {th("markAllRead")}
                        </button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-gray-100" onClick={() => setShowNotifications(false)}>
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50 flex-1 min-h-0 overflow-y-auto">
                    {notificationsLoading && (
                      <div className="p-6 text-center text-sm text-gray-500">{th("loading")}</div>
                    )}
                    {!notificationsLoading && notifications.length === 0 && (
                      <div className="p-6 text-center text-sm text-gray-500">{th("noNotifications")}</div>
                    )}
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 transition-colors duration-150",
                          !notification.read && "bg-blue-50/60",
                          notification.actionUrl
                            ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                            : "cursor-default hover:bg-gray-50/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                        role={notification.actionUrl ? "button" : "button"}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleNotificationClick(notification)
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", notification.read ? "bg-gray-100" : "bg-gradient-to-br from-[#006EA8] to-[#005685]")}> 
                            <Bell className={cn("w-5 h-5", notification.read ? "text-gray-400" : "text-white")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-semibold truncate", notification.read ? "text-gray-600" : "text-gray-900")}>{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.description}</p>
                            <p className="text-[10px] text-gray-400 mt-2">{notification.time}</p>
                          </div>
                          {!notification.read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2" />}
                        </div>
                      </div>
                    ))}
                    {!notificationsLoading && notificationsHasMore && (
                      <div className="p-3">
                        <button
                          type="button"
                          disabled={notificationsLoadingMore}
                          onClick={loadMoreNotifications}
                          className="w-full rounded-lg py-2 text-sm font-semibold text-[#006EA8] hover:bg-[#F2F8FC] disabled:opacity-50"
                        >
                          {notificationsLoadingMore ? th("loadingMore") : th("loadMore")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>

          {/* Locale Switcher — custom dropdown avoids Radix Portal issues with asChild+Link */}
          <div ref={localeMenuRef} className="relative">
            <button
              type="button"
              className="h-10 gap-1.5 rounded-[12px] border border-[#40A0CA]/50 bg-transparent px-2.5 text-white hover:bg-white/10 transition-colors sm:h-[44px] sm:gap-2 sm:px-3 flex items-center"
              onClick={() => setShowLocaleMenu((v) => !v)}
              aria-label={t("languageAria")}
              aria-expanded={showLocaleMenu}
            >
              <span className="text-base sm:text-lg">{currentLocaleOption.flag}</span>
              <DropdownChevron
                className={cn(
                  "h-4 w-4 text-white/90 transition-transform duration-150",
                  showLocaleMenu && "rotate-180"
                )}
              />
            </button>

            {showLocaleMenu && (
              <div
                className={cn(
                  "absolute top-full mt-2 z-[200] w-[190px] rounded-[12px] border border-[#cfe7f7] bg-white p-1 shadow-lg",
                  isRTL ? "left-0" : "right-0"
                )}
              >
                {LOCALE_OPTIONS.map((option) => (
                  <Link
                    key={option.locale}
                    locale={option.locale}
                    href={pathname}
                    onClick={() => setShowLocaleMenu(false)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-[8px] px-2 py-2 text-[#032C44] hover:bg-[#f0f9ff] transition-colors duration-100",
                      isRTL && "text-right"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{option.flag}</span>
                      <span className="truncate text-sm">{option.label}</span>
                    </span>
                    {option.locale === currentLocale && <Check className="h-4 w-4 shrink-0 text-[#006EA8]" />}
                  </Link>
                ))}
              </div>
            )}
          </div>



          {/* Auth controls — avatar (when logged in) or sign-in button */}
          <div
            data-testid="auth-controls"
            className="shrink-0 flex items-center justify-center"
          >
            {isLoggedIn && user && authState.checked ? (
              /* Avatar Dropdown Wrapper */
              <div
                ref={avatarMenuRef}
                data-testid="auth-avatar"
                className="relative flex items-center justify-center"
              >
                <button
                  type="button"
                  className="flex items-center justify-center focus:outline-none focus:ring-0 cursor-pointer"
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  aria-label={th("userMenuAria")}
                  aria-expanded={showAvatarMenu}
                >
                  <div className="h-10 w-10 cursor-pointer rounded-full bg-gradient-to-br from-[#006EA8] to-[#005685] p-0.5 shadow-[0px_42px_107px_rgba(123,190,255,0.34)] lg:h-[44px] lg:w-[44px] hover:scale-105 transition-transform duration-150">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                      {displayAvatar ? (
                        <Image
                          src={resolveImageUrl(displayAvatar)}
                          alt={displayUser?.name || "User"}
                          width={44}
                          height={44}
                          className="size-full rounded-full object-cover object-center"
                          unoptimized={displayAvatar.startsWith("http") || displayAvatar.startsWith("blob")}
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-[#006EA8] lg:h-6 lg:w-6" />
                      )}
                    </div>
                  </div>
                </button>

                {showAvatarMenu && (
                  <div
                    className="absolute top-full mt-2 z-[200] w-[240px] rounded-[16px] border border-[#cfe7f7] bg-white p-2 shadow-2xl transition-all duration-150 animate-in fade-in-0 zoom-in-95 ltr:right-0 rtl:left-0 ltr:origin-top-right rtl:origin-top-left"
                  >
                    {/* User Profile Summary */}
                    <div className="px-3 py-2.5 border-b border-gray-100 text-start">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {displayUser?.name || th("defaultUserName")}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {displayUser?.email || ""}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#006EA8] mt-1.5">
                        {th(`role.${displayUserRole}`)}
                      </span>
                    </div>

                    {/* Options */}
                    <div className="py-1">
                      <Link
                        locale={currentLocale}
                        href={displayUser ? getDashboardPath(displayUserRole) : "/dashboard"}
                        onClick={() => setShowAvatarMenu(false)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f9ff] hover:text-[#006EA8] transition-colors duration-100",
                          isRTL ? "text-right" : "text-left"
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4 stroke-[1.5] text-gray-400 group-hover:text-[#006EA8]" />
                        <span>{th("dashboard")}</span>
                      </Link>

                      <Link
                        locale={currentLocale}
                        href={displayUser ? `/dashboard/${displayUserRole}/profile` : "/dashboard"}
                        onClick={() => setShowAvatarMenu(false)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f9ff] hover:text-[#006EA8] transition-colors duration-100",
                          isRTL ? "text-right" : "text-left"
                        )}
                      >
                        <Settings className="h-4 w-4 stroke-[1.5] text-gray-400 group-hover:text-[#006EA8]" />
                        <span>{th("profileSettings")}</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Logout */}
                    <LogoutButton
                      onDone={() => setShowAvatarMenu(false)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-100 cursor-pointer",
                        isRTL ? "text-right" : "text-left"
                      )}
                      label={th("logout")}
                      isRTL={isRTL}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Sign-in button */
              <div
                data-testid="auth-signin"
                className="hidden sm:block"
              >
                <Link locale={currentLocale} href="/sign-in" className="w-full flex items-center justify-center">
                  <PrimaryButton className="h-10 sm:h-[44px] w-full px-4 text-[14px] font-medium lg:w-[150px]">
                    {safeT("login", "Sign in")}
                  </PrimaryButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          {effectiveIsDashboard ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-[12px] border-white/20 bg-white/5 text-white hover:bg-white/10 lg:hidden shadow-sm"
              aria-label={th("openMenu")}
              onClick={() => {
                onMobileMenuClick?.()
                mobileMenu.open()
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Sheet open={publicMobileMenuOpen} onOpenChange={setPublicMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-[12px] border-white/20 bg-white/5 text-white hover:bg-white/10 lg:hidden shadow-sm" aria-label={th("openMenu")}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="w-[min(100vw,310px)] p-0 lg:hidden">
                <SheetTitle className="sr-only">{th("menuTitle")}</SheetTitle>
                <div className="flex h-full flex-col bg-[#F0F4F8]">
                  <div className="flex h-[88px] sm:h-[110px] items-center border-b border-[#E2E8F0] bg-[#F0F4F8] px-4 justify-between flex-row">
                    <Link locale={currentLocale} href="/" aria-label={safeT("brand", "Brand")} className="flex shrink-0 items-center">
                      <Image src="/logo-dark.png" alt={safeT("brand", "Brand")} width={180} height={60} className="h-[56px] sm:h-[68px] w-auto" priority />
                    </Link>

                    <SheetClose asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-transparent transition-colors" aria-label={th("closeMenu")}>
                        <Image src="/jobs/icon-close-circle.svg" alt="" width={28} height={28} className="h-7 w-7" aria-hidden />
                      </Button>
                    </SheetClose>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F0F4F8] p-2 shadow-sm">
                      <SharedSidebar
                        items={[
                          { icon: "/dashboard/dashboard.svg", label: t("nav.home"), href: "/" },
                          { icon: "/dashboard/profile.svg", label: t("nav.about"), href: "/about" },
                          { icon: "/dashboard/education_Info.svg", label: t("nav.services"), href: "/services" },
                          { icon: "/dashboard/jobs.svg", label: t("nav.jobs"), href: "/jobs" },
                          { icon: "/dashboard/tickets.svg", label: t("nav.news"), href: "/news" },
                          { icon: "/dashboard/favourites.svg", label: t("nav.contact"), href: "/contact" },
                        ]}
                        isRTL={isRTL}
                        onNavigate={closePublicMobileMenu}
                      />
                    </div>

                    {(isLoggedIn && user) && (
                      <div className="px-2 pb-2">
                        <Link locale={currentLocale} href={isLoggedIn && user ? getDashboardPath(normalizeRole(user)) : "/dashboard"} onClick={closePublicMobileMenu} className={cn("flex h-11 w-full items-center gap-2.5 rounded-lg border border-[#006EA8]/20 bg-gradient-to-r from-[#EBF5FB] to-[#F0F9FF] px-4 text-[#006EA8] transition-colors duration-150", "hover:border-[#006EA8]/40 hover:from-[#D6EFFA] hover:to-[#E4F4FC] hover:shadow-sm")}>
                          <ExternalLink className="h-[18px] w-[18px] flex-none opacity-70" />
                          <span className="text-[14px] font-semibold">{th("dashboard")}</span>
                        </Link>
                      </div>
                    )}

                    {(!isLoggedIn || !user) && (
                      <div className="px-2 pb-2">
                        <Link locale={currentLocale} href="/sign-in" onClick={closePublicMobileMenu} className="block w-full">
                          <PrimaryButton className="h-11 w-full text-center">{safeT("login", "Sign in")}</PrimaryButton>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
