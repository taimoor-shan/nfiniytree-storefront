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
            className="line-through text-muted"
            data-testid="original-price"
          >
            {price.original_price}
          </Text>
        )}
        <Text
          className={clx("text-primary text-lg md:text-xl", {
            "text-primary": isDiscounted,
          })}
          data-testid="price"
        >
          {price.calculated_price}
        </Text>
      </div>
      {netPriceLabel && (
        <Text className="text-xs text-muted-foreground mt-0.5">
          {netPriceLabel}
        </Text>
      )}
    </div>
  )
}
