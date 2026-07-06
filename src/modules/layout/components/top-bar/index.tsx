"use client"

import { useMemo, useTransition, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import { updateLocale } from "@lib/data/locale-actions"
import SimpleDropdown from "./simple-dropdown"
import { Phone, Mail } from "lucide-react"
import { Locale } from "@lib/data/locales"
import { HttpTypes } from "@medusajs/types"

type TopBarProps = {
  locales: Locale[] | null
  currentLocale: string | null
  regions: HttpTypes.StoreRegion[] | null
  className?: string
}

/* ------------------------------------------------------------------ */
/* Language icon (globe)                                               */
/* ------------------------------------------------------------------ */
function GlobeIcon() {
  return (
    <svg
      className="hidden xl:block w-4 h-4 stroke-1"
      viewBox="0 0 18 18"
      stroke="currentColor"
      fill="none"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.46661 13.6167L3.44161 13.025C3.53831 12.9654 3.61815 12.882 3.67358 12.7829C3.729 12.6837 3.75816 12.572 3.75828 12.4584L3.77495 9.45005C3.77628 9.32533 3.81392 9.20371 3.88328 9.10005L5.53328 6.50838C5.58279 6.43181 5.64731 6.36607 5.72293 6.31512C5.79855 6.26416 5.88371 6.22906 5.97327 6.21193C6.06283 6.1948 6.15493 6.19599 6.24402 6.21543C6.33311 6.23487 6.41733 6.27216 6.49161 6.32505L8.12495 7.50838C8.26587 7.60663 8.4374 7.65099 8.60828 7.63338L11.2333 7.27505C11.3925 7.25312 11.538 7.17296 11.6416 7.05005L13.4916 4.91672C13.6013 4.78667 13.6579 4.62 13.6499 4.45005L13.5583 2.42505"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.925 15.3083L13.025 14.4083C12.9418 14.3251 12.8384 14.2648 12.725 14.2333L10.9334 13.7666C10.776 13.7235 10.6399 13.6243 10.5508 13.4876C10.4617 13.3509 10.4259 13.1863 10.45 13.025L10.6417 11.675C10.6607 11.5614 10.7081 11.4545 10.7795 11.3642C10.8509 11.2739 10.944 11.203 11.05 11.1583L13.5834 10.1C13.701 10.0509 13.8303 10.0366 13.9558 10.0587C14.0814 10.0809 14.1979 10.1386 14.2917 10.225L16.3667 12.125"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Currency icon                                                       */
/* ------------------------------------------------------------------ */
function CurrencyIcon() {
  return (
    <svg
      className="hidden xl:block w-4 h-4 stroke-1"
      viewBox="0 0 16 16"
      stroke="currentColor"
      fill="none"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0.666687 2.66675V5.33341C0.666687 6.43808 2.45735 7.33341 4.66669 7.33341C6.87602 7.33341 8.66669 6.43808 8.66669 5.33341V2.66675"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0.666687 5.3335V8.00016C0.666687 9.10483 2.45735 10.0002 4.66669 10.0002C5.69135 10.0002 6.62535 9.80683 7.33335 9.49016"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0.666687 8V10.6667C0.666687 11.7713 2.45735 12.6667 4.66669 12.6667C5.69135 12.6667 6.62602 12.474 7.33335 12.1573"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.66669 4.66675C6.87583 4.66675 8.66669 3.77132 8.66669 2.66675C8.66669 1.56218 6.87583 0.666748 4.66669 0.666748C2.45755 0.666748 0.666687 1.56218 0.666687 2.66675C0.666687 3.77132 2.45755 4.66675 4.66669 4.66675Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.33337 8V10.6667C7.33337 11.7713 9.12404 12.6667 11.3334 12.6667C13.5427 12.6667 15.3334 11.7713 15.3334 10.6667V8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.33337 10.6667V13.3334C7.33337 14.4381 9.12404 15.3334 11.3334 15.3334C13.5427 15.3334 15.3334 14.4381 15.3334 13.3334V10.6667"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.3334 10C13.5425 10 15.3334 9.10457 15.3334 8C15.3334 6.89543 13.5425 6 11.3334 6C9.12424 6 7.33337 6.89543 7.33337 8C7.33337 9.10457 9.12424 10 11.3334 10Z"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Locale display helper                                               */
/* ------------------------------------------------------------------ */
function getLocalizedLanguageName(
  code: string,
  fallback: string,
  displayLocale?: string
): string {
  try {
    const displayNames = new Intl.DisplayNames([displayLocale ?? "en-US"], {
      type: "language",
    })
    return displayNames.of(code) ?? fallback
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ */
/* TopBar component                                                    */
/* ------------------------------------------------------------------ */
export default function TopBar({
  locales,
  currentLocale,
  regions,
  className = "",
}: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { countryCode } = useParams()
  const [isPending, startTransition] = useTransition()

  /* -------------------------------------------------- */
  /* Language options                                    */
  /* -------------------------------------------------- */
  const localeOptions = useMemo(() => {
    if (!locales) return []
    return locales.map((l) => ({
      code: l.code,
      label: getLocalizedLanguageName(l.code, l.name, currentLocale ?? "en-US"),
    }))
  }, [locales, currentLocale])

  const currentLocaleLabel = useMemo(() => {
    if (!currentLocale || !locales) return "Default"
    const found = locales.find(
      (l) => l.code.toLowerCase() === currentLocale.toLowerCase()
    )
    return found
      ? getLocalizedLanguageName(found.code, found.name, currentLocale ?? "en-US")
      : "Default"
  }, [currentLocale, locales])

  /* -------------------------------------------------- */
  /* Country options                                     */
  /* -------------------------------------------------- */
  const countryOptions = useMemo(() => {
    if (!regions) return []
    return regions
      .flatMap((r) =>
        (r.countries ?? []).map((c) => ({
          countryCode: c.iso_2 ?? "",
          label: c.display_name ?? "",
        }))
      )
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  const currentCountryLabel = useMemo(() => {
    if (!countryCode) return ""
    const found = countryOptions.find(
      (o) => o.countryCode === countryCode
    )
    return found?.label ?? ""
  }, [countryCode, countryOptions])

  /* -------------------------------------------------- */
  /* Handlers                                            */
  /* -------------------------------------------------- */
  const handleLocaleChange = (code: string) => {
    startTransition(async () => {
      await updateLocale(code)
      router.refresh()
      // Notify client components to re-read the locale cookie
      document.dispatchEvent(new CustomEvent("localechange"))
    })
  }

  const handleCountryChange = (country: string) => {
    const currentPath = pathname.split(`/${countryCode}`)[1] ?? pathname
    updateRegion(country, currentPath)
  }

  return (
    <div
      className={`bg-surface-dark text-on-dark w-full h-10 small:h-12 ${className}`}
    >
      <div className="content-container h-full flex items-stretch">
        {/* Left third — Contact info */}
        <div className="flex-1 h-full hidden small:flex items-center gap-x-4">
         
          
          <a
            href="tel:+1234567890"
            className="flex items-center gap-x-1.5 text-sm font-light hover:opacity-80 transition-opacity"
          >
            <Phone className="w-4 h-4" strokeWidth={1} />
            <span>+1 (234) 567-890</span>
          </a>
          <a
            href="mailto:info@infinytree.com"
            className="flex items-center gap-x-1.5 text-sm font-light hover:opacity-80 transition-opacity"
          >
            <Mail className="w-4 h-4" strokeWidth={1} />
            <span>info@infinytree.com</span>
          </a>
        </div>

        {/* Center third — empty */}
        <div className="flex-1 h-full hidden small:block" />

        {/* Right third — Language + Country */}
        <div className="flex-1 h-full hidden small:flex items-center justify-end gap-x-1">
          {locales && locales.length > 0 && (
            <SimpleDropdown
              trigger={
                <span className="flex items-center gap-x-1.5">
                  <GlobeIcon />
                  <span className="leading-tight">{currentLocaleLabel}</span>
                </span>
              }
            >
              <ul className="py-2">
                <li>
                  <button
                    className={`w-full text-left px-4 py-1.5 text-sm hover:bg-surface-dark-elevated ${
                      !currentLocale ? "font-semibold" : ""
                    }`}
                    onClick={() => handleLocaleChange("")}
                    disabled={isPending}
                  >
                    Default
                  </button>
                </li>
                {localeOptions.map((opt) => (
                  <li key={opt.code}>
                    <button
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-surface-dark-elevated ${
                        currentLocale?.toLowerCase() === opt.code.toLowerCase()
                          ? "font-semibold"
                          : ""
                      }`}
                      onClick={() => handleLocaleChange(opt.code)}
                      disabled={isPending}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </SimpleDropdown>
          )}

          {locales && locales.length > 0 && regions && regions.length > 0 && (
            <span aria-hidden="true" className="h-3 w-px bg-gray-600 mx-0.5" />
          )}

          {regions && regions.length > 0 && (
            <SimpleDropdown
              align="right"
              trigger={
                <span className="flex items-center gap-x-1.5">
                  <CurrencyIcon />
                  <span className="leading-tight">
                    {currentCountryLabel || "Select country"}
                  </span>
                </span>
              }
            >
              <ul className="py-2 max-h-[300px] overflow-y-auto">
                {countryOptions.map((opt) => (
                  <li key={opt.countryCode}>
                    <button
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-surface-dark-elevated whitespace-nowrap ${
                        countryCode === opt.countryCode ? "font-semibold" : ""
                      }`}
                      onClick={() => handleCountryChange(opt.countryCode)}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </SimpleDropdown>
          )}
        </div>
      </div>
    </div>
  )
}
