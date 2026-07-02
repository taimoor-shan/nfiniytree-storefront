import { HttpTypes } from "@medusajs/types"

type ProductInfoBlocksProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfoBlocks = ({ product }: ProductInfoBlocksProps) => {
  const metadata = (product.metadata as Record<string, any>) || {}

  const keyFeaturesRaw = metadata?.key_features
  let parsedKeyFeatures: string[] = []

  if (Array.isArray(keyFeaturesRaw)) {
    parsedKeyFeatures = keyFeaturesRaw
  } else if (typeof keyFeaturesRaw === "string") {
    try {
      const wrapped = keyFeaturesRaw.trim().startsWith("[")
        ? keyFeaturesRaw
        : `[${keyFeaturesRaw}]`
      const parsed = JSON.parse(wrapped)
      if (Array.isArray(parsed)) {
        parsedKeyFeatures = parsed
      }
    } catch (e) {
      parsedKeyFeatures = keyFeaturesRaw
        .split(/\n|,(?=\s*")/)
        .map((s) => s.replace(/^"|"$/g, "").trim())
        .filter((s) => s.length > 0)
    }
  }

  const care = metadata?.care_instructions as string | undefined

  const potRaw = metadata?.pot
  let parsedPot: Record<string, any> | undefined = undefined
  if (typeof potRaw === "object" && potRaw !== null && !Array.isArray(potRaw)) {
    parsedPot = potRaw
  } else if (typeof potRaw === "string") {
    try {
      const parsed = JSON.parse(potRaw)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        parsedPot = parsed
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  // Build tree specs
  const treeSpecs: Record<string, string> = {}
  if (product.height) treeSpecs["Height"] = `${product.height}`
  if (product.width) treeSpecs["Width"] = `${product.width}`
  if (product.length) treeSpecs["Depth"] = `${product.length}`
  if (product.weight) treeSpecs["Weight"] = `${product.weight} g`
  if (product.material) treeSpecs["Material"] = product.material
  if (product.origin_country)
    treeSpecs["Country of origin"] = product.origin_country

  // Build pot specs
  const potSpecs: Record<string, string> = {}
  if (parsedPot) {
    const unit = parsedPot.unit || "cm"
    if (parsedPot.width && parsedPot.depth) {
      potSpecs["Size"] = `${parsedPot.width} ${unit} × ${parsedPot.depth} ${unit}`
    } else {
      if (parsedPot.width) potSpecs["Width"] = `${parsedPot.width} ${unit}`
      if (parsedPot.depth) potSpecs["Depth"] = `${parsedPot.depth} ${unit}`
    }
    if (parsedPot.height)
      potSpecs["Height"] = `${parsedPot.height} ${unit}`
    if (parsedPot.material) potSpecs["Material"] = parsedPot.material
    if (parsedPot.finish) potSpecs["Finish"] = parsedPot.finish
    if (parsedPot.care) potSpecs["Care"] = parsedPot.care
  }

  const hasKeyFeatures = parsedKeyFeatures.length > 0
  const hasCare = Boolean(care)
  const hasTreeSpecs = Object.keys(treeSpecs).length > 0
  const hasPotSpecs = Object.keys(potSpecs).length > 0

  return (
    <div className="flex flex-col small:flex-row gap-x-12 gap-y-8">
      {/* Key Features */}
      {hasKeyFeatures && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            Key Features
          </h3>
          <ul className="list-disc pl-4 flex flex-col gap-y-2 marker:text-primary text-sm text-body">
            {parsedKeyFeatures.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Specifications */}
      {(hasTreeSpecs || hasPotSpecs) && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            Specifications
          </h3>
          {hasTreeSpecs && (
            <div>
              {hasPotSpecs && (
                <span className="font-semibold text-ink text-sm block mb-2">
                  Tree (including pot)
                </span>
              )}
              <div className="flex flex-col gap-y-2 text-sm">
                {Object.entries(treeSpecs).map(([key, value], i) => (
                  <div key={i} className="flex gap-x-2">
                    <span className="font-semibold text-ink">
                      {key}:
                    </span>
                    <span className="text-body">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasPotSpecs && (
            <div className={hasTreeSpecs ? "mt-4 pt-4 border-t border-hairline" : ""}>
              <span className="font-semibold text-ink text-sm block mb-2">
                {parsedPot?.size ? `Pot Only (${parsedPot.size})` : "Pot Only"}
              </span>
              <div className="flex flex-col gap-y-2 text-sm">
                {Object.entries(potSpecs).map(([key, value], i) => (
                  <div key={i} className="flex gap-x-2">
                    <span className="font-semibold text-ink">
                      {key}:
                    </span>
                    <span className="text-body">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maintenance & Care */}
      {hasCare && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            Maintenance &amp; Care
          </h3>
          <p className="text-sm text-body leading-loose">{care}</p>
        </div>
      )}
    </div>
  )
}

export default ProductInfoBlocks
