"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import NotifyMeForm from "@modules/products/components/notify-me-form"
import { useTranslation } from "@/lib/i18n"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  customerEmail?: string
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

// Helper: check if a variant is available for purchase
const isVariantAvailable = (
  variant: HttpTypes.StoreProductVariant
) => {
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  if ((variant.inventory_quantity || 0) > 0) return true
  return false
}

export default function ProductActions({
  product,
  disabled,
  customerEmail,
}: ProductActionsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  // Announced to assistive tech after a successful add. Sighted users see the
  // cart badge and dropdown update; a screen-reader user previously got nothing
  // at all — the button just stopped spinning.
  const [addedMessage, setAddedMessage] = useState("")
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  // Ref to ensure preselection only runs once on mount, not on every
  // server re-fetch (which would override the user's manual selection).
  const preselectedRef = useRef(false)

  // Preselect the first available variant on mount (or first variant if none available)
  useEffect(() => {
    if (preselectedRef.current) return
    if (!product.variants || product.variants.length === 0) return

    const firstAvailable =
      product.variants.find(isVariantAvailable) || product.variants[0]
    const variantOptions = optionsAsKeymap(firstAvailable.options)
    setOptions(variantOptions ?? {})
    preselectedRef.current = true
  }, [product.variants])

  // Compute which option values lead only to unavailable (out-of-stock) variants
  const unavailableOptionValueIds = useMemo(() => {
    if (!product.options || !product.variants) return new Set<string>()

    const unavailable = new Set<string>()

    for (const option of product.options) {
      for (const value of option.values ?? []) {
        // Find all variants that include this option value
        const matchingVariants = product.variants.filter((v: HttpTypes.StoreProductVariant) => {
          const vOpts = optionsAsKeymap(v.options)
          return vOpts[option.id] === value.value
        })

        // Mark as unavailable only if matching variants exist but none are available
        if (
          matchingVariants.length > 0 &&
          !matchingVariants.some(isVariantAvailable)
        ) {
          unavailable.add(value.id)
        }
      }
    }

    return unavailable
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    // `router.replace` used to be called here, which triggers a full RSC
    // roundtrip — on mount (the preselect effect always sets a variant) and
    // again on every option change, each one re-rendering the whole route on
    // the server. Nothing on the server consumes `v_id`:
    // `getImagesForVariant` takes it and ignores it. `replaceState` keeps the
    // URL shareable and the back/forward history identical without the
    // roundtrip.
    window.history.replaceState(null, "", pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // Max quantity that can be added based on inventory
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 1
    if (!selectedVariant.manage_inventory || selectedVariant.allow_backorder) {
      return Infinity
    }
    return selectedVariant.inventory_quantity || 0
  }, [selectedVariant])

  const quantityExceedsStock = quantity > maxQuantity

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // Add the selected variant to the cart.
  //
  // There is no `router.refresh()` at the end any more: `addToCart` calls
  // `refresh()` server-side, so the action's own response already carries a
  // freshly rendered tree with the server's cart totals. The client refresh
  // was a second full RSC roundtrip for the same result.
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setAddError(null)
    setAddedMessage("")
    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      })
      setQuantity(1)
      setAddedMessage(
        t("a11y.addedToCart").replace("{product}", product.title)
      )
    } catch (err) {
      // There was no catch here at all, so a rejected `addToCart` skipped
      // `setIsAdding(false)` and left the button spinning indefinitely with no
      // explanation — "loading feels broken", exactly as reported.
      //
      // The message shown is the localized one rather than `err.message`:
      // Next.js redacts server-action errors in production to an opaque
      // digest, so the underlying text is only useful in the console.
      console.error("Add to cart failed", err)
      setAddError(t("product.addToCartError"))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      unavailableValueIds={unavailableOptionValueIds}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice
          product={product}
          variant={selectedVariant}
          countryCode={countryCode}
        />

        {quantityExceedsStock && inStock && (
          <p className="text-error text-xs">
            {maxQuantity === 1
              ? t("product.onlyLeft").replace("{count}", String(maxQuantity))
              : t("product.onlyLeftPlural").replace("{count}", String(maxQuantity))}
          </p>
        )}
        {selectedVariant && !inStock ? (
          <div className="max-w-[350px]">
            <div className="flex flex-col gap-y-4" data-testid="oos-status">
              {/* `role="status"` used to sit on this heading, which overrode its
                  heading semantics — screen readers stopped announcing it as a
                  heading, and because the node only mounts when stock runs out,
                  the live region was never present to announce anything anyway.
                  The permanently-mounted region at the bottom of this component
                  does that job; this is a plain heading again. */}
              <h3 className="text-xl text-error font-medium">
                {t("product.notifyMe.outOfStock")}
              </h3>
              <p className="text-sm text-body">
                {t("product.notifyMe.description")}
              </p>
              <NotifyMeForm
                key={selectedVariant.id}
                productId={product.id}
                productTitle={product.title}
                variantId={selectedVariant.id}
                variantTitle={selectedVariant.title}
                defaultEmail={customerEmail}
                disabled={!!disabled}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-x-3">
            <div className="flex items-center border border-hairline rounded-md">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isAdding || !!disabled || !inStock || !selectedVariant}
                className="btn-icon-circular w-10 h-10 rounded-l-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("product.decreaseQuantity")}
              >
                −
              </button>
              <span className="w-10 h-10 flex items-center justify-center text-sm font-medium text-ink select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                disabled={isAdding || !!disabled || !inStock || !selectedVariant || quantity >= maxQuantity}
                className="btn-icon-circular w-10 h-10 rounded-r-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("product.increaseQuantity")}
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={
                !inStock ||
                !selectedVariant ||
                !!disabled ||
                isAdding ||
                !isValidVariant ||
                quantityExceedsStock
              }
              variant="primary"
              className="flex-1 h-10"
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              {!selectedVariant && !options
                ? t("product.selectVariant")
                : quantityExceedsStock
                ? t("product.notEnoughStock")
                : t("product.addToCart")}
            </Button>
          </div>
        )}
        {addError && (
          <p className="text-error text-xs" role="alert">
            {addError}
          </p>
        )}

        {/* Add-to-cart status, announced politely. This region is mounted for
            the life of the component and starts empty — a live region that
            appears at the same moment as its text is frequently missed, because
            the screen reader has nothing to observe a change against. Visually
            hidden: the sighted equivalent is the cart badge and the dropdown
            that opens. */}
        <p className="sr-only" role="status" aria-live="polite">
          {addedMessage}
        </p>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          addError={addError}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          unavailableValueIds={unavailableOptionValueIds}
          customerEmail={customerEmail}
          countryCode={countryCode}
        />
      </div>
    </>
  )
}
