"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import ReactCountryFlag from "react-country-flag"
import { useEffect, useMemo, useState } from "react"
import { useParams, usePathname } from "next/navigation"

import { updateRegion } from "@lib/data/cart"
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
}

const CountryPopup = ({ regions }: CountryPopupProps) => {
  const { t } = useTranslation()
  const { countryCode } = useParams()
  const pathname = usePathname()
  const currentPath = pathname.split(`/${countryCode}`)[1] ?? ""

  const toggleState = useToggleState(false)
  const [selected, setSelected] = useState<CountryOption | undefined>(undefined)

  const options = useMemo(() => getCountryOptions(regions), [regions])

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

    // Persist both cookies before any redirect
    document.cookie = `${COUNTRY_POPUP_COOKIE}=true;path=/;max-age=${ONE_YEAR};SameSite=Lax`
    if (chosen) {
      document.cookie = `${SELECTED_COUNTRY_COOKIE}=${chosen};path=/;max-age=${ONE_YEAR};SameSite=Lax`
    }

    toggleState.close()

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

      {/* Country dropdown — Headless UI Listbox, matching nav CountrySelect pattern */}
      <Listbox value={selected} onChange={setSelected}>
        <ListboxButton className="w-full flex items-center justify-between rounded-md border border-hairline bg-white px-4 py-3 text-left text-sm cursor-pointer">
          <span className="flex items-center gap-x-2">
            {selected?.country && (
              <ReactCountryFlag
                svg
                countryCode={selected.country}
                style={{ width: "16px", height: "16px" }}
              />
            )}
            <span className="text-ink">{selected?.label ?? ""}</span>
          </span>
          <ChevronDown size="16" />
        </ListboxButton>

        <div className="relative w-full">
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
                />
                {option.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>

      {/* Continue CTA — primary button, full-width */}
      <button
        onClick={handleContinue}
        className="mt-6 w-full h-10 rounded-md bg-primary text-white text-sm font-medium px-5 py-3 leading-none hover:bg-primary-active transition-colors flex items-center justify-center"
      >
        {t("countryPopup.continue", "Continue")}
      </button>

      {/* Nav hint */}
      <p className="text-xs text-muted text-center mt-4">
        {t(
          "countryPopup.navHint",
          "You can change your country anytime from the menu."
        )}
      </p>
    </Modal>
  )
}

export default CountryPopup
