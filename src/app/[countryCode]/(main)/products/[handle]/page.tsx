import { getMarketPrefix } from "@lib/data/market"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { normalizeImageUrl } from "@lib/util/image-url"
import { getSeoAlternates } from "@lib/util/page-metadata"
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  _selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  // TODO: Re-enable variant-scoped images once per-variant image
  // assignments are fixed in the Medusa admin.
  return product.images ?? []
}

/**
 * Meta descriptions are truncated by search engines somewhere around 155–160
 * characters. Cutting on a word boundary — and only when the text is actually
 * too long — reads better in the SERP than a hard slice mid-word.
 */
function toMetaDescription(text: string, maxLength = 155): string {
  const collapsed = text.replace(/\s+/g, " ").trim()
  if (collapsed.length <= maxLength) return collapsed

  const cut = collapsed.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const locale = await getLocale()
  const title = `${product.title} | ${SITE_NAME}`

  // The description used to be `product.title` — identical to the title, so
  // every product page shipped a duplicate-of-the-title description and Google
  // rewrote it. Prefer the real product copy, fall back to a localized template
  // built from the product name only when there is no copy at all. The
  // subtitle comes after the description: it is a badge shared by several
  // products ("One of a kind", "Premium Line"), and leading with it gave every
  // product the same two-word description.
  const source =
    product.description?.trim() ||
    product.subtitle?.trim() ||
    (await translate("metadata.productDescription", locale)).replace(
      "{product}",
      product.title
    )

  const description = toMetaDescription(source)
  // Products often have images but no `thumbnail`; without the first image as
  // a fallback those product pages had no share image at all.
  const imageUrl = product.thumbnail || product.images?.[0]?.url
  const image = imageUrl ? normalizeImageUrl(imageUrl) : null

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, `/products/${handle}`),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${await getMarketPrefix(countryCode)}/products/${handle}`,
      // Relative `/static/...`, resolved against `metadataBase` in the root
      // layout. Keeps social crawlers on the public storefront origin instead
      // of whatever origin Medusa's file provider happens to emit.
      images: image ? [{ url: image, alt: product.title }] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || DEFAULT_OG_IMAGE.url],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params

  // `searchParams.v_id` used to be read here and handed to
  // `getImagesForVariant`, which ignores it (see the TODO in that function).
  // Reading searchParams opts the route out of static rendering, so this was a
  // dead read with a cost. `v_id` is now written client-side only, via
  // `history.replaceState`.
  const [region, pricedProduct] = await Promise.all([
    getRegion(params.countryCode),
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle: params.handle },
    }).then(({ response }) => response.products[0]),
  ])

  if (!region) {
    notFound()
  }

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
