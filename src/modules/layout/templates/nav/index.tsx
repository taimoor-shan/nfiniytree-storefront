import { Suspense } from "react"
import Image from "next/image"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { retrieveStore } from "@lib/data/store"
import { getDictionary } from "@lib/i18n/dictionaries"
import { ShoppingCart, User } from "lucide-react"

import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderWrapper from "@modules/layout/components/header-wrapper"
import TopBar from "@modules/layout/components/top-bar"

export default async function Nav() {
  const [regions, locales, currentLocale, store] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    retrieveStore(),
  ])
  const storeName = store?.name || "Infinytree"
  const dict = await getDictionary(currentLocale)

  return (
    <HeaderWrapper
      topBar={
        <TopBar
          locales={locales}
          currentLocale={currentLocale}
          regions={regions as any}
        />
      }
    >
      <header className="relative mx-auto border-b duration-200 bg-canvas border-hairline py-4 small:py-5">
        <nav className="content-container txt-xsmall-plus grid h-full w-full grid-cols-[auto_1fr_auto] items-center text-small-regular small:flex small:items-center small:justify-between">
          {/* Mobile: Hamburger */}
          <div className="small:hidden justify-self-start">
            <SideMenu
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
              storeName={storeName}
            />
          </div>

          {/* Logo */}
          <div className="flex items-center justify-self-center small:justify-self-start">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3"
              data-testid="nav-store-link"
            >
              <Image
                src="/logo-full.png"
                alt={dict["common.logo"]}
                width={256}
                height={49}
                loading="eager"
                className="w-48 object-contain"
              />
            </LocalizedClientLink>
          </div>

          {/* Center: Desktop Nav */}
          <div className="hidden h-full items-center justify-self-center small:flex">
            <div className="flex items-center gap-x-8 whitespace-nowrap">
              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/"
                data-testid="nav-home-link"
              >
                {dict["nav.home"]}
              </LocalizedClientLink>

              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/store"
                data-testid="nav-store-link-center"
              >
                {dict["nav.store"]}
              </LocalizedClientLink>

              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/about"
                data-testid="nav-about-link"
              >
                {dict["nav.about"]}
              </LocalizedClientLink>

              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/contact"
                data-testid="nav-contact-link"
              >
                {dict["nav.contact"]}
              </LocalizedClientLink>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex h-full items-center justify-self-end">
            {/* Desktop Actions */}
            <div className="hidden small:flex items-center gap-x-4">
              <LocalizedClientLink
                className="flex items-center justify-center rounded-full text-ink"
                href="/account"
                data-testid="nav-account-link"
                aria-label={dict["nav.account"]}
              >
                <User />
              </LocalizedClientLink>

              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex items-center justify-center rounded-full text-ink"
                    href="/cart"
                    data-testid="nav-cart-link"
                    aria-label={dict["nav.cart"]}
                  >
                    <ShoppingCart />
                  </LocalizedClientLink>
                }
              >
                <CartButton iconOnly />
              </Suspense>
            </div>

            {/* Mobile Cart */}
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="small:hidden flex h-10 w-10 items-center justify-center rounded-full text-ink"
                  href="/cart"
                  data-testid="mobile-nav-cart-link"
                  aria-label={dict["nav.cart"]}
                >
                  <ShoppingCart />
                  <span className="sr-only">{dict["nav.cart"]} (0)</span>
                </LocalizedClientLink>
              }
            >
              <div className="small:hidden">
                <CartButton iconOnly />
              </div>
            </Suspense>
          </div>
        </nav>
      </header>
    </HeaderWrapper>
  )
}
