import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { retrieveStore } from "@lib/data/store"
import { ShoppingCart, User } from 'lucide-react';

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
      <header className="relative mx-auto border-b duration-200 bg-canvas border-hairline py-4 small:py-6">
        <nav className="content-container txt-xsmall-plus text-body flex h-full w-full items-center justify-between gap-x-4 text-small-regular small:grid small:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* Left: Logo */}
          <div className="flex items-center gap-x-4 justify-self-start">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3"
              data-testid="nav-store-link"
            >
              <img src="/logo-full.png" alt="Logo" className="w-48 object-contain" />
              {/* <h1 className="font-display text-ink text-3xl leading-none">{storeName}</h1> */}
            </LocalizedClientLink>
          </div>

          {/* Center: Nav Links */}
          <div className="hidden h-full items-center justify-self-center small:flex">
            <div className="flex items-center gap-x-8 whitespace-nowrap">
              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/"
                data-testid="nav-home-link"
              >
                Home
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/store"
                data-testid="nav-store-link-center"
              >
                Store
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/about"
                data-testid="nav-about-link"
              >
                About
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-primary text-sm text-ink uppercase"
                href="/contact"
                data-testid="nav-contact-link"
              >
                Contact
              </LocalizedClientLink>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex h-full items-center justify-self-end gap-x-1 small:gap-x-0">
            <div className="hidden small:flex items-center gap-x-4">
              {/* Account Icon */}
              <LocalizedClientLink
                className="flex  items-center justify-center rounded-full text-ink"
                href="/account"
                data-testid="nav-account-link"
                aria-label="Account"
              >
                <User />
              </LocalizedClientLink>

              {/* Cart */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex  items-center justify-center rounded-full text-ink"
                    href="/cart"
                    data-testid="nav-cart-link"
                    aria-label="Shopping cart"
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
                  className="small:hidden flex h-20 w-20 items-center justify-center rounded-full text-ink"
                  href="/cart"
                  data-testid="mobile-nav-cart-link"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart />
                  <span className="sr-only">Cart (0)</span>
                </LocalizedClientLink>
              }
            >
              <div className="small:hidden">
                <CartButton iconOnly />
              </div>
            </Suspense>

            {/* Mobile Hamburger */}
            <div className="small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                storeName={storeName}
              />
            </div>
          </div>
        </nav>
      </header>
    </HeaderWrapper>
  )
}
