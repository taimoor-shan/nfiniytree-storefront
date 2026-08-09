"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { StateType } from "@lib/hooks/use-toggle-state"
import { updateLocale } from "@lib/data/locale-actions"
import { Locale } from "@lib/data/locales"

type LanguageOption = {
  code: string
  name: string
  localizedName: string
  languageSubtag: string
}

/**
 * Extracts the language subtag from a BCP 47 locale code (e.g. "de-DE" → "de").
 */
const getLanguageSubtag = (localeCode: string): string => {
  try {
    return new Intl.Locale(localeCode).language
  } catch {
    return localeCode.split(/[-_]/)[0] ?? localeCode
  }
}

/**
 * Strips the parenthetical country portion from a Medusa locale display name.
 *
 * Medusa's /store/locales returns names like "German (Germany)" or
 * "English (United States)".  This regex removes the trailing " (…)"
 * so only the language name remains.
 *
 * This is a last-resort fallback — the primary path uses `Intl.DisplayNames`.
 */
const stripCountryFromName = (name: string): string => {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

type LanguageSelectProps = {
  toggleState: StateType
  locales: Locale[]
  currentLocale: string | null
  /**
   * Optional label shown before the selected language name.
   * Pass `null` to hide (useful in tight UI like the top nav).
   */
  label?: string | null
  /**
   * Optional class overrides for reusing the component in different layouts.
   */
  buttonClassName?: string
  dropdownWrapperClassName?: string
}

/**
 * Returns the localized language name for a given locale code.
 *
 * Uses `Intl.DisplayNames` with `type: "language"` to derive the display
 * name from the locale's language subtag (e.g. "de-DE" → "de" → "German").
 *
 * The `displayLocale` parameter is guarded with `||` (not `??`) because
 * the cookie-stored locale can be an empty string (English default),
 * which would cause `Intl.DisplayNames([""])` to throw RangeError.
 *
 * Falls back to stripping the parenthetical country from the Medusa display
 * name if `Intl.DisplayNames` is unavailable.
 */
const getLocalizedLanguageName = (
  localeCode: string,
  fallbackName: string,
  displayLocale: string = "en-US"
): string => {
  try {
    const lang = getLanguageSubtag(localeCode)
    // || not ?? — empty string is a valid cookie value (English default)
    const locale = displayLocale || "en-US"
    const displayNames = new Intl.DisplayNames([locale], {
      type: "language",
    })
    return displayNames.of(lang) ?? stripCountryFromName(fallbackName)
  } catch {
    return stripCountryFromName(fallbackName)
  }
}

const DEFAULT_OPTION: LanguageOption = {
  code: "",
  name: "English",
  localizedName: "English",
  languageSubtag: "",
}

const LanguageSelect = ({
  toggleState,
  locales,
  currentLocale,
  label = "Language:",
  buttonClassName,
  dropdownWrapperClassName,
}: LanguageSelectProps) => {
  const [current, setCurrent] = useState<LanguageOption | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { state, close } = toggleState

  const options = useMemo(() => {
    const seen = new Set<string>()
    const localeOptions = locales
      // Deduplicate: if the backend returns the same locale code
      // twice (e.g. from cached responses with different locale
      // headers), only keep the first occurrence.
      .filter((locale) => {
        if (seen.has(locale.code)) return false
        seen.add(locale.code)
        return true
      })
      .map((locale) => ({
        code: locale.code,
        name: locale.name,
        localizedName: getLocalizedLanguageName(
          locale.code,
          locale.name,
          currentLocale || "en-US"
        ),
        languageSubtag: getLanguageSubtag(locale.code),
      }))
    return [DEFAULT_OPTION, ...localeOptions]
  }, [locales, currentLocale])

  useEffect(() => {
    if (currentLocale) {
      const option = options.find(
        (o) => o.code.toLowerCase() === currentLocale.toLowerCase()
      )
      setCurrent(option ?? DEFAULT_OPTION)
    } else {
      setCurrent(DEFAULT_OPTION)
    }
  }, [options, currentLocale])

  const handleChange = (option: LanguageOption) => {
    startTransition(async () => {
      await updateLocale(option.code)
      close()
      router.refresh()
      // Notify client components to re-read the locale cookie
      document.dispatchEvent(new CustomEvent("localechange"))
    })
  }

  return (
    <div>
      <Listbox
        as="span"
        onChange={handleChange}
        defaultValue={
          currentLocale
            ? options.find(
                (o) => o.code.toLowerCase() === currentLocale.toLowerCase()
              ) ?? DEFAULT_OPTION
            : DEFAULT_OPTION
        }
        disabled={isPending}
      >
        <ListboxButton className={["py-1 w-full", buttonClassName].filter(Boolean).join(" ")}>
          <div className="txt-compact-small flex items-start gap-x-2">
            {label !== null ? <span>{label}</span> : null}
            {current && (
              <span className="txt-compact-small flex items-center gap-x-2">
                {isPending ? "..." : current.localizedName}
              </span>
            )}
          </div>
        </ListboxButton>
        <div className={["relative w-full", dropdownWrapperClassName].filter(Boolean).join(" ")}>
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute bottom-full top-auto xsmall:top-[calc(100%-36px)] xsmall:bottom-auto left-0 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-canvas drop-shadow-md text-small-regular uppercase text-ink no-scrollbar rounded-md w-full min-w-[320px]"
              static
            >
              {options.map((o) => (
                <ListboxOption
                  key={o.code || "default"}
                  value={o}
                  className="py-2 hover:bg-surface-card px-3 cursor-pointer flex items-center gap-x-2"
                >
                  {o.localizedName}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default LanguageSelect
