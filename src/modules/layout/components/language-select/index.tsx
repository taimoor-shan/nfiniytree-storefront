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
  countryCode: string
}

const getCountryCodeFromLocale = (localeCode: string): string => {
  try {
    const locale = new Intl.Locale(localeCode)
    if (locale.region) {
      return locale.region.toUpperCase()
    }
    const maximized = locale.maximize()
    return maximized.region?.toUpperCase() ?? localeCode.toUpperCase()
  } catch {
    const parts = localeCode.split(/[-_]/)
    return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase()
  }
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

const getCountryName = (
  localeCode: string,
  fallbackName: string,
  displayLocale: string = "en-US"
): string => {
  try {
    const region = getCountryCodeFromLocale(localeCode)
    const displayNames = new Intl.DisplayNames([displayLocale], {
      type: "region",
    })
    return displayNames.of(region) ?? fallbackName
  } catch {
    return fallbackName
  }
}

const DEFAULT_OPTION: LanguageOption = {
  code: "",
  name: "English",
  localizedName: "English",
  countryCode: "",
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
        localizedName: getCountryName(
          locale.code,
          locale.name,
          currentLocale ?? "en-US"
        ),
        countryCode: getCountryCodeFromLocale(locale.code),
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
