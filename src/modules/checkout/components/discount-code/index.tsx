"use client"

import { Badge, Button, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { getCartCountryCode } from "@lib/util/country-locale"
import { HttpTypes } from "@medusajs/types"
import { guardRepaint } from "@modules/common/components/repaint-guard"
import Trash from "@modules/common/icons/trash"
import { useTranslation } from "@/lib/i18n"
import ErrorMessage from "../error-message"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isApplying, setIsApplying] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  // Promotion keeps its own currency_code; the formatting locale follows
  // the cart's commercial country.
  const cc = getCartCountryCode(cart)

  const { promotions = [] } = cart

  // Applying and removing both call the Server Action from an event handler,
  // with a pending flag of their own, the way the cart's delete button does.
  // The Apply button shows that flag, and a refused code stays in the field so
  // a typo can be mended.
  const apply = async (codes: string[]): Promise<boolean> => {
    setIsApplying(true)
    try {
      const result = await applyPromotions(codes)
      if (!result.ok) {
        setErrorMessage(result.error)
      }
      return result.ok
    } catch {
      // The action ANSWERS a code the shop turns down, in the visitor's
      // language, instead of throwing it (a production build hides what a
      // thrown error says). What lands here failed outright: a dropped
      // connection, a page from before a deploy.
      setErrorMessage(t("account.errorOccurred"))
      return false
    } finally {
      setIsApplying(false)
      // The totals and the list of applied codes come back with the action
      guardRepaint()
    }
  }

  const removePromotionCode = async (code: string) => {
    setErrorMessage("")

    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await apply(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isApplying) {
      return
    }
    setErrorMessage("")

    const input = event.currentTarget.elements.namedItem(
      "code"
    ) as HTMLInputElement | null
    // A code pasted from an email often carries a space or a line break at its
    // end, and Medusa matches the code exactly.
    const code = input?.value.trim()
    if (!code) {
      return
    }
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code)

    // A refused code stays in the field, so a typo can be mended
    if ((await apply(codes)) && input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full bg-canvas flex flex-col">
      <div className="txt-medium">
        <form onSubmit={addPromotionCode} className="w-full mb-5">
          {/* This used to be a <Label> wrapping the toggle button, which is
              invalid and left the code field with no accessible name at all.
              The toggle is now a plain disclosure button and the field carries
              its own <Label htmlFor>. */}
          <div className="flex gap-x-1 my-2 items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-link"
              aria-expanded={isOpen}
              aria-controls="promotion-fields"
              data-testid="add-discount-button"
            >
              {t("checkout.addPromotion")}
            </button>
          </div>

          {isOpen && (
            <div id="promotion-fields">
              <Label htmlFor="promotion-input" className="sr-only">
                {t("checkout.addPromotion")}
              </Label>
              <div className="flex w-full gap-x-2">
                <Input
                  className="size-full"
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={
                    errorMessage ? "promotion-input-error" : undefined
                  }
                  data-testid="discount-input"
                />
                <Button
                  size="large"
                  type="submit"
                  variant="secondary"
                  isLoading={isApplying}
                  data-testid="discount-apply-button"
                >
                  {t("checkout.apply")}
                </Button>
              </div>

              <ErrorMessage
                id="promotion-input-error"
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </div>
          )}
        </form>

        {promotions.length > 0 && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2">
                {t("checkout.promotionsApplied")}
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1">
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                    countryCode: cc,
                                  })}
                            </>
                          )}
                        )
                        {/* {promotion.is_automatic && (
                          <Tooltip content="This promotion is automatically applied">
                            <InformationCircleSolid className="inline text-muted" />
                          </Tooltip>
                        )} */}
                      </span>
                    </Text>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        {/* Every row renders the same icon, so the name has to
                            carry the code or the buttons are indistinguishable
                            when several promotions are applied. */}
                        <span className="sr-only">
                          {t("checkout.removeDiscount")}
                          {promotion.code ? ` — ${promotion.code}` : ""}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
