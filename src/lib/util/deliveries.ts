/**
 * Which deliveries a cart needs.
 *
 * A product belongs to a shipping profile (the shop's shipping class: pallet or
 * carton), and Medusa wants one shipping method for every profile in the cart.
 * A cart with a Bonsai and a Magnolia is therefore delivered twice, and the
 * customer pays both. The store lists every delivery option of the destination
 * whatever the cart holds, so the checkout narrows them to the profiles the cart
 * needs and asks for one choice per profile.
 *
 * This reads `items.variant.product.shipping_profile.id` and
 * `shipping_methods.shipping_option.shipping_profile_id`, which only
 * `retrieveCartForCheckout()` fetches. A cart without them falls back to a
 * single delivery over all the options, how the checkout worked before.
 */

export type DeliveryItem = {
  title?: string | null
  product_title?: string | null
  quantity?: number | null
  requires_shipping?: boolean | null
  variant?: {
    product?: {
      id?: string | null
      shipping_profile?: { id?: string | null } | null
    } | null
  } | null
}

export type DeliveryMethod = {
  shipping_option_id?: string | null
  shipping_option?: { shipping_profile_id?: string | null } | null
}

export type DeliveryOption = {
  id: string
  shipping_profile_id?: string | null
}

export type DeliveryCart = {
  items?: DeliveryItem[] | null
  shipping_methods?: DeliveryMethod[] | null
}

export type DeliveryGroup<Option extends DeliveryOption> = {
  /** Stable key for state and React: the profile id, or `all` for the fallback. */
  key: string
  /** The shipping profile, or `null` when the cart does not say. */
  profileId: string | null
  /** What travels in this delivery. */
  products: { title: string; quantity: number }[]
  /** What the customer can choose from for these products. */
  options: Option[]
}

const ships = (item: DeliveryItem) => item.requires_shipping !== false

const profileOfItem = (item: DeliveryItem): string | null =>
  item.variant?.product?.shipping_profile?.id || null

const profileOfMethod = (method: DeliveryMethod): string | null =>
  method.shipping_option?.shipping_profile_id || null

/** The shipping profiles of the products to deliver, in the order they appear. */
export function requiredProfileIds(cart: DeliveryCart): string[] {
  const ids: string[] = []

  for (const item of cart.items ?? []) {
    const id = ships(item) ? profileOfItem(item) : null
    if (id && !ids.includes(id)) {
      ids.push(id)
    }
  }

  return ids
}

function productsOf(
  items: DeliveryItem[],
  profileId: string | null
): DeliveryGroup<DeliveryOption>["products"] {
  return items
    .filter((item) => ships(item))
    .filter((item) => profileId === null || profileOfItem(item) === profileId)
    .map((item) => ({
      title: item.product_title || item.title || "",
      quantity: Number(item.quantity) || 0,
    }))
}

/**
 * One group per shipping profile in the cart, each with the options that
 * deliver it. A group can have no options (a destination the shop does not
 * deliver such products to); the checkout says so instead of hiding it.
 */
export function groupDeliveries<Option extends DeliveryOption>(
  cart: DeliveryCart,
  options: Option[]
): DeliveryGroup<Option>[] {
  const items = cart.items ?? []
  const profileIds = requiredProfileIds(cart)

  if (!profileIds.length) {
    return [
      {
        key: "all",
        profileId: null,
        products: productsOf(items, null),
        options,
      },
    ]
  }

  return profileIds.map((profileId) => ({
    key: profileId,
    profileId,
    products: productsOf(items, profileId),
    options: options.filter((option) => option.shipping_profile_id === profileId),
  }))
}

/** The shipping method the cart already has for a group, if any. */
export function methodForGroup<
  Method extends DeliveryMethod,
  Option extends DeliveryOption,
>(methods: Method[] | null | undefined, group: DeliveryGroup<Option>) {
  const all = methods ?? []

  if (group.profileId === null) {
    return all.at(-1)
  }

  return all.find(
    (method) =>
      profileOfMethod(method) === group.profileId ||
      group.options.some((option) => option.id === method.shipping_option_id)
  )
}

/** The profiles in the cart that have no shipping method yet. */
export function missingProfileIds(cart: DeliveryCart): string[] {
  const methods = cart.shipping_methods ?? []

  return requiredProfileIds(cart).filter(
    (id) => !methods.some((method) => profileOfMethod(method) === id)
  )
}

/** Every delivery the cart needs has been chosen. */
export function deliveryComplete(cart: DeliveryCart): boolean {
  return (
    (cart.shipping_methods?.length ?? 0) > 0 &&
    missingProfileIds(cart).length === 0
  )
}
