import { getMarketPrefix } from "@lib/data/market"
import { redirect } from "next/navigation"

// The commission plugin links reps to <portal URL>/login. The sign-in form
// lives on the portal's own page, which shows it whenever nobody is signed in.
export default async function SalesPortalLoginPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const prefix = await getMarketPrefix(countryCode)

  redirect(`/${prefix}/sales-portal`)
}
