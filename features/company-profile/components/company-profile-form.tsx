"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useLocale } from "next-intl";
import { Globe, Eye, EyeOff } from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { toast } from "sonner";
import { updateSessionUser } from "@/hooks/use-auth";
import Image from "next/image";
import { COUNTRIES } from "@/lib/countries";
import { resolveImageUrl } from "@/lib/utils";
import { compressImageFile } from "@/lib/images/compress-image";
import { ImageDownloadButton } from "@/components/image-download-button";

// Use SVG assets from /public/Linked_accounts for social icons

// ============================================================================

// ============================================================================
// Types
// ============================================================================
type CountryData = { id: number; name: string; code: string };
type CityData = { id: number; name: string };
type CompanyTypeData = { id: number; name: string };

type ProfileFormValues = {
  name: string;
  ceo_name: string;
  email: string;
  website: string;
  country_id: string;
  city_id: string;
  phone: string;
  dial_code: string;
  postal_code: string;
  num_of_employees: string;
  company_type_id: string;
  description: string;
  new_password?: string;
  confirm_password?: string;
  facebook?: string;
  linkedin?: string;
  twitter_x?: string;
  pinterest?: string;
};

type InitialProfileData = {
  name?: string
  email?: string
  phone?: string
  company_name?: string | Record<string, unknown>
  country_id?: number
  country?: { id?: number }
  city?: { id?: number } | number
  avatar?: string | null
  cover_image?: string | null
  company_type?: { id?: number }
  company_type_id?: number | string
  ceo_name?: string | Record<string, unknown>
  description?: string | Record<string, unknown>
  postal_code?: string
  num_of_employees?: number
  facebook?: string
  linkedin?: string
  twitter_x?: string
  pinterest?: string
  website?: string
}

// DIALING_CODES will be computed inside the component with useMemo

// ============================================================================
// Styles
// ============================================================================
const fieldBase =
  "w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#525252] bg-transparent outline-none transition-colors focus:border-[#40A0CA] placeholder:text-[#A3A3A3]";

const selectBase =
  "w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#525252] bg-transparent outline-none transition-colors focus:border-[#40A0CA] appearance-none cursor-pointer";

function normalizeProfile(raw: any): InitialProfileData {
  if (!raw) return {}

  // If wrapped in { data }
  if (raw && typeof raw === "object" && "data" in raw) raw = (raw as any).data

  const out: InitialProfileData = {}

  // Top-level fallbacks (snake_case) or camelCase nested companyProfile
  const cp = raw.companyProfile || raw.company_profile || raw.company || null

  // Basic fields
  out.name = raw.name || (cp && (cp.companyName || cp.name)) || raw.company_name || ""
  out.email = raw.email || raw.email_address || ""
  out.phone = raw.phone || raw.mobile || ""

  // Company name (may be localized object or string)
  out.company_name = raw.company_name || (cp && (cp.companyName || cp.name)) || undefined

  // CEO name
  out.ceo_name = raw.ceo_name || (cp && (cp.ceoName || cp.ceo_name)) || undefined

  // Description (localized or string)
  out.description = raw.description || (cp && (cp.description || cp.desc)) || undefined

  // Website / postal / num_of_employees
  out.website = raw.website || (cp && (cp.website || cp.website_url)) || undefined
  out.postal_code = raw.postal_code || (cp && (cp.postalCode || cp.postal_code)) || undefined
  out.num_of_employees = (raw.num_of_employees as any) ?? (cp && (cp.numOfEmployees || cp.num_of_employees)) ?? undefined

  // Company type id
  out.company_type_id = raw.company_type_id ?? (raw.company_type && (raw.company_type.id ?? raw.company_type_id)) ?? (cp && (cp.company_type_id || cp.companyType?.id)) ?? undefined

  // Country / city
  out.country_id = raw.country_id ?? (raw.country && (raw.country.id ?? undefined)) ?? (cp && (cp.country?.id ?? undefined))
  out.city = raw.city ?? (cp && (cp.city ?? undefined)) ?? undefined

  // Avatar / cover
  // For companies, prefer the company logo (cp.logoUrl) over the generic user avatar.
  // raw.avatar is the user's personal avatar which stays unchanged when a company
  // logo is uploaded — always read the company logo first.
  out.avatar = (cp && (cp.logoUrl || cp.logo || cp.logo_url)) || raw.logoUrl || raw.logo || raw.logo_url || raw.avatar || raw.avatar_url || null
  out.cover_image = raw.cover_image || raw.coverImage || (cp && (cp.coverImageUrl || cp.cover_image)) || null

  // Socials
  out.facebook = raw.facebook || (cp && (cp.socialMedia?.facebook || cp.facebook)) || undefined
  out.linkedin = raw.linkedin || (cp && (cp.socialMedia?.linkedin || cp.linkedin)) || undefined
  out.twitter_x = raw.twitter_x || (cp && (cp.socialMedia?.twitterX || cp.twitter_x)) || undefined
  out.pinterest = raw.pinterest || (cp && (cp.socialMedia?.pinterest || cp.pinterest)) || undefined

  return out
}

// ============================================================================
// Main Component
// ============================================================================
export default function CompanyProfileForm({
  initialProfile,
  serverCountries,
  serverCities,
}: {
  initialProfile?: InitialProfileData
  serverCountries?: CountryData[]
  serverCities?: CityData[]
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const isDe = locale === "de";
  const DIALING_CODES = React.useMemo(() => {
    try {
      return [...COUNTRIES]
        .sort((a, b) => b.dialCode.length - a.dialCode.length)
        .map((c, idx) => ({
          code: c.dialCode,
          country: c.code,
          uniqueKey: `${c.code}-${idx}`,
          flag: c.flag,
          name: c.name,
        }));
    } catch (e) {
      return [] as Array<{ code: string; country: string; uniqueKey: string; flag: string; name: string }>;
    }
  }, []);
  // NOTE: avoid client-only conditional rendering that changes the DOM
  // between server and client — compute stable initial defaults instead
  // so SSR output matches the client initial render and prevents
  // hydration mismatches.

  const labelAlignClass = isAr ? "text-right" : "text-left";

  const initialFormDefaults = React.useMemo(() => {
    const out: Record<string, any> = {
      name: "",
      ceo_name: "",
      email: "",
      website: "",
      country_id: "",
      city_id: "",
      phone: "",
      dial_code: "+20",
      postal_code: "",
      num_of_employees: "",
      company_type_id: "",
      description: "",
      facebook: "",
      linkedin: "",
      twitter_x: "",
      pinterest: "",
    } as Record<string, string>

    if (!initialProfile) return out

    const raw = initialProfile as any
    const cp = raw.companyProfile || raw.company_profile || raw.company || null

    out.name = raw.name || (cp && (cp.companyName || cp.name)) || raw.company_name || ""
    out.ceo_name = raw.ceo_name || (cp && (cp.ceoName || cp.ceo_name)) || ""
    out.email = raw.email || raw.email_address || ""
    out.website = raw.website || (cp && (cp.website || cp.website_url)) || ""
    out.postal_code = raw.postal_code || (cp && (cp.postalCode || cp.postal_code)) || ""
    out.num_of_employees = String((raw.num_of_employees as any) ?? (cp && (cp.numOfEmployees || cp.num_of_employees)) ?? "")

    out.company_type_id = String(
      raw.company_type_id ?? (raw.company_type && (raw.company_type.id ?? raw.company_type_id)) ?? (cp && (cp.company_type_id || cp.companyType?.id)) ?? ""
    )

    const countryId = raw.country_id ?? (raw.country && (raw.country.id ?? undefined)) ?? (cp && (cp.country?.id ?? undefined)) ?? ""
    out.country_id = String(countryId || "")

    const cityId = raw.city ? (typeof raw.city === "object" ? (raw.city as any).id : raw.city) : (cp && (cp.city ?? undefined)) ?? ""
    out.city_id = String(cityId || "")

    // Phone/dial
    const rawPhone = raw.phone || ""
    let parsedDial = "+20"
    let parsedPhone = rawPhone
    for (const d of DIALING_CODES) {
      if (rawPhone && rawPhone.startsWith(d.code)) {
        parsedDial = d.code
        parsedPhone = rawPhone.slice(d.code.length)
        break
      }
    }
    out.dial_code = parsedDial
    out.phone = parsedPhone

    out.description = raw.description || (cp && (cp.description || cp.desc)) || ""
    out.facebook = raw.facebook || (cp && (cp.socialMedia?.facebook || cp.facebook)) || ""
    out.linkedin = raw.linkedin || (cp && (cp.socialMedia?.linkedin || cp.linkedin)) || ""
    out.twitter_x = raw.twitter_x || (cp && (cp.socialMedia?.twitterX || cp.twitter_x)) || ""
    out.pinterest = raw.pinterest || (cp && (cp.socialMedia?.pinterest || cp.pinterest)) || ""

    return out as ProfileFormValues
  }, [initialProfile, DIALING_CODES])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: initialFormDefaults,
  });

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>(serverCountries || []);
  const [cities, setCities] = useState<CityData[]>(serverCities || []);
  const [citiesLoading, setCitiesLoading] = useState<boolean>(false);
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeData[]>([]);

  // Images
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!initialProfile) return null;
    const raw = normalizeProfile(initialProfile as any);
    return raw.avatar ? resolveImageUrl(raw.avatar) : null;
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(() => {
    if (!initialProfile) return null;
    const raw = normalizeProfile(initialProfile as any);
    return raw.cover_image ? resolveImageUrl(raw.cover_image) : null;
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const lastFetchedCountryIdRef = React.useRef<string | null>(null);
  const [activeSocial, setActiveSocial] = useState<string | null>(null);

  // Password visibility
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const selectedCountryId = watch("country_id");
  const selectedDialCode = watch("dial_code");

  // Use server-provided initialProfile to compute a stable initial country id
  // so the `disabled` attribute on the city select is the same during SSR
  // and on the client initial render (pre-hydration).
  const initialCountryIdFromProfile = initialProfile
    ? String(
        (initialProfile.country_id ?? (initialProfile.country && typeof initialProfile.country === "object" ? (initialProfile.country as any).id : initialProfile.country) ?? "")
      )
    : "";
  const computedSelectedCountryId = (selectedCountryId || initialCountryIdFromProfile) as string;

  // Start the city select in a disabled state on both server and client to
  // avoid SSR/client markup mismatches (we fetch cities client-side). After
  // the client finishes loading cities we'll update `cityDisabled`.
  const initialCityDisabled = true;
  const [cityDisabled, setCityDisabled] = useState<boolean>(initialCityDisabled);
  useEffect(() => {
    // After hydration/update, compute actual runtime disabled state.
    setCityDisabled(Boolean(!computedSelectedCountryId || cities.length === 0));
  }, [computedSelectedCountryId, cities.length]);

  // Debugging helper: log values after mount so we can see what differs
  useEffect(() => {
    console.debug("CompanyProfileForm:init", {
      initialCountryIdFromProfile,
      computedSelectedCountryId,
      initialCityDisabled,
      cityDisabled,
      citiesLength: cities.length,
      citiesLoading,
    });
  }, [initialCountryIdFromProfile, computedSelectedCountryId, initialCityDisabled, cityDisabled, cities.length]);
  // Position helper for avatar edit button (use logical placement for RTL)
  // Position the avatar edit button slightly inside the avatar circle; use
  // logical sides for RTL/LTR to keep placement deterministic.

  // --------------------------------------------------------------------------
  // Load initial data and hydrate form from server-provided initialProfile
  // --------------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const loadMetadata = async () => {
      try {
        // If server provided countries, use them; otherwise fetch.
        const countriesPromise = serverCountries ? Promise.resolve({ data: serverCountries }) : fetch(`/api/countries?locale=${locale}`).then((r) => r.json());
        const companyTypesPromise = fetch(`/api/company-types?locale=${locale}`).then((r) => r.json());

        const [countriesRes, companyTypesRes] = await Promise.all([countriesPromise, companyTypesPromise]);
        if (!active) return;
        if (countriesRes?.data) setCountries(countriesRes.data);
        if (companyTypesRes?.data) setCompanyTypes(companyTypesRes.data);
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };

    loadMetadata();

    // Client-side fallback: if the server did not provide initialProfile (SSR fetch
    // failed), fetch it here so the form is never shown empty after a refresh.
    const hydrate = async (profileData: any) => {
      const raw = normalizeProfile(profileData);

      const companyName = String(
        typeof raw.company_name === "string"
          ? raw.company_name
          : (raw.company_name && (raw.company_name as Record<string, unknown>)[locale]) ||
              (raw.company_name && (raw.company_name as Record<string, unknown>).ar) ||
              (raw.company_name && (raw.company_name as Record<string, unknown>).en) ||
              ""
      );

      const ceoName = String(
        typeof raw.ceo_name === "string"
          ? raw.ceo_name
          : (raw.ceo_name && (raw.ceo_name as Record<string, unknown>)[locale]) ||
              (raw.ceo_name && (raw.ceo_name as Record<string, unknown>).ar) ||
              (raw.ceo_name && (raw.ceo_name as Record<string, unknown>).en) ||
              ""
      );

      const descriptionText = String(
        typeof raw.description === "string"
          ? raw.description
          : (raw.description && (raw.description as Record<string, unknown>)[locale]) ||
              (raw.description && (raw.description as Record<string, unknown>).ar) ||
              (raw.description && (raw.description as Record<string, unknown>).en) ||
              ""
      );

      const rawCompanyTypeId = (raw as { company_type_id?: number | string }).company_type_id;
      const companyTypeId = (raw.company_type && (raw.company_type as { id?: number }).id) ?? rawCompanyTypeId;

      if (!active) return;
      setValue("name", companyName);
      setValue("ceo_name", ceoName);
      setValue("email", raw.email || "");
      setValue("website", raw.website || "");
      setValue("postal_code", raw.postal_code || "");
      setValue("num_of_employees", String(raw.num_of_employees || ""));
      setValue("company_type_id", String(companyTypeId ?? ""));
      setValue("description", descriptionText);

      const countryId = raw.country_id ?? (raw.country && typeof raw.country === "object" ? (raw.country as { id?: number }).id : undefined) ?? "";
      setValue("country_id", String(countryId));

      const cityId = raw.city ? (typeof raw.city === "object" ? (raw.city as { id?: number }).id : raw.city) : "";
      if (countryId) {
        lastFetchedCountryIdRef.current = String(countryId);
        setCitiesLoading(true);
        if (serverCities && serverCities.length > 0) {
          setCities(serverCities);
          setValue("city_id", String(cityId));
          if (active) setCitiesLoading(false);
        } else {
          fetch(`/api/cities?countryId=${countryId}&locale=${locale}`)
            .then((r) => r.json())
            .then((cData) => {
              if (active && cData.data) {
                setCities(cData.data);
                setValue("city_id", String(cityId));
              }
            })
            .catch(() => {})
            .finally(() => {
              if (active) setCitiesLoading(false);
            });
        }
      }

      const rawPhone = raw.phone || "";
      let parsedPhone = rawPhone;
      let parsedDial = "+20";
      for (const d of DIALING_CODES) {
        if (rawPhone.startsWith(d.code)) {
          parsedDial = d.code;
          parsedPhone = rawPhone.slice(d.code.length);
          break;
        }
      }
      setValue("dial_code", parsedDial);
      setValue("phone", parsedPhone);

      setValue("facebook", raw.facebook || "");
      setValue("linkedin", raw.linkedin || "");
      setValue("twitter_x", raw.twitter_x || "");
      setValue("pinterest", raw.pinterest || "");

      setAvatarUrl(raw.avatar ? resolveImageUrl(raw.avatar) : null);
      setCoverUrl(raw.cover_image ? resolveImageUrl(raw.cover_image) : null);
    };

    if (initialProfile) {
      hydrate(initialProfile);
    } else {
      // SSR fetch failed — try to load from API on the client
      fetch("/api/auth/profile", { cache: "no-store", credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          const profileData = data?.data || data;
          if (profileData) hydrate(profileData);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [setValue, locale, initialProfile]);


  // Re-populate company_type_id once companyTypes options have loaded (they load
  // asynchronously so setValue runs before <option> elements exist in the DOM).
  useEffect(() => {
    if (!initialProfile || companyTypes.length === 0) return;
    const raw = normalizeProfile(initialProfile as any);
    const companyTypeId =
      (raw.company_type && (raw.company_type as { id?: number }).id) ??
      (raw as { company_type_id?: number | string }).company_type_id;
    if (companyTypeId) {
      setValue("company_type_id", String(companyTypeId));
    }
  }, [companyTypes, initialProfile, setValue]);

  // Re-populate country_id once countries options have loaded.
  useEffect(() => {
    if (!initialProfile || countries.length === 0) return;
    const raw = normalizeProfile(initialProfile as any);
    const countryId =
      raw.country_id ??
      (raw.country && typeof raw.country === "object"
        ? (raw.country as { id?: number }).id
        : undefined) ??
      "";
    if (countryId) {
      setValue("country_id", String(countryId));
    }
  }, [countries, initialProfile, setValue]);

  // Load cities when country changes
  useEffect(() => {
    if (!selectedCountryId) {
      setCities([]);
      lastFetchedCountryIdRef.current = null;
      setCitiesLoading(false);
      return;
    }
    // If we've already fetched this country's cities and they are present,
    // avoid refetching. If cities are empty, still attempt to fetch again.
    if (selectedCountryId === lastFetchedCountryIdRef.current && cities.length > 0) {
      return;
    }
    let active = true;
    lastFetchedCountryIdRef.current = selectedCountryId;
    setCitiesLoading(true);
    fetch(`/api/cities?countryId=${selectedCountryId}&locale=${locale}`)
      .then((r) => r.json())
      .then((cData) => {
        if (active && cData.data) setCities(cData.data);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setCitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCountryId, locale]);

  // --------------------------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: ProfileFormValues) => {
      setLoading(true);

      try {
        if (data.new_password && data.new_password !== data.confirm_password) {
          throw new Error(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
        }

        // Build both a plain JSON payload and a FormData fallback. If no files
        // are present, prefer JSON so structured nested fields (like
        // `company_type: { id: ... }`) are reliably interpreted by upstream.
        const shouldUseForm = Boolean(avatarFile || coverFile);

        const plain: Record<string, any> = {};
        const putIf = (key: string, value: unknown) => {
          if (value === undefined || value === null) return;
          if (typeof value === 'string' && value.trim() === '') return;
          plain[key] = value;
        };

        putIf('name', data.name);
        putIf('website', data.website);
        putIf('country_id', data.country_id ? Number(data.country_id) : undefined);
        putIf('city_id', data.city_id ? Number(data.city_id) : undefined);
        putIf('postal_code', data.postal_code);
        putIf('num_of_employees', data.num_of_employees ? Number(data.num_of_employees) : undefined);
        putIf('company_type_id', data.company_type_id ? Number(data.company_type_id) : undefined);
        if (data.company_type_id) {
          putIf('company_type', { id: Number(data.company_type_id) });
        }
        if ((data.phone || '').trim()) putIf('phone', `${data.dial_code || ''}${data.phone}`);

        if (data.name) {
          putIf('company_name', { ar: data.name, en: data.name, de: data.name });
        }
        if (data.ceo_name) {
          putIf('ceo_name', { ar: data.ceo_name, en: data.ceo_name, de: data.ceo_name });
        }
        if (data.description) {
          putIf('description', { ar: data.description, en: data.description, de: data.description });
        }

        putIf('facebook', data.facebook);
        putIf('linkedin', data.linkedin);
        putIf('twitter_x', data.twitter_x);
        putIf('pinterest', data.pinterest);
        putIf('user_facebook', data.facebook);
        putIf('user_linkedin', data.linkedin);
        putIf('user_twitter_x', data.twitter_x);
        putIf('user_pinterest', data.pinterest);

        let res: Response;
        if (shouldUseForm) {
          const fd = new FormData();
          if (avatarFile) fd.append('logo', avatarFile);
          if (coverFile) fd.append('cover_image', coverFile);

          const appendIf = (key: string, value: unknown) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (value instanceof File || value instanceof Blob) {
              fd.append(key, value as any);
              return;
            }
            if (Array.isArray(value)) {
              value.forEach((it) => appendIf(`${key}[]`, it));
              return;
            }
            if (typeof value === 'object') {
              Object.entries(value as Record<string, unknown>).forEach(([k, v]) => appendIf(`${key}[${k}]`, v));
              return;
            }
            fd.append(key, String(value));
          };

          appendIf('name', data.name);
          appendIf('website', data.website);
          appendIf('country_id', data.country_id);
          appendIf('city_id', data.city_id);
          appendIf('postal_code', data.postal_code);
          appendIf('num_of_employees', data.num_of_employees);
          appendIf('company_type_id', data.company_type_id);
          if ((data.phone || '').trim()) appendIf('phone', `${data.dial_code || ''}${data.phone}`);

          if (data.name) {
            appendIf('company_name[ar]', data.name);
            appendIf('company_name[en]', data.name);
            appendIf('company_name[de]', data.name);
          }
          if (data.ceo_name) {
            appendIf('ceo_name[ar]', data.ceo_name);
            appendIf('ceo_name[en]', data.ceo_name);
            appendIf('ceo_name[de]', data.ceo_name);
          }
          if (data.description) {
            appendIf('description[ar]', data.description);
            appendIf('description[en]', data.description);
            appendIf('description[de]', data.description);
          }

          appendIf('facebook', data.facebook);
          appendIf('linkedin', data.linkedin);
          appendIf('twitter_x', data.twitter_x);
          appendIf('pinterest', data.pinterest);
          appendIf('user_facebook', data.facebook);
          appendIf('user_linkedin', data.linkedin);
          appendIf('user_twitter_x', data.twitter_x);
          appendIf('user_pinterest', data.pinterest);

          res = await fetch('/api/auth/profile', { method: 'POST', body: fd });
        } else {
          res = await fetch('/api/auth/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plain) });
        }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Failed to update profile");

        // Try to retrieve fresh profile, falling back to POST response if needed
        let norm: InitialProfileData;
        try {
          const fresh = await fetch("/api/auth/profile", { cache: "no-store" });
          if (fresh.ok) {
            const freshPayload = await fresh.json();
            norm = normalizeProfile(freshPayload?.data || freshPayload);
          } else {
            norm = normalizeProfile(payload?.data || payload);
          }
        } catch {
          norm = normalizeProfile(payload?.data || payload);
        }

        // Apply session update
        const sessionUpdate: Record<string, unknown> = {};
        if (norm.avatar) {
          const logoUrl = resolveImageUrl(norm.avatar) || norm.avatar;
          sessionUpdate.avatar = logoUrl;
          sessionUpdate.company = { logoUrl, logo: logoUrl, logo_url: logoUrl, avatar: logoUrl, avatar_url: logoUrl };
          sessionUpdate.company_profile = { logoUrl, logo: logoUrl, logo_url: logoUrl, avatar: logoUrl, avatar_url: logoUrl };
          sessionUpdate.companyProfile = { logoUrl, logo: logoUrl, logo_url: logoUrl, avatar: logoUrl, avatar_url: logoUrl };
        }
        if (norm.name) sessionUpdate.name = norm.name;
        if (Object.keys(sessionUpdate).length > 0) {
          updateSessionUser(sessionUpdate);
        }

        // Update local form fields from final profile data
        setValue("name", norm.name || "");
        setValue("ceo_name", (typeof norm.ceo_name === "string" ? norm.ceo_name : "") || "");
        setValue("email", norm.email || "");
        setValue("website", norm.website || "");
        setValue("postal_code", norm.postal_code || "");
        setValue("num_of_employees", String(norm.num_of_employees || ""));
        setValue("company_type_id", String((norm.company_type_id as any) ?? ""));
        setValue("description", typeof norm.description === "string" ? norm.description : "");
        setValue("facebook", norm.facebook || "");
        setValue("linkedin", norm.linkedin || "");
        setValue("twitter_x", norm.twitter_x || "");
        setValue("pinterest", norm.pinterest || "");

        if (norm.country_id) {
          setValue("country_id", String(norm.country_id));
          lastFetchedCountryIdRef.current = String(norm.country_id);
          try {
            const cRes = await fetch(`/api/cities?countryId=${norm.country_id}&locale=${locale}`, { cache: "no-store" });
            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData.data) {
                setCities(cData.data);
                const cityId = norm.city ? (typeof norm.city === "object" ? (norm.city as any).id : norm.city) : "";
                setValue("city_id", String(cityId));
              }
            }
          } catch {}
        }

        setAvatarUrl(norm.avatar ? resolveImageUrl(norm.avatar) : null);
        setCoverUrl(norm.cover_image ? resolveImageUrl(norm.cover_image) : null);
        setAvatarFile(null);
        setCoverFile(null);

        if (data.new_password) {
          const pwRes = await fetch("/api/auth/profile/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              current_password: "",
              new_password: data.new_password,
              new_password_confirmation: data.confirm_password,
            }),
          });
          const pwPayload = await pwRes.json();
          if (!pwRes.ok) throw new Error(pwPayload?.message || "Failed to update password");
        }

        const successMsg = isAr ? "تم حفظ التعديلات بنجاح" : isDe ? "Profiländerungen erfolgreich gespeichert" : "Profile changes saved successfully";
        toast.success(successMsg);
      } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : (isAr ? "حدث خطأ غير متوقع" : isDe ? "Ein unerwarteter Fehler ist aufgetreten" : "An unexpected error occurred");
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [avatarFile, coverFile, isAr, locale]
  );

  // File handlers
  const compressAndPreviewFile = async (file: File) => {
    try {
      return await compressImageFile(file)
    } catch (error) {
      console.warn("Image compression failed, using original file", error)
      return file
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressAndPreviewFile(file)
      setAvatarFile(compressed);
      setAvatarUrl(URL.createObjectURL(compressed));
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressAndPreviewFile(file)
      setCoverFile(compressed);
      setCoverUrl(URL.createObjectURL(compressed));
    }
  };

  const activeDialObj = DIALING_CODES.find((d) => d.code === selectedDialCode) || DIALING_CODES[0] || { flag: "🌍", code: "+20" };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col " dir={isAr ? "rtl" : "ltr"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ==================== COMPANY BASIC INFO CARD ==================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          {/* Cover + Avatar */}
          <div className="px-8 pt-8">
              <div className="relative w-full rounded-xl h-[180px] md:h-[260px]">
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover Banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[linear-gradient(135deg,_#0a1628_0%,_#1a3a5c_40%,_#2a4a6c_60%,_#1a3a5c_100%)]">
                    <svg
                      viewBox="0 0 800 260"
                      className="absolute inset-0 w-full h-full opacity-30"
                      preserveAspectRatio="xMidYMax slice"
                    >
                      <defs>
                        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#40A0CA" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#006EA8" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                      <rect x="50" y="100" width="40" height="160" fill="url(#skyGrad)" rx="2" />
                      <rect x="100" y="60" width="50" height="200" fill="url(#skyGrad)" rx="2" />
                      <rect x="160" y="120" width="35" height="140" fill="url(#skyGrad)" rx="2" />
                      <rect x="205" y="80" width="45" height="180" fill="url(#skyGrad)" rx="2" />
                      <rect x="260" y="40" width="55" height="220" fill="url(#skyGrad)" rx="2" />
                      <rect x="325" y="90" width="40" height="170" fill="url(#skyGrad)" rx="2" />
                      <rect x="375" y="50" width="60" height="210" fill="url(#skyGrad)" rx="2" />
                      <rect x="445" y="110" width="35" height="150" fill="url(#skyGrad)" rx="2" />
                      <rect x="490" y="70" width="50" height="190" fill="url(#skyGrad)" rx="2" />
                      <rect x="550" y="30" width="45" height="230" fill="url(#skyGrad)" rx="2" />
                      <rect x="605" y="100" width="40" height="160" fill="url(#skyGrad)" rx="2" />
                      <rect x="655" y="60" width="55" height="200" fill="url(#skyGrad)" rx="2" />
                      <rect x="720" y="90" width="35" height="170" fill="url(#skyGrad)" rx="2" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 top-1/2 flex justify-center -translate-y-1/2 z-20 gap-2">
                <label className="cursor-pointer">
                  <span
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,110,168,0.3),_inset_0_1px_2px_rgba(255,255,255,0.2)] bg-gradient-to-b from-[#006EA8] to-[#005685] transition-all hover:scale-105 active:scale-95"
                  >
                    <img src="/update.svg" alt="update" className="h-4 w-4" />
                    {isAr ? "تغيير الغلاف" : isDe ? "Titelbild ändern" : "Replace Cover"}
                  </span>
                  <input type="file" accept="image/*" aria-label={isAr ? "تحميل صورة الغلاف" : isDe ? "Titelbild hochladen" : "Upload cover image"} className="hidden" onChange={handleCoverChange} />
                </label>
                {coverUrl ? (
                  <ImageDownloadButton
                    src={coverUrl}
                    filename="company-cover.jpg"
                    className="bg-white/95 shadow-md"
                  />
                ) : null}
              </div>

              <div className="absolute left-1/2 top-full z-30 -translate-x-1/2 -translate-y-10 md:-translate-y-16">
                <div className="relative h-[140px] w-[140px] md:h-[170px] md:w-[170px]">
                  <div className="h-full w-full rounded-full p-0.5 bg-white flex items-center justify-center shadow-[0_30px_80px_rgba(15,23,42,0.18)] overflow-visible">
                    <div className="h-full w-full rounded-full overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Company logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center text-[#006EA8]">
                          <Globe className="h-12 w-12 stroke-[1.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Edit button sits over the avatar (floating) */}
                  <label
                    aria-label={isAr ? "تحميل صورة الشعار" : isDe ? "Logo hochladen" : "Upload avatar image"}
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 bg-gradient-to-b from-[#006EA8] to-[#005685] z-50 shadow-[0_10px_30px_rgba(0,110,168,0.28)]"
                  >
                    <img src="/update.svg" alt="update" className="h-4 w-4 text-white" />
                    <input type="file" accept="image/*" aria-hidden className="hidden" onChange={handleAvatarChange} />
                  </label>
                  {avatarUrl ? (
                    <div className="absolute bottom-2 left-2 z-50">
                      <ImageDownloadButton src={avatarUrl} filename="company-logo.jpg" size="icon" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="h-[110px] md:h-[140px]" /> {/* spacer for avatar */}

          {/* Form fields grid */}
          <div className="px-8 pb-8">
            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              {/* Company Name */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "اسم الشركة *" : isDe ? "Firmenname *" : "Company Name *"}
                </label>
                <input type="text" className={fieldBase} {...register("name")} />
              </div>

              {/* CEO Name */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "اسم الرئيس التنفيذي *" : isDe ? "Name des CEO *" : "Company ceo name *"}
                </label>
                <input type="text" className={fieldBase} {...register("ceo_name")} />
              </div>

              {/* Email (disabled) */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "البريد الإلكتروني *" : isDe ? "E-Mail *" : "Email *"}
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full border-b border-[#D4D4D4] py-2.5 text-sm text-[#A3A3A3] bg-transparent outline-none cursor-not-allowed"
                  {...register("email")}
                />
              </div>

              {/* Website */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "الموقع الإلكتروني *" : isDe ? "Website *" : "Website *"}
                </label>
                <input type="url" placeholder="https://example.com" className={fieldBase} {...register("website")} />
              </div>

              {/* New Password */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">{isAr ? "كلمة المرور الجديدة" : isDe ? "Neues Passwort" : "New password"}</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className={fieldBase + " pe-10"}
                    {...register("new_password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPw((p) => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "تأكيد كلمة المرور الجديدة *" : isDe ? "Neues Passwort bestätigen *" : "Confirm password *"}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className={fieldBase + " pe-10"}
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPw((p) => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "البلد *" : isDe ? "Land *" : "Country *"}
                </label>
                <div className="relative w-full">
                  <select className={selectBase} {...register("country_id")}>
                    <option value="" disabled>{isAr ? "اختر البلد" : isDe ? "Land auswählen" : "Select Country"}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Image
                    src="/portfolio/arrow-down.svg"
                    alt="arrow"
                    width={20}
                    height={20}
                    className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2"
                  />
                </div>
              </div>

              {/* City */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "المدينة *" : isDe ? "Stadt *" : "City *"}
                </label>
                <div className="relative w-full">
                  <select className={selectBase} {...register("city_id")} disabled={cityDisabled} suppressHydrationWarning>
                    {cities.length === 0 ? (
                      <option value="" disabled>
                        {computedSelectedCountryId ? (isAr ? "لا توجد مدن" : isDe ? "Keine Städte gefunden" : "No cities found") : isAr ? "اختر البلد أولاً" : isDe ? "Wählen Sie zuerst ein Land" : "Select a country first"}
                      </option>
                    ) : (
                      <option value="" disabled>{isAr ? "اختر المدينة" : isDe ? "Stadt auswählen" : "Select City"}</option>
                    )}
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Image
                    src="/portfolio/arrow-down.svg"
                    alt="arrow"
                    width={20}
                    height={20}
                    className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2"
                  />
                </div>
              </div>

              {/* Phone with dial code */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "رقم الهاتف *" : isDe ? "Telefonnummer *" : "Phone *"}
                </label>
                <div className="flex items-center border-b border-[#D4D4D4] py-2 focus-within:border-[#40A0CA] transition-colors">
                  <div className="relative flex items-center shrink-0 pe-2 me-2 border-e border-[#D4D4D4] h-6">
                    <select className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" {...register("dial_code")}>
                      {DIALING_CODES.map((d) => (
                        <option key={d.uniqueKey} value={d.code}>{d.flag} {d.code}</option>
                      ))}
                    </select>
                    <>
                      <span className="text-base me-1">{activeDialObj.flag}</span>
                      <span className="text-sm text-[#525252] font-medium" dir="ltr">{activeDialObj.code}</span>
                    </>
                    <Image
                      src="/portfolio/arrow-down.svg"
                      alt="arrow"
                      width={16}
                      height={16}
                      className="h-4 w-4 text-[#A3A3A3] ms-1 pointer-events-none"
                    />
                  </div>
                  <input type="tel" dir="ltr" className="w-full min-w-0 bg-transparent text-sm text-[#525252] outline-none text-right" placeholder="1003630088" {...register("phone")} />
                </div>
              </div>

              {/* Postal Code */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">{isAr ? "الرمز البريدي" : isDe ? "Postleitzahl" : "Postal Code"}</label>
                <input type="text" className={fieldBase} {...register("postal_code")} />
              </div>

              {/* Number of Employees */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">{isAr ? "عدد الموظفين" : isDe ? "Mitarbeiteranzahl" : "Number Of Employees"}</label>
                <input type="number" min={0} className={fieldBase} {...register("num_of_employees")} />
              </div>

              {/* Company Type */}
              <div className={`flex flex-col gap-1.5 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">{isAr ? "تصنيف الشركة (القطاع)" : isDe ? "Unternehmenstyp (Branche)" : "Type Of Company"}</label>
                <div className="relative w-full">
                  <select className={selectBase} {...register("company_type_id")}>
                    <option value="">{isAr ? "اختر القطاع" : isDe ? "Branche auswählen" : "Select Sector"}</option>
                    {companyTypes.map((t) => (
                      <option key={`${t.id}-${t.name}`} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                  <Image
                    src="/portfolio/arrow-down.svg"
                    alt="arrow"
                    width={20}
                    height={20}
                    className="pointer-events-none absolute end-0 top-1/2 h-5 w-5 -translate-y-1/2"
                  />
                </div>
              </div>

              {/* Description (full width) */}
              <div className={`flex flex-col gap-1.5 md:col-span-2 ${labelAlignClass}`}>
                <label className="text-sm font-medium text-[#262626]">
                  {isAr ? "وصف الشركة *" : isDe ? "Unternehmensbeschreibung *" : "Company Description *"}
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#525252] bg-[#FAFAFA] outline-none transition-colors focus:border-[#40A0CA] focus:bg-white resize-y min-h-[100px] placeholder:text-[#A3A3A3]"
                  placeholder={isAr ? "أدخل وصف الشركة..." : isDe ? "Unternehmensbeschreibung eingeben..." : "Enter company description..."}
                  {...register("description")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== COMPANY SOCIAL LINKS CARD ==================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-xl font-bold text-start text-[#006EA8]">
              {isAr ? "روابط التواصل الاجتماعي" : isDe ? "Social-Media-Links des Unternehmens" : "Company Social Links"}
            </h2>
          </div>

          <div className="px-8 pb-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => setActiveSocial(activeSocial === 'facebook' ? null : 'facebook')}
                className={`inline-flex items-center gap-3 h-11 px-5 rounded-lg border transition-all justify-center ${
                  activeSocial === 'facebook'
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-none shadow-[0_4px_12px_rgba(0,110,168,0.2)]"
                    : "bg-white border-[#E6EEF4] text-[#525252] hover:border-[#006EA8] hover:text-[#006EA8]"
                }`}
              >
                <img
                  src="/Linked_accounts/Facebook.svg"
                  alt="Facebook"
                  className="h-4 w-4 shrink-0 transition-all"
                  style={{
                    filter: activeSocial === 'facebook' ? "brightness(0) invert(1)" : "none",
                  }}
                />
                <span className="text-sm font-semibold">Facebook</span>
              </button>

              {/* LinkedIn Button */}
              <button
                type="button"
                onClick={() => setActiveSocial(activeSocial === 'linkedin' ? null : 'linkedin')}
                className={`inline-flex items-center gap-3 h-11 px-5 rounded-lg border transition-all justify-center ${
                  activeSocial === 'linkedin'
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-none shadow-[0_4px_12px_rgba(0,110,168,0.2)]"
                    : "bg-white border-[#E6EEF4] text-[#525252] hover:border-[#006EA8] hover:text-[#006EA8]"
                }`}
              >
                <img
                  src="/Linked_accounts/LinkedIn.svg"
                  alt="LinkedIn"
                  className="h-4 w-4 shrink-0 transition-all"
                  style={{
                    filter: activeSocial === 'linkedin' ? "brightness(0) invert(1)" : "none",
                  }}
                />
                <span className="text-sm font-semibold">LinkedIn</span>
              </button>

              {/* X Button */}
              <button
                type="button"
                onClick={() => setActiveSocial(activeSocial === 'twitter' ? null : 'twitter')}
                className={`inline-flex items-center gap-3 h-11 px-5 rounded-lg border transition-all justify-center ${
                  activeSocial === 'twitter'
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-none shadow-[0_4px_12px_rgba(0,110,168,0.2)]"
                    : "bg-white border-[#E6EEF4] text-[#525252] hover:border-[#006EA8] hover:text-[#006EA8]"
                }`}
              >
                <img
                  src="/Linked_accounts/X.svg"
                  alt="X"
                  className="h-4 w-4 shrink-0 transition-all"
                  style={{
                    filter: activeSocial === 'twitter' ? "brightness(0) invert(1)" : "none",
                  }}
                />
                <span className="text-sm font-semibold">X</span>
              </button>

              {/* Pinterest Button */}
              <button
                type="button"
                onClick={() => setActiveSocial(activeSocial === 'pinterest' ? null : 'pinterest')}
                className={`inline-flex items-center gap-3 h-11 px-5 rounded-lg border transition-all justify-center ${
                  activeSocial === 'pinterest'
                    ? "bg-gradient-to-b from-[#006EA8] to-[#005685] text-white border-none shadow-[0_4px_12px_rgba(0,110,168,0.2)]"
                    : "bg-white border-[#E6EEF4] text-[#525252] hover:border-[#006EA8] hover:text-[#006EA8]"
                }`}
              >
                <img
                  src="/Linked_accounts/pinterest.svg"
                  alt="Pinterest"
                  className="h-4 w-4 shrink-0 transition-all"
                  style={{
                    filter: activeSocial === 'pinterest' ? "brightness(0) invert(1)" : "none",
                  }}
                />
                <span className="text-sm font-semibold">Pinterest</span>
              </button>
            </div>

            {/* Dynamic Editing Field */}
            {activeSocial && (
              <div className="mt-6 p-4 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-[#006EA8] uppercase">
                    {activeSocial === "facebook" && (isAr ? "رابط حساب فيسبوك للشركة" : isDe ? "Facebook-URL des Unternehmens" : "Company Facebook URL")}
                    {activeSocial === "linkedin" && (isAr ? "رابط حساب LinkedIn للشركة" : isDe ? "LinkedIn-URL des Unternehmens" : "Company LinkedIn URL")}
                    {activeSocial === "twitter" && (isAr ? "رابط حساب X (Twitter) للشركة" : isDe ? "X (Twitter)-URL des Unternehmens" : "Company X (Twitter) URL")}
                    {activeSocial === "pinterest" && (isAr ? "رابط حساب Pinterest للشركة" : isDe ? "Pinterest-URL des Unternehmens" : "Company Pinterest URL")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSocial(null)}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold"
                  >
                    {isAr ? "إغلاق" : isDe ? "Schließen" : "Close"}
                  </button>
                </div>
                <input
                  key={activeSocial}
                  type="url"
                  placeholder={`https://${activeSocial === "twitter" ? "x" : activeSocial}.com/...`}
                  className="w-full rounded-lg border border-[#D4D4D4] px-4 py-2.5 text-sm text-[#525252] bg-white outline-none focus:border-[#40A0CA]"
                  {...register(activeSocial === "twitter" ? "twitter_x" : (activeSocial as any))}
                />
              </div>
            )}
          </div>
        </div>

        {/* ==================== NOTIFICATIONS & SUBMIT ==================== */}
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton type="submit" disabled={loading || isSubmitting} className="max-w-[220px] h-[48px] text-base font-semibold shadow-[0_4px_14px_rgba(0,110,168,0.3)] bg-gradient-to-b from-[#006EA8] to-[#005685] hover:from-[#005685] hover:to-[#004066]">
            {loading || isSubmitting
              ? isAr
                ? "جاري الحفظ..."
                : isDe
                ? "Wird gespeichert..."
                : "Saving..."
              : isAr
              ? "تحديث"
              : isDe
              ? "Aktualisieren"
              : "Update"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}



