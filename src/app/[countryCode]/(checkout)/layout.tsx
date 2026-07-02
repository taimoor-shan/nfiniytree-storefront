import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import { retrieveStore } from "@lib/data/store"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await retrieveStore()
  const storeName = store?.name || "Infinytree"

  return (
    <div className="w-full bg-canvas relative small:min-h-screen">
      <div className="h-16 bg-canvas border-b ">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ink flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-body hover:text-ink ">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-body hover:text-ink">
              Back
            </span>
          </LocalizedClientLink>
         <LocalizedClientLink
              href="/"
              className="flex items-center gap-3"
              data-testid="nav-store-link"
            >
              <img src="/logo-full.png" alt="Logo" className="w-48 object-contain" />
              {/* <h1 className="font-display text-ink text-3xl leading-none">{storeName}</h1> */}
            </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
