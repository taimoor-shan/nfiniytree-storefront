import { getMarketPrefix } from "@lib/data/market"
import { MarketPrefixProvider } from "@lib/context/market-context"

/**
 * Hands the URL's market prefix (`en-hu`) to client components, so their
 * links stay in the language the page is shown in. See `src/lib/i18n/market.ts`.
 */
export default async function MarketLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const prefix = await getMarketPrefix(countryCode)

  return <MarketPrefixProvider prefix={prefix}>{props.children}</MarketPrefixProvider>
}
