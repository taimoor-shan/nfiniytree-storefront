import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import ChevronDown from "@modules/common/icons/chevron-down"
import { retrieveStore } from "@lib/data/store"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await retrieveStore()
  const storeName = store?.name || "Infinytree"
  const locale = await getLocale()

  return (
    <div className="w-full bg-canvas relative small:min-h-screen">
      <div className="h-16 bg-canvas border-b ">
        <nav
          aria-label={await translate("a11y.mainNavigation", locale)}
          className="flex h-full items-center content-container justify-between"
        >
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ink flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-body hover:text-ink ">
              {await translate("checkout.backToCart", locale)}
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-body hover:text-ink">
              {await translate("checkout.back", locale)}
            </span>
          </LocalizedClientLink>
         <LocalizedClientLink
              href="/"
              className="flex items-center gap-3"
              data-testid="nav-store-link"
            >
              {/* Dimensions prevent the checkout header from shifting.
                  See nav for the 256x49 reasoning. */}
              <Image
                src="/logo-full.png"
                alt={storeName}
                width={256}
                height={49}
                loading="eager"
                className="w-48 object-contain"
              />
              {/* <h1 className="font-display text-ink text-3xl leading-none">{storeName}</h1> */}
            </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <main
        id="main-content"
        className="relative"
        data-testid="checkout-container"
      >
        {children}
      </main>
    </div>
  )
}
