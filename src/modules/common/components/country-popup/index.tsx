"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import ReactCountryFlag from "react-country-flag"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"

import { updateRegion } from "@lib/data/cart"
import { updateLocale } from "@lib/data/locale-actions"
import { Locale } from "@lib/data/locales"
import { getLocalizedLanguageName } from "@lib/util/locale-name"
import useToggleState from "@lib/hooks/use-toggle-state"
import { useTranslation } from "@lib/i18n"
import { CountryOption, getCountryOptions } from "@lib/util/regions"
import ChevronDown from "@modules/common/icons/chevron-down"
import Modal from "@modules/common/components/modal"

const COUNTRY_POPUP_COOKIE = "country-popup-dismissed"
const SELECTED_COUNTRY_COOKIE = "selected-country"
const ONE_YEAR = 60 * 60 * 24 * 365

type CountryPopupProps = {
  regions: HttpTypes.StoreRegion[]
  locales?: Locale[] | null
  currentLocale?: string | null
}

const CountryPopup = ({
  regions,
  locales,
  currentLocale,
}: CountryPopupProps) => {
  const { t } = useTranslation()
  const { countryCode } = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentPath = pathname.split(`/${countryCode}`)[1] ?? ""

  const toggleState = useToggleState(false)
  const [selected, setSelected] = useState<CountryOption | undefined>(undefined)
  const [selectedLocale, setSelectedLocale] = useState<string>(
    currentLocale ?? ""
  )
  const [, startLocaleTransition] = useTransition()

  const options = useMemo(() => getCountryOptions(regions), [regions])

  const localeOptions = useMemo(() => {
    if (!locales) return []
    const seen = new Set<string>()
    return locales
      .filter((l) => {
        if (seen.has(l.code)) return false
        seen.add(l.code)
        return true
      })
      .map((l) => ({
        code: l.code,
        label: getLocalizedLanguageName(
          l.code,
          l.name,
          selectedLocale || "en-US"
        ),
      }))
  }, [locales, selectedLocale])

  const currentLocaleLabel = useMemo(() => {
    if (!selectedLocale || !locales) return "English"
    const found = locales.find(
      (l) => l.code.toLowerCase() === selectedLocale.toLowerCase()
    )
    return found
      ? getLocalizedLanguageName(
          found.code,
          found.name,
          selectedLocale || "en-US"
        )
      : "English"
  }, [selectedLocale, locales])

  // Check cookies + path exclusions on mount; open popup if clear.
  useEffect(() => {
    if (typeof document === "undefined" || options.length === 0) return

    if (document.cookie.includes(`${COUNTRY_POPUP_COOKIE}=`)) return

    // Don't show on cart or account pages (check after country code prefix)
    if (
      currentPath === "/cart" ||
      currentPath.startsWith("/cart/") ||
      currentPath === "/account" ||
      currentPath.startsWith("/account/")
    )
      return

    const initial =
      options.find((o) => o.country === countryCode) ?? options[0]
    if (initial) setSelected(initial)

    toggleState.open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Nothing to show
  if (!options.length) return null

  const handleDismiss = () => {
    document.cookie = `${COUNTRY_POPUP_COOKIE}=true;path=/;max-age=${ONE_YEAR};SameSite=Lax`
    toggleState.close()
  }

  const handleContinue = () => {
    const chosen = selected?.country ?? (countryCode as string)
    const localeChanged =
      (selectedLocale ?? "") !== (currentLocale ?? "")

    // Persist both cookies before any redirect
    document.cookie = `${COUNTRY_POPUP_COOKIE}=true;path=/;max-age=${ONE_YEAR};SameSite=Lax`
    if (chosen) {
      document.cookie = `${SELECTED_COUNTRY_COOKIE}=${chosen};path=/;max-age=${ONE_YEAR};SameSite=Lax`
    }

    toggleState.close()

    // If the user picked a different locale, update it
    if (localeChanged) {
      startLocaleTransition(async () => {
        await updateLocale(selectedLocale ?? "")
        router.refresh()
        document.dispatchEvent(new CustomEvent("localechange"))
      })
    }

    // If the user picked a different country, switch region
    if (chosen && chosen !== countryCode) {
      updateRegion(chosen, currentPath)
    }
  }

  return (
    <Modal isOpen={toggleState.state} close={handleDismiss} size="small">
      {/* Flag — centered above the title */}
      <div className="flex justify-center -mt-2 mb-4">
        {selected?.country && (
          <ReactCountryFlag
            svg
            countryCode={selected.country}
            style={{ width: "48px", height: "48px" }}
            // `react-country-flag` renders an <img> and sets no alt of its own,
            // so each flag arrived as an unlabelled image (Lighthouse
            // `image-alt`). Decorative here: the country name is rendered as
            // text beside or below every flag in this dialog, so an alt would
            // only make a screen reader say the country twice.
            alt=""
            aria-hidden="true"
          />
        )}
      </div>

      <Modal.Title>
        {t("countryPopup.title", "Choose your shipping country")}
      </Modal.Title>

      <p className="text-sm text-body max-w-xs text-start mt-4 mb-6">
        {t(
          "countryPopup.explanation",
          "Prices, taxes, available products and shipping options depend on your selected country."
        )}
      </p>

      {/* Country + Language dropdowns — side-by-side on small screens and up */}
      <div className="flex flex-col small:flex-row gap-3">
        <Listbox
          as="div"
          value={selected}
          onChange={setSelected}
          className="relative flex-1"
        >
          <ListboxButton className="w-full flex items-center justify-between rounded-md border border-hairline bg-white px-4 py-3 text-left text-sm cursor-pointer">
            <span className="flex items-center gap-x-2">
              {selected?.country && (
                <ReactCountryFlag
                  svg
                  countryCode={selected.country}
                  style={{ width: "16px", height: "16px" }}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <span className="text-ink">{selected?.label ?? ""}</span>
            </span>
            <ChevronDown size="16" />
          </ListboxButton>

          <ListboxOptions className="absolute z-[80] mt-1 max-h-48 w-full overflow-y-scroll rounded-md bg-white shadow-lg border border-hairline no-scrollbar">
            {options.map((option, idx) => (
              <ListboxOption
                key={idx}
                value={option}
                className="cursor-pointer select-none px-4 py-2.5 hover:bg-surface-card data-[focus]:bg-surface-card flex items-center gap-x-2 text-sm"
              >
                <ReactCountryFlag
                  svg
                  countryCode={option.country ?? ""}
                  style={{ width: "16px", height: "16px" }}
                  alt=""
                  aria-hidden="true"
                />
                {option.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>

        {locales && locales.length > 0 && (
          <Listbox
            as="div"
            value={selectedLocale}
            onChange={setSelectedLocale}
            className="relative flex-1"
          >
            <ListboxButton
              aria-label={t("a11y.selectLanguage")}
              className="w-full flex items-center justify-between rounded-md border border-hairline bg-white px-4 py-3 text-left text-sm cursor-pointer"
            >
              <span className="flex items-center gap-x-2 text-ink">
                <span className="leading-tight">{currentLocaleLabel}</span>
              </span>
              <ChevronDown size="16" />
            </ListboxButton>

            <ListboxOptions className="absolute z-[80] mt-1 max-h-48 w-full overflow-y-scroll rounded-md bg-white shadow-lg border border-hairline no-scrollbar">
              <ListboxOption
                value=""
                className="cursor-pointer select-none px-4 py-2.5 hover:bg-surface-card data-[focus]:bg-surface-card text-sm"
              >
                English
              </ListboxOption>
              {localeOptions.map((opt) => (
                <ListboxOption
                  key={opt.code}
                  value={opt.code}
                  className="cursor-pointer select-none px-4 py-2.5 hover:bg-surface-card data-[focus]:bg-surface-card text-sm"
                >
                  {opt.label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        )}
      </div>

      {/* Continue CTA — primary button, full-width */}
      <button
        onClick={handleContinue}
        // `bg-primary-strong`: the label is 14px white text, and white on the
        // brand `primary` is 3.28:1 — under the 4.5:1 AA floor. `primary-active`
        // is now defined in tailwind.config.js; previously this hover class
        // referenced an undefined token and compiled to nothing, so the button
        // had no hover state at all.
        className="mt-6 w-full h-10 rounded-md bg-primary-strong text-white text-sm font-medium px-5 py-3 leading-none hover:bg-primary-active transition-colors flex items-center justify-center"
      >
        {t("countryPopup.continue", "Continue")}
      </button>

      {/* Nav hint */}
      <p className="text-xs text-muted text-center mt-4">
        {t(
          "countryPopup.navHint",
          "You can change your country and language anytime from the menu."
        )}
      </p>
    </Modal>
  )
}

export default CountryPopup
