import { salesRepSignout } from "@lib/data/sales-portal-actions"
import { PortalT } from "../lib/translator"

const SignOutButton = ({
  countryCode,
  t,
}: {
  countryCode: string
  t: PortalT
}) => (
  <form action={salesRepSignout.bind(null, countryCode)}>
    <button
      type="submit"
      className="text-small-regular text-link hover:underline"
      data-testid="sales-portal-signout"
    >
      {t("account.signOut")}
    </button>
  </form>
)

export default SignOutButton
