import { redirect } from "next/navigation"

// The commission plugin links reps to <portal URL>/login. The sign-in form
// lives on the portal's own page, which shows it whenever nobody is signed in.
export default async function SalesPortalLoginPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  redirect(`/${countryCode}/sales-portal`)
}
