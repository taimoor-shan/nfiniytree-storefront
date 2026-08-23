import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getLocale } from "@lib/data/locale-actions"
import { getDictionary } from "@lib/i18n/dictionaries"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = async ({ product }: ProductInfoProps) => {
  const locale = (await getLocale()) || "en"
  const dict = await getDictionary(locale)
  return (
    <div id="product-info">
      <div className="">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-muted hover:text-body"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
      
        {/* The product name is the page's single H1. It used to render as an h2
            while the PDP emitted an empty h1 elsewhere, so crawlers saw a
            product page with no headline. Classes are unchanged, so the visual
            treatment is byte-identical. */}
        <Heading
          level="h1"
          className="text-3xl leading-10 text-ink font-display mb-2"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
          {product.categories && product.categories.length > 0 && (
            <LocalizedClientLink
              href={`/categories/${product.categories[0].handle}`}
              className="text-md tracking-wide text-primary-text uppercase mb-6 block hover:text-body"
              data-testid="product-subtitle"
            >
              {product.categories[0].name}
            </LocalizedClientLink>
          )}
        
        <Text
          className="text-body text-base whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
{/* 
        {(product.metadata as Record<string, any>)?.uniqueness_note && (
          <Text className="text-small-regular text-muted italic mt-4">
            {(product.metadata as Record<string, any>).uniqueness_note}
          </Text>
        )} */}

        {product.tags && product.tags.length > 0 && (
          <div className="mt-6">
            <Text className="text-small-regular text-muted mb-2">
              {dict["product.idealFor"]}
            </Text>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-3 py-1 rounded-full border border-hairline text-body"
                >
                  {tag.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
