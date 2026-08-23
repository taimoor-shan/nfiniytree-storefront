import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "@lib/i18n/client"

const DeleteButton = ({
  id,
  children,
  className,
  /** Product title, used to build a unique accessible name per row. */
  itemLabel,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  itemLabel?: string
}) => {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    // `router.refresh()` used to follow this await. `deleteLineItem` calls
    // `refresh()` server-side, so the action response already carries the
    // re-rendered tree — the extra client refresh was a second full RSC
    // roundtrip for the same result.
    await deleteLineItem(id).finally(() => {
      setIsDeleting(false)
    })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className={clx(
          "btn-text-link gap-x-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
          // Callers render this icon-only, and Medusa's `Trash` glyph is 20x20 —
          // under the 24x24 minimum in WCAG 2.2 target size (2.5.8), which is
          // worst on touch where this sits next to the quantity select. A
          // min size only applies to the icon-only case; when `children` is
          // present the label already makes the button comfortably large.
          { "min-w-6 min-h-6 justify-center": !children }
        )}
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        // Callers render this icon-only (no children), which left the button
        // with an empty accessible name. Always carry a text name.
        aria-label={
          itemLabel
            ? t("a11y.removeFromCart").replace("{product}", itemLabel)
            : t("cart.remove")
        }
      >
        {/* Decorative: the button's `aria-label` already names the action, so
            an announced graphic here would only repeat it. */}
        {isDeleting ? (
          <Spinner className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash aria-hidden="true" />
        )}
        {children ? <span>{children}</span> : null}
      </button>
    </div>
  )
}

export default DeleteButton
