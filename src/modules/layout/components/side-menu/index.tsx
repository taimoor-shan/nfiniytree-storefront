"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, BarsThree, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment, useMemo } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import { useTranslation } from "@lib/i18n/client"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  storeName?: string
  triggerClassName?: string
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  storeName = "Infinytree",
  triggerClassName,
}: SideMenuProps) => {
  const { t } = useTranslation()
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  const SideMenuItems = useMemo(() => ({
    [t("nav.home")]: "/",
    [t("nav.store")]: "/store",
    [t("nav.account")]: "/account",
    [t("nav.cart")]: "/cart",
  }), [t])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className={clx(
                    "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ease-out hover:text-ink focus:outline-none",
                    triggerClassName
                  )}
                  aria-label={t("nav.menu")}
                >
                  <BarsThree />
                  <span className="sr-only">{t("nav.menu")}</span>
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[9998] bg-surface-dark/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              {open && (
                <style>{`
                  body {
                    overflow: hidden;
                  }
                `}</style>
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <PopoverPanel className="flex flex-col absolute w-full sm:w-1/3 2xl:w-1/4 sm:min-w-min h-screen z-[9999] top-0 left-0 text-sm text-on-primary backdrop-blur-2xl overflow-hidden">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-surface-dark/50 justify-between p-6"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-6 items-start justify-start">
                      {Object.entries(SideMenuItems).map(([name, href]) => {
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="text-3xl leading-10 hover:text-muted-soft"
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="flex flex-col gap-y-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      {!!regions?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={countryToggleState.open}
                          onMouseLeave={countryToggleState.close}
                        >
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              countryToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <Text className="flex justify-between txt-compact-small">
                        {t("footer.allRightsReserved")
                          .replace("{year}", String(new Date().getFullYear()))
                          .replace("{storeName}", storeName)}
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
