import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({
  price,
  netPriceLabel,
}: {
  price: VariantPrice
  netPriceLabel?: string
}) {
  if (!price) {
    return null
  }

  const isDiscounted = price.calculated_price_number < price.original_price_number

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-x-2">
        {isDiscounted && (
          <Text
            className="original-price text-lg"
            data-testid="original-price"
          >
            {price.original_price}
          </Text>
        )}
        </div>
        <div className="flex items-center gap-2">
        <Text
          className={clx("text-primary-text text-lg", {
            "text-primary-text": isDiscounted,
          })}
          data-testid="price"
        >
          {price.calculated_price}
        </Text>
        {netPriceLabel && (
          <Text className="text-xs text-muted-foreground mt-0.5">
            {netPriceLabel}
          </Text>
        )}
      </div>
    </div>
  )
}
