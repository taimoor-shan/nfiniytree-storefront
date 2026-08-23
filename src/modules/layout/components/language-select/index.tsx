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
import { useTranslation } from "@/lib/i18n"
import {
  getLanguageSubtag,
  getLocalizedLanguageName,
} from "@lib/util/locale-name"

type LanguageOption = {
  code: string
  name: string
  localizedName: string
  languageSubtag: string
}

type LanguageSelectProps = {
  toggleState: StateType
  locales: Locale[]
  currentLocale: string | null
  /**
   * Optional label shown before the selected language name. Defaults to the
   * translated "Language" — it used to default to the hardcoded English
   * "Language:" and was rendered verbatim, so a German or Hungarian visitor saw
   * an English label in an otherwise translated menu.
   *
   * Pass `null` to hide it (useful in tight UI like the top nav); the button
   * still gets an accessible name from `aria-label`.
   */
  label?: string | null
  /**
   * Optional class overrides for reusing the component in different layouts.
   */
  buttonClassName?: string
  dropdownWrapperClassName?: string
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
  label,
  buttonClassName,
  dropdownWrapperClassName,
}: LanguageSelectProps) => {
  const { t } = useTranslation()
  const [current, setCurrent] = useState<LanguageOption | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // `undefined` means "not specified" → translated default. `null` still means
  // "no visible label".
  const visibleLabel = label === undefined ? t("common.language") : label

  const { state, close, toggle } = toggleState

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
        {/* Same as CountrySelect: visibility is owned by `toggleState` and was
            previously only reachable by hovering the wrapper, leaving keyboard
            users with no way to open the list. */}
        <ListboxButton
          onClick={toggle}
          aria-expanded={state}
          // The visible label is only "Language" — without this the button's
          // accessible name is just the label plus the current value, which does
          // not say it opens a chooser. And when `label` is null it had no name
          // beyond the language name itself.
          aria-label={t("a11y.selectLanguage")}
          className={[
            "py-1 w-full rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            buttonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="txt-compact-small flex items-start gap-x-2">
            {visibleLabel !== null ? <span>{visibleLabel}</span> : null}
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
