"use client"

import { Popover, PopoverPanel, Portal, Transition } from "@headlessui/react"
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

  const SideMenuItems = useMemo(
    () => ({
      [t("nav.home")]: "/",
      [t("nav.store")]: "/store",
      [t("nav.account")]: "/account",
      [t("nav.cart")]: "/cart",
    }),
    [t]
  )

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
                  <BarsThree className="size-6" />
                  <span className="sr-only">{t("nav.menu")}</span>
                </Popover.Button>
              </div>

              {open && (
                <style>{`
                  body {
                    overflow: hidden;
                  }
                `}</style>
              )}

              {/* Portalled to <body>. HeaderWrapper wraps this component in a
                  `sticky z-50 will-change-transform` div carrying an inline
                  `transform: translateY(...)`, and each of those three
                  independently opens a stacking context. Rendered inline, the
                  panel's z-[9999] would only order it *within* the header,
                  which paints as a single layer at z-50 — losing to the
                  product page's sticky bar (z-50, later in DOM order) and its
                  options dialog (z-[75]). The transform also hijacks the
                  containing block for `fixed`, which is why the backdrop below
                  is `fixed inset-0` yet only covered the header's box. Escaping
                  to the body restores both the root stacking context and the
                  viewport as the containing block. */}
              <Portal>
                {open && (
                  <div
                    className="fixed inset-0 z-[9998] bg-surface-dark/0 pointer-events-auto"
                    onClick={close}
                    // Purely a mouse convenience: Headless UI's Popover already
                    // closes on Escape and on outside clicks, and the panel has
                    // a real close button. Marked presentational so it is not
                    // announced as an interactive element.
                    aria-hidden="true"
                    data-testid="side-menu-backdrop"
                  />
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
                  {/* `fixed`, not `absolute`: outside the header there is no
                      positioned ancestor left, so `absolute` would anchor to
                      the document and scroll away with the page. */}
                  <PopoverPanel className="flex flex-col fixed w-full sm:w-1/3 2xl:w-1/4 sm:min-w-min h-screen z-[9999] top-0 left-0 text-sm text-on-primary backdrop-blur-2xl overflow-hidden">
                    {/* `/70`, not `/50`. The panel is portalled to <body> and
                        overlays arbitrary page content, so at 50% opacity the
                        effective background — and therefore the contrast of the
                        white `text-on-primary` label above — depended on
                        whatever happened to be behind it. Measured white-on-
                        panel: 3.41:1 over a white product photo, 3.55:1 over the
                        cream canvas. That clears the 3:1 large-text bar for the
                        30px nav links but fails the 4.5:1 AA floor for this
                        panel's `text-sm` base, the country/language selects and
                        the copyright line. `backdrop-blur-2xl` does not help —
                        a blur averages neighbouring pixels, so it preserves
                        luminance rather than lowering it. At /70 the worst case
                        (over pure white) is 6.62:1, so legibility no longer
                        depends on page content, and the panel is still visibly
                        translucent and frosted. */}
                    <div
                      data-testid="nav-menu-popup"
                      className="flex flex-col h-full bg-surface-dark/70 justify-between p-6"
                    >
                      <div className="flex justify-end" id="xmark">
                        {/* Was icon-only with no accessible name. */}
                        <button
                          type="button"
                          data-testid="close-menu-button"
                          onClick={close}
                          aria-label={t("a11y.closeMenu")}
                          className="rounded-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <XMark className="size-8" />
                        </button>
                      </div>
                      <ul className="flex flex-col gap-6 items-start justify-start">
                        {Object.entries(SideMenuItems).map(([name, href]) => {
                          return (
                            <li key={name}>
                              <LocalizedClientLink
                                href={href}
                                className="text-3xl leading-10 hover:text-muted-soft rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                          <div className="flex justify-between">
                            <LanguageSelect
                              toggleState={languageToggleState}
                              locales={locales}
                              currentLocale={currentLocale}
                            />
                            <ArrowRightMini
                              aria-hidden="true"
                              className={clx(
                                "transition-transform duration-150",
                                languageToggleState.state ? "-rotate-90" : ""
                              )}
                            />
                          </div>
                        )}
                        {!!regions?.length && (
                          <div className="flex justify-between">
                            <CountrySelect
                              toggleState={countryToggleState}
                              regions={regions}
                            />
                            <ArrowRightMini
                              aria-hidden="true"
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
              </Portal>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
