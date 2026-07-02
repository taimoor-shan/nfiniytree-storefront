import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
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
      
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ink font-display font-thin"
          data-testid="product-title"
        >
          {product.title}
         
        </Heading>
          <Heading
          level="h3"
          className="text-md tracking-wide text-primary uppercase mb-6"
          data-testid="product-subtitle"
        >

          {product.subtitle}

          </Heading> 
        
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
              Ideal for
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
