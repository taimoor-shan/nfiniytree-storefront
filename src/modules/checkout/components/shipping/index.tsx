"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import {
  deliveryComplete,
  groupDeliveries,
  methodForGroup,
  type DeliveryGroup,
} from "@lib/util/deliveries"
import { convertToLocale } from "@lib/util/money"
import { getCartCountryCode } from "@lib/util/country-locale"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { useTranslation } from "@/lib/i18n"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// The store returns where the option delivers from along with it; the SDK's
// type does not list it.
type ShippingOption = HttpTypes.StoreCartShippingOption & {
  service_zone?: {
    fulfillment_set?: {
      type?: string
      location?: { address?: HttpTypes.StoreCartAddress }
    }
  }
}

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: ShippingOption[] | null
}

function formatAddress(address?: HttpTypes.StoreCartAddress | null) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const isPickup = (option: ShippingOption) =>
  option.service_zone?.fulfillment_set?.type === "pickup"

/**
 * The delivery step. A product belongs to a shipping class (pallet or carton),
 * and the cart needs one delivery for each class it holds: a Bonsai and a
 * Magnolia are delivered, and paid for, separately. So the options are grouped
 * by class, narrowed to the classes in the cart, and the customer picks one in
 * each group. A class with a single option has it chosen for them.
 */
const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  // What was just picked, per group, until the cart comes back with it.
  const [choice, setChoice] = useState<Record<string, string>>({})

  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Shipping options are priced by Medusa per the cart's shipping country.
  const cc = getCartCountryCode(cart)

  const isOpen = searchParams.get("step") === "delivery"

  const groups = groupDeliveries(cart, availableShippingMethods ?? [])
  const complete = deliveryComplete(cart)

  const selectedFor = (group: DeliveryGroup<ShippingOption>) =>
    choice[group.key] ??
    methodForGroup(cart.shipping_methods, group)?.shipping_option_id ??
    null

  // Only what the customer can pick is priced, and again whenever something
  // the price depends on changes: the products, the postcode, the currency.
  const calculatedIds = Array.from(
    new Set(
      groups.flatMap((group) =>
        group.options
          .filter((option) => option.price_type === "calculated")
          .map((option) => option.id)
      )
    )
  )
  const priceKey = [
    cart.id,
    cart.currency_code,
    cart.shipping_address?.country_code,
    cart.shipping_address?.postal_code,
    ...(cart.items ?? []).map((item) => `${item.id}:${item.quantity}`),
    ...calculatedIds,
  ].join("|")

  useEffect(() => {
    if (!calculatedIds.length) {
      setIsLoadingPrices(false)
      return
    }

    let current = true
    setIsLoadingPrices(true)

    Promise.allSettled(
      calculatedIds.map((id) => calculatePriceForShippingOption(id, cart.id))
    ).then((results) => {
      if (!current) {
        return
      }

      const pricesMap: Record<string, number> = {}
      results.forEach((result) => {
        if (result.status !== "fulfilled") {
          return
        }
        const id = result.value?.id
        const amount = result.value?.amount
        if (id && typeof amount === "number") {
          pricesMap[id] = amount
        }
      })

      setCalculatedPricesMap(pricesMap)
      setIsLoadingPrices(false)
    })

    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceKey])

  // The cart is the truth again once it has come back.
  useEffect(() => {
    setChoice({})
  }, [cart.shipping_methods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  /** Sets the deliveries one after the other: Medusa keeps one cart lock. */
  const chooseDeliveries = async (
    picks: { group: DeliveryGroup<ShippingOption>; optionId: string }[]
  ) => {
    setError(null)
    setIsLoading(true)
    setChoice((previous) => ({
      ...previous,
      ...Object.fromEntries(picks.map((p) => [p.group.key, p.optionId])),
    }))

    try {
      for (const pick of picks) {
        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: pick.optionId,
        })
      }
      router.refresh()
    } catch (err) {
      setChoice((previous) => {
        const next = { ...previous }
        picks.forEach((p) => delete next[p.group.key])
        return next
      })
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // A group with a single way to deliver it and nothing chosen yet has it
  // chosen for the customer (a first visit, a country change that cleared the
  // method, a product added from another class). Only once its price is known:
  // a delivery that cannot be priced is explained below, not attempted.
  const priced = (option: ShippingOption) =>
    option.price_type !== "calculated" ||
    typeof calculatedPricesMap[option.id] === "number"

  const autoPicks = groups
    .filter(
      (group) =>
        group.options.length === 1 &&
        !methodForGroup(cart.shipping_methods, group) &&
        priced(group.options[0])
    )
    .map((group) => ({ group, optionId: group.options[0].id }))
  const autoKey = autoPicks.map((pick) => pick.optionId).join(",")

  const attempted = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!isOpen) {
      attempted.current.clear()
      return
    }

    const todo = autoPicks.filter((pick) => !attempted.current.has(pick.optionId))
    if (!todo.length) {
      return
    }

    todo.forEach((pick) => attempted.current.add(pick.optionId))
    void chooseDeliveries(todo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoKey])

  const priceOf = (option: ShippingOption) => {
    const amount =
      option.price_type === "flat" ? option.amount : calculatedPricesMap[option.id]

    if (typeof amount === "number") {
      return convertToLocale({
        amount,
        currency_code: cart?.currency_code,
        countryCode: cc,
      })
    }

    return isLoadingPrices ? <Loader /> : "-"
  }

  const isDisabled = (option: ShippingOption) =>
    (option.price_type === "calculated" &&
      !isLoadingPrices &&
      typeof calculatedPricesMap[option.id] !== "number") ||
    (isPickup(option) && !!option.insufficient_inventory)

  const hasDeliveries = (cart.shipping_methods?.length ?? 0) > 0

  return (
    <div className="bg-canvas">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !hasDeliveries,
            }
          )}
        >
          {t("checkout.delivery")}
          {!isOpen && complete && <CheckCircleSolid />}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-link"
                aria-label={`${t("account.edit")} — ${t("checkout.delivery")}`}
                data-testid="edit-delivery-button"
              >
                {t("account.edit")}
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ink">
                {t("checkout.shippingMethod")}
              </span>
              <span className="mb-4 text-muted txt-medium">
                {t("checkout.howDelivery")}
              </span>
              {groups.length > 1 && (
                <span
                  className="mb-4 text-muted txt-medium"
                  data-testid="deliveries-intro"
                >
                  {t("checkout.deliveriesIntro").replace(
                    "{count}",
                    String(groups.length)
                  )}
                </span>
              )}
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {groups.map((group) => {
                  const unavailable =
                    !isLoadingPrices &&
                    !group.options.some((option) => !isDisabled(option))

                  return (
                    <div
                      key={group.key}
                      className="mb-6 last:mb-0"
                      data-testid="delivery-group"
                    >
                      {groups.length > 1 && (
                        <Text
                          className="txt-medium-plus text-ink mb-2"
                          data-testid="delivery-group-products"
                        >
                          {group.products
                            .map((p) => `${p.title} × ${p.quantity}`)
                            .join(", ")}
                        </Text>
                      )}
                      <RadioGroup
                        value={selectedFor(group)}
                        onChange={(optionId) => {
                          if (optionId) {
                            void chooseDeliveries([{ group, optionId }])
                          }
                        }}
                      >
                        {group.options.map((option) => {
                          const disabled = isDisabled(option)
                          const selected = option.id === selectedFor(group)

                          return (
                            <Radio
                              key={option.id}
                              value={option.id}
                              data-testid="delivery-option-radio"
                              disabled={disabled}
                              className={clx(
                                "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-md px-8 mb-2 hover:shadow-borders-interactive-with-active",
                                "radio-option-focus",
                                {
                                  "border-primary": selected,
                                  "hover:shadow-brders-none cursor-not-allowed":
                                    disabled,
                                }
                              )}
                            >
                              <div className="flex items-start gap-x-4">
                                <MedusaRadio checked={selected} />
                                <div className="flex flex-col">
                                  <span className="text-base-regular">
                                    {option.name}
                                  </span>
                                  {isPickup(option) && (
                                    <span className="text-base-regular text-muted">
                                      {formatAddress(
                                        option.service_zone?.fulfillment_set
                                          ?.location?.address
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="justify-self-end text-ink">
                                {priceOf(option)}
                              </span>
                            </Radio>
                          )
                        })}
                      </RadioGroup>
                      {unavailable && (
                        <Text
                          className="txt-medium text-muted"
                          data-testid="delivery-unavailable"
                        >
                          {t("checkout.noDeliveryOption")}
                        </Text>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!complete}
              data-testid="submit-delivery-option-button"
            >
              {t("checkout.continueToPayment")}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {hasDeliveries && (
              <div className="flex flex-col">
                <Text className="txt-medium-plus text-ink mb-1">
                  {t("checkout.method")}
                </Text>
                {cart.shipping_methods!.map((method) => (
                  <Text
                    key={method.id}
                    className="txt-medium text-body"
                    data-testid="delivery-summary-method"
                  >
                    {method.name}{" "}
                    {convertToLocale({
                      amount: method.amount!,
                      currency_code: cart?.currency_code,
                      countryCode: cc,
                    })}
                  </Text>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
