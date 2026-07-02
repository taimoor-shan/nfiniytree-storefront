import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isDiscounted = price.calculated_price_number < price.original_price_number

  return (
    <>
      {isDiscounted && (
        <Text
          className="line-through text-muted "
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-primary text-base", {
          "text-primary": isDiscounted,
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </>
  )
}
