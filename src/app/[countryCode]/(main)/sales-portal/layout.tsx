import { NOINDEX_METADATA } from "@lib/util/seo"
import { Metadata } from "next"

// The sales reps' commission portal is private: it applies to every route under
// /sales-portal — the sign-in view, the overview, client orders, payouts and
// the password pages. Metadata merges down the tree.
export const metadata: Metadata = NOINDEX_METADATA

export default function SalesPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The page body has no background of its own, so without this a browser in
  // dark mode paints the portal's signed-out views on a dark canvas.
  return <div className="bg-canvas">{children}</div>
}
