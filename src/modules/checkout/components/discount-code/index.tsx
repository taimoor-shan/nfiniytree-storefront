"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { getCartCountryCode } from "@lib/util/country-locale"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import { useTranslation } from "@/lib/i18n"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  // Promotion keeps its own currency_code; the formatting locale follows
  // the cart's commercial country.
  const cc = getCartCountryCode(cart)

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full bg-canvas flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
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
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  {t("checkout.apply")}
                </SubmitButton>
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
