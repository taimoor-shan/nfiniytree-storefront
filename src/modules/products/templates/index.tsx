import React, { Suspense } from "react"
import Features from "@modules/home/components/features"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductInfoBlocks from "@modules/products/components/product-info-blocks"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 gap-y-8 small:gap-x-20 relative"
        data-testid="product-container"
      >
        {/* Left Column - Image Gallery */}
        <div className="block w-full small:w-[55%] small:sticky small:top-28">
          <ImageGallery images={images} />
        </div>

        {/* Right Column - Product Details sticky wrapper */}
        <div className="flex flex-col w-full small:w-[45%] pb-8 gap-y-12">

          <ProductInfo product={product} />
          
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>

<ProductTabs product={product} />

          <ProductOnboardingCta />
        </div>
      </div>
      {/* <div className="content-container my-16 small:my-32">
        <ProductInfoBlocks product={product} />
      </div> */}
    <Features />
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
