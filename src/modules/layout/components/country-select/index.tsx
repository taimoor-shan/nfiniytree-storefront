"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState, useTransition } from "react"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"
import { useParams, usePathname } from "next/navigation"
import { chooseOnRequestCountry, updateRegion } from "@lib/data/cart"
import { goToMarket } from "@lib/context/market-context"
import { stripMarketPrefix } from "@lib/i18n/market"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@lib/i18n"
import { CountryOption, getCountryOptions } from "@lib/util/regions"
import {
  isDeliveryOnRequest,
  onRequestCountryOptions,
} from "@lib/util/delivery-on-request"

type CountrySelectProps = {
  toggleState: StateType
  regions: HttpTypes.StoreRegion[]
  /**
   * Optional label shown before the selected country name.
   * Pass `null` to hide (useful in tight UI like the top nav).
   */
  label?: string | null
  /**
   * Optional class overrides for reusing the component in different layouts.
   */
  buttonClassName?: string
  dropdownWrapperClassName?: string
  /** A country on request the visitor chose (`delivery-country`) */
  deliveryCountry?: string | null
  /** The language the page is in ("" or null is English), kept on a switch */
  currentLocale?: string | null
}

/** A country of the list; `onRequest` for one the shop takes quote requests for */
type Option = CountryOption & { onRequest?: boolean }

const CountrySelect = ({
  toggleState,
  regions,
  label = "Shipping to:",
  buttonClassName,
  dropdownWrapperClassName,
  deliveryCountry = null,
  currentLocale = null,
}: CountrySelectProps) => {
  const { t, locale } = useTranslation()
  const [, startTransition] = useTransition()

  const [current, setCurrent] = useState<Option | undefined>(undefined)

  const { countryCode } = useParams()
  const currentPath = stripMarketPrefix(usePathname())

  const { state, close, toggle } = toggleState

  const options = useMemo(() => getCountryOptions(regions), [regions])
  // Every other European country: delivered on request (a quote, no order)
  const onRequestOptions = useMemo<Option[]>(
    () =>
      onRequestCountryOptions(regions, locale).map((o) => ({
        country: o.value,
        region: "",
        label: o.label,
        onRequest: true,
      })),
    [regions, locale]
  )
  const onRequestCountry = isDeliveryOnRequest(deliveryCountry, regions)
    ? deliveryCountry
    : null

  useEffect(() => {
    // A country on request chosen is where the visitor wants delivery,
    // whatever euro market they browse meanwhile
    const chosen = onRequestCountry
      ? onRequestOptions.find((o) => o.country === onRequestCountry)
      : undefined
    if (chosen) {
      setCurrent({
        ...chosen,
        label: t("topbar.onRequestCountry").replace("{country}", chosen.label),
      })
    } else if (countryCode) {
      setCurrent(options?.find((o) => o?.country === countryCode))
    }
  }, [options, onRequestOptions, onRequestCountry, countryCode, t])

  const handleChange = (option: Option) => {
    close()
    if (option.onRequest) {
      // Remembered on the server, which moves the visitor to a euro market if
      // needed; the page then opens there in the same language
      startTransition(async () => {
        const market = await chooseOnRequestCountry(
          option.country,
          countryCode as string
        )
        goToMarket(market, currentLocale ?? "")
      })
      return
    }
    // Also clears a country on request chosen before (`switchRegion`)
    updateRegion(option.country, currentPath)
  }

  return (
    <div>
      <Listbox
        as="span"
        onChange={handleChange}
        defaultValue={
          countryCode
            ? options?.find((o) => o?.country === countryCode)
            : undefined
        }
      >
        {/* The dropdown's visibility is driven by `toggleState` (the options
            list is `static`), and its only trigger used to be a `mouseenter`
            on the wrapping div — so there was no keyboard path to it at all.
            Toggling here makes the button itself the control. */}
        <ListboxButton
          onClick={toggle}
          aria-expanded={state}
          // Same problem `LanguageSelect` documents: `NavCountrySelect` passes
          // `label={null}`, so in the top nav this button's whole accessible
          // name was just the country name — "Hungary, button" — which does not
          // say it opens a shipping-country chooser. The visible label, where
          // shown, stays as-is.
          aria-label={t("a11y.selectCountry")}
          className={[
            "py-1 w-full rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            buttonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="txt-compact-small flex items-start gap-x-2">
            {label !== null ? <span>{t("misc.shippingTo", label)}</span> : null}
            {current && (
              <span className="txt-compact-small flex items-center gap-x-2">
                {}
                {/* Decorative — `current.label` names the country right after
                    it. `react-country-flag` emits an <img> with no alt of its
                    own, so without this it was an unlabelled image. */}
                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                  }}
                  countryCode={current.country ?? ""}
                  alt=""
                  aria-hidden="true"
                />
                {current.label}
              </span>
            )}
          </div>
        </ListboxButton>
        <div
          className={[
            "relative w-full",
            dropdownWrapperClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
          <ListboxOptions
  className="absolute bottom-full top-auto xsmall:top-[calc(100%-36px)] xsmall:bottom-auto left-0 xsmall:left-auto xsmall:right-0 z-[900] max-h-[442px] w-full min-w-[320px] overflow-y-scroll rounded-md bg-canvas text-small-regular uppercase text-ink drop-shadow-md no-scrollbar"
  static
>
              {options?.map((o, index) => {
                return (
                  <ListboxOption
                    key={index}
                    value={o}
                    className="py-2 hover:bg-surface-card px-3 cursor-pointer flex items-center gap-x-2"
                  >
                    {}
                    <ReactCountryFlag
                      svg
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                      countryCode={o?.country ?? ""}
                      alt=""
                      aria-hidden="true"
                    />{" "}
                    {o?.label}
                  </ListboxOption>
                )
              })}
              {onRequestOptions.length > 0 && (
                <div
                  role="presentation"
                  className="px-3 pt-3 pb-1 text-xs tracking-wide text-muted border-t border-hairline"
                >
                  {t("checkout.deliveryOnRequest")}
                </div>
              )}
              {onRequestOptions.map((o) => (
                <ListboxOption
                  key={o.country}
                  value={o}
                  className="py-2 hover:bg-surface-card px-3 cursor-pointer flex items-center gap-x-2"
                >
                  <ReactCountryFlag
                    svg
                    style={{
                      width: "16px",
                      height: "16px",
                    }}
                    countryCode={o.country}
                    alt=""
                    aria-hidden="true"
                  />{" "}
                  {o.label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default CountrySelect
