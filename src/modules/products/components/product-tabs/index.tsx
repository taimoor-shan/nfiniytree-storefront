import { HttpTypes } from "@medusajs/types"
import { ArrowLeftRight, ArrowUpDown, Move3d } from "lucide-react"
import { isSimpleProduct } from "@lib/util/product"
import WithdrawalNotice from "@modules/common/components/withdrawal-notice"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const metadata = (product.metadata as Record<string, any>) || {}

  const keyFeaturesRaw = metadata?.key_features
  let parsedKeyFeatures: string[] = []

  if (Array.isArray(keyFeaturesRaw)) {
    parsedKeyFeatures = keyFeaturesRaw
  } else if (typeof keyFeaturesRaw === "string") {
    try {
      const wrapped = keyFeaturesRaw.trim().startsWith("[")
        ? keyFeaturesRaw
        : `[${keyFeaturesRaw}]`;
      const parsed = JSON.parse(wrapped);
      if (Array.isArray(parsed)) {
        parsedKeyFeatures = parsed;
      }
    } catch (e) {
      parsedKeyFeatures = keyFeaturesRaw
        .split(/\n|,(?=\s*")/)
        .map((s) => s.replace(/^"|"$/g, "").trim())
        .filter((s) => s.length > 0)
    }
  }

  const care = metadata?.care_instructions as string | undefined
  const packagingInfo = metadata?.packaging_info as string | undefined

  const potRaw = metadata?.pot
  let parsedPot: Record<string, any> | undefined = undefined
  if (typeof potRaw === "object" && potRaw !== null && !Array.isArray(potRaw)) {
    parsedPot = potRaw
  } else if (typeof potRaw === "string") {
    try {
      const parsed = JSON.parse(potRaw)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        parsedPot = parsed
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  const sections: { label: string; component: React.ReactNode }[] = []

  sections.push({
    label: "Specifications",
    component: (
      <SpecificationsTab
        product={product}
        pot={parsedPot}
        isConfigured={!isSimpleProduct(product)}
      />
    ),
  })

  if (parsedKeyFeatures.length > 0) {
    sections.push({
      label: "Key Features",
      component: <KeyFeaturesTab features={parsedKeyFeatures} />,
    })
  }

  if (care) {
    sections.push({
      label: "Maintenance & Care",
      component: <CareTab instructions={care} />,
    })
  }

  if (sections.length === 0) return null

  return (
    <div className="w-full divide-y divide-ui-border-base border-y border-hairline">
      {sections.map((section, i) => (
        <div key={i}>
          <h2 className="pt-4 text-2xl font-medium text-ink">
            {section.label}
          </h2>
          {section.component}
        </div>
      ))}
    </div>
  )
}

const KeyFeaturesTab = ({ features }: { features: string[] }) => {
  return (
    <div className="text-sm py-4">
      <ul className="list-disc pl-4 flex flex-col gap-y-2 marker:text-primary">
        {features.map((feature, i) => (
          <li key={i} className="text-body text-base">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

const CareTab = ({ instructions }: { instructions: string }) => {
  return (
    <div className=" py-4">
      <p className="text-base leading-loose">{instructions}</p>
    </div>
  )
}



type SpecificationsTabProps = {
  product: HttpTypes.StoreProduct
  pot?: Record<string, any>
  isConfigured?: boolean
}

const dimensionIcons: Record<string, React.ReactNode> = {
  Height: <ArrowUpDown className="h-8 w-8" />,
  Width: <ArrowLeftRight className="h-8 w-8" />,
  Depth: <Move3d className="h-8 w-8" />,
}

const SpecificationsTab = ({ product, pot, isConfigured }: SpecificationsTabProps) => {
  // Build tree specs from native Medusa fields
  const treeSpecs: Record<string, string> = {}

  if (product.height) {
    treeSpecs["Height"] = `${product.height}`
  }
  if (product.width) {
    treeSpecs["Width"] = `${product.width}`
  }
  if (product.length) {
    treeSpecs["Depth"] = `${product.length}`
  }

  if (product.weight) {
    treeSpecs["Weight"] = `${product.weight} g`
  }
  if (product.material) {
    treeSpecs["Material"] = product.material
  }
  if (product.origin_country) {
    treeSpecs["Country of origin"] = product.origin_country
  }

  // Build pot specs from metadata.pot
  const potSpecs: Record<string, string> = {}
  if (pot) {
    const unit = pot.unit || "cm"
    
    // Combine width and depth into Size if both exist
    if (pot.width && pot.depth) {
      potSpecs["Size"] = `${pot.width} ${unit} × ${pot.depth} ${unit}`
    } else {
      if (pot.width) potSpecs["Width"] = `${pot.width} ${unit}`
      if (pot.depth) potSpecs["Depth"] = `${pot.depth} ${unit}`
    }

    if (pot.height) {
      potSpecs["Height"] = `${pot.height} ${unit}`
    }
    if (pot.material) {
      potSpecs["Material"] = pot.material
    }
    if (pot.finish) {
      potSpecs["Finish"] = pot.finish
    }
    if (pot.care) {
      potSpecs["Care"] = pot.care
    }
  }

  const hasTreeSpecs = Object.keys(treeSpecs).length > 0
  const hasPotSpecs = Object.keys(potSpecs).length > 0

  return (
    <div className="text-base py-4">
      {/* Tree specifications */}
      {hasTreeSpecs && (
        <div>
          {hasPotSpecs && (
            <span className="font-semibold text-primary text-base mb-4 block">
              Tree (including pot)
            </span>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            {Object.entries(treeSpecs).map(([key, value], i) => (
              <div key={i} className="flex gap-x-2 items-center">
                 {dimensionIcons[key]}
                  <div key={i} className="flex flex-col gap-y-1">
                <span className="font-semibold text-ink flex items-center gap-x-1.5">
                 
                  {key}
                </span>
                
                <p className="text-body">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pot specifications */}
      {hasPotSpecs && (
        <div className={hasTreeSpecs ? "mt-8 pt-8 border-t border-hairline" : ""}>
          <span className="font-semibold text-primary text-base mb-4 block">
            {pot.size ? `Pot Only (${pot.size})` : "Pot Only"}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            {Object.entries(potSpecs).map(([key, value], i) => (
              <div key={i} className="flex flex-col gap-y-1">
                <span className="font-semibold text-ink">{key}</span>
                <p className="text-body text-base">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasTreeSpecs && !hasPotSpecs && (
        <p className="text-muted">No specifications available.</p>
      )}

      {/* {isConfigured && <WithdrawalNotice variant="inline" />} */}
    </div>
  )
}

export default ProductTabs
