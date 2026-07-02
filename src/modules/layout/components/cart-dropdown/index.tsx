"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { ShoppingCart, X } from "lucide-react"
import { Button } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type Props = {
  cart?: HttpTypes.StoreCart | null
  iconOnly?: boolean
}

const CartDropdown = ({
  cart: cartState,
  iconOnly = false,
}: Props) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasMountedRef = useRef(false)
  const previousCountRef = useRef(0)
  const pathname = usePathname()

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0

  // Click outside & Escape to close
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }

    document.addEventListener("click", handleClickOutside, true)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("click", handleClickOutside, true)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, close])

  // Auto-open when a new item is added (ignores first hydration)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      previousCountRef.current = totalItems
      return
    }

    const prev = previousCountRef.current

    if (totalItems > prev && !pathname.includes("/cart")) {
      setOpen(true)
    }

    previousCountRef.current = totalItems
  }, [totalItems, pathname])

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={
          totalItems > 0
            ? `Shopping cart with ${totalItems} items`
            : "Shopping cart"
        }
        className={
          iconOnly
            ? "flex items-center justify-center rounded-full text-ink cursor-pointer"
            : "hover:text-ink cursor-pointer"
        }
      >
        {iconOnly ? (
          <>
            <ShoppingCart />
            <span className="sr-only">{`Cart (${totalItems})`}</span>
          </>
        ) : (
          `Cart (${totalItems})`
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 top-full z-50 mt-2 w-[420px] bg-canvas border border-hairline shadow-lg text-ink origin-top-right transition-all duration-200 ${
          open
            ? "opacity-100 visible translate-y-0 scale-100"
            : "opacity-0 invisible -translate-y-1 scale-95 pointer-events-none"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-hairline-soft">
          <h3 className="text-large-semi">Cart</h3>
          <button
            type="button"
            onClick={close}
            className="btn-icon-circular"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cartState?.items?.length ? (
          <>
            <div className="overflow-y-auto max-h-[402px] px-4 py-4 grid grid-cols-1 gap-y-8 no-scrollbar">
              {cartState.items
                .sort((a, b) =>
                  (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                )
                .map((item) => (
                  <div
                    key={item.id}
                    data-testid="cart-item"
                    className="grid grid-cols-[100px_1fr] gap-x-4"
                  >
                    <LocalizedClientLink
                      href={`/products/${item.product_handle}`}
                      className="w-24"
                      onClick={close}
                    >
                      <Thumbnail
                        thumbnail={item.variant?.thumbnail || item.thumbnail}
                        images={item.variant?.images || item.variant?.product?.images}
                        size="square"
                      />
                    </LocalizedClientLink>

                    <div className="flex flex-col justify-between flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base-regular truncate">
                            <LocalizedClientLink
                              href={`/products/${item.product_handle}`}
                              data-testid="product-link"
                              onClick={close}
                            >
                              {item.title}
                            </LocalizedClientLink>
                          </h3>
                          <LineItemOptions
                            variant={item.variant}
                            data-testid="cart-item-variant"
                            data-value={item.variant}
                          />
                          <span
                            className="text-small-regular"
                            data-testid="cart-item-quantity"
                            data-value={item.quantity}
                          >
                            Quantity: {item.quantity}
                          </span>
                        </div>
                        <div className="flex justify-end shrink-0">
                          <LineItemPrice
                            item={item}
                            style="tight"
                            currencyCode={cartState.currency_code}
                          />
                        </div>
                      </div>
                      <DeleteButton
                        id={item.id}
                        className="mt-2 w-fit"
                        data-testid="cart-item-remove-button"
                      >
                        Remove
                      </DeleteButton>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-hairline-soft flex flex-col gap-y-4 text-small-regular">
              <div className="flex items-center justify-between">
                <span className="text-ink font-semibold">
                  Subtotal <span className="font-normal">(excl. taxes)</span>
                </span>
                <span
                  className="text-large-semi"
                  data-testid="cart-subtotal"
                  data-value={subtotal}
                >
                  {convertToLocale({
                    amount: subtotal,
                    currency_code: cartState.currency_code,
                  })}
                </span>
              </div>
              <LocalizedClientLink href="/cart" passHref onClick={close}>
                <Button className="w-full primary" size="large" data-testid="go-to-cart-button">
                  Go to cart
                </Button>
              </LocalizedClientLink>
            </div>
          </>
        ) : (
          <div className="flex py-16 flex-col gap-y-4 items-center justify-center px-4">
            <div className="bg-surface-dark text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-on-dark">
              <span>0</span>
            </div>
            <span>Your shopping bag is empty.</span>
            <LocalizedClientLink href="/store" onClick={close}>
              <Button>Explore products</Button>
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartDropdown
