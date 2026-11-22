import { HttpTypes } from "@medusajs/types"
import { CalendarClock, MessagesSquare, Truck } from "lucide-react"
import { getDeliveryEstimate } from "@lib/data/delivery-estimate"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { getCountryName } from "@lib/util/country-name"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ENGLISH_COUNTRY: Record<string, string> = {
  at: "Austria",
  de: "Germany",
  hu: "Hungary",
}

/**
 * Next to the price: that the piece is made to order, how long delivery to
 * the market's country takes, what delivery costs there before the postcode
 * is known, and a consultation button for project buyers. Delivery used to be
 * only a link to the shipping terms.
 *
 * The delivery time is a dictionary text per country
 * (`product.deliveryTime.<country>`), so it is changed without code; a country
 * with none leaves the line out.
 */
export default async function ProductDeliveryInfo({
  product,
  region,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const locale = (await getLocale()) || "en"
  const country = countryCode.toLowerCase()
  const t = (key: string) => translate(key, locale)

  const [estimate, madeToOrder, deliveryTemplate, deliveryTime, consultation, hint] =
    await Promise.all([
      getDeliveryEstimate({
        productId: product.id!,
        countryCode: country,
        currencyCode: region.currency_code,
      }),
      t("product.madeToOrder"),
      t("product.deliveryTime"),
      t(`product.deliveryTime.${country}`),
      t("product.consultation"),
      t("product.consultationHint"),
    ])

  const countryName = getCountryName(country, locale, ENGLISH_COUNTRY[country] ?? country.toUpperCase())
  // `translate` hands back the key itself when a text is missing.
  const hasDeliveryTime = deliveryTime && deliveryTime !== `product.deliveryTime.${country}`

  let shippingLine: string | null = null
  if (estimate) {
    const format = (amount: number) =>
      convertToLocale({ amount, currency_code: estimate.currency_code, countryCode })
    const price =
      estimate.min === estimate.max
        ? format(estimate.min)
        : (await t("product.shippingFromRange")).replace("{price}", format(estimate.min))
    shippingLine = `${(await t("product.shippingFrom"))
      .replace("{country}", countryName)
      .replace("{price}", price)} (${await t("product.shippingExactAtCheckout")})`
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-card p-4 text-sm text-body"
      data-testid="product-delivery-info"
    >
      <p className="flex items-start gap-2">
        <CalendarClock className="h-5 w-5 shrink-0 text-ink" aria-hidden />
        <span>
          <strong className="font-semibold text-ink">{madeToOrder}</strong>
          {hasDeliveryTime && (
            <>
              {" · "}
              {deliveryTemplate.replace("{country}", countryName).replace("{time}", deliveryTime)}
            </>
          )}
        </span>
      </p>
      {shippingLine && (
        <p className="flex items-start gap-2" data-testid="product-shipping-estimate">
          <Truck className="h-5 w-5 shrink-0 text-ink" aria-hidden />
          <span>
            {shippingLine}{" "}
            <LocalizedClientLink href="/policies/shipping" className="underline underline-offset-2">
              {await t("product.shippingPolicyLink")}
            </LocalizedClientLink>
          </span>
        </p>
      )}
      <div className="flex items-start gap-2 border-t border-hairline pt-3">
        <MessagesSquare className="h-5 w-5 shrink-0 text-ink" aria-hidden />
        <div className="flex flex-col gap-2">
          <span>{hint}</span>
          <LocalizedClientLink
            href="/contact"
            className="btn-secondary self-start"
            data-testid="product-consultation-button"
          >
            {consultation}
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
