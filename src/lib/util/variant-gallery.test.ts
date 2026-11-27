/**
 * The order of the product gallery and where a choice moves it.
 *
 * In the admin a picture is tied to the variants it shows (Product → Media →
 * the picture → variants, or a variant's own images); a picture tied to none
 * belongs to every variant. The gallery always shows every picture: each
 * variant's, the variants in the order of their options, then the shared ones.
 * Choosing a variant moves it to that variant's first picture.
 *
 * Run:  npx tsx src/lib/util/variant-gallery.test.ts
 */
import assert from "node:assert/strict"
import {
  galleryDataOf,
  focusImageFor,
  nextGalleryHeads,
  orderGalleryImages,
  type GalleryOption,
  type GalleryVariant,
  type VariantTiedImage,
} from "./variant-gallery"

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

const ids = (images: { id: string }[]) => images.map((image) => image.id)

/** A picture tied to the variants whose ids follow; tied to none: shown by all. */
const pic = (id: string, ...variantIds: string[]): VariantTiedImage => ({
  id,
  url: `https://media.example.com/${id}.jpg`,
  variants: variantIds.map((variantId) => ({ id: variantId })),
})

const variant = (
  id: string,
  choices: Record<string, string>
): GalleryVariant => ({
  id,
  options: Object.entries(choices).map(([option_id, value]) => ({
    option_id,
    value,
  })),
})

// ---------------------------------------------------------------------------
// One option: the pot of the Red Maple Tree, as the admin has it
// ---------------------------------------------------------------------------
const POT = "opt_pot"
const BLACK = variant("var_black", { [POT]: "Black" })
const GOLD = variant("var_gold", { [POT]: "Gold" })
const WHITE = variant("var_white", { [POT]: "White" })
const POTS = [BLACK, GOLD, WHITE]

const GOLD_1 = pic("gold-1", "var_gold")
const SHARED_1 = pic("shared-1")
const BLACK_1 = pic("black-1", "var_black")
const SHARED_2 = pic("shared-2")
const SHARED_3 = pic("shared-3")
const GOLD_2 = pic("gold-2", "var_gold")
// In the order the admin ranks them: own and shared pictures are mixed.
const TREE = [GOLD_1, SHARED_1, BLACK_1, SHARED_2, SHARED_3, GOLD_2]

const POT_OPTION: GalleryOption = { id: POT, values: ["Black", "Gold", "White"] }

console.log("One option: the pot")

test("every picture is shown: the variants' in option order, then the shared ones", () => {
  assert.deepEqual(ids(orderGalleryImages(TREE, POTS, [POT_OPTION])), [
    "black-1",
    "gold-1",
    "gold-2",
    "shared-1",
    "shared-2",
    "shared-3",
  ])
})

test("the option order decides, not the order of the variants", () => {
  const reversed: GalleryOption = { id: POT, values: ["White", "Gold", "Black"] }
  assert.deepEqual(ids(orderGalleryImages(TREE, [...POTS].reverse(), [reversed])), [
    "gold-1",
    "gold-2",
    "black-1",
    "shared-1",
    "shared-2",
    "shared-3",
  ])
})

test("the pictures are the product's own objects, not copies", () => {
  const ordered = orderGalleryImages(TREE, POTS, [POT_OPTION])
  assert.equal(ordered[1], GOLD_1)
})

test("a picture tied to two variants is shown once, with the first of them", () => {
  const both = pic("both", "var_gold", "var_black")
  const images = [GOLD_1, both, BLACK_1]
  assert.deepEqual(ids(orderGalleryImages(images, POTS, [POT_OPTION])), [
    "both",
    "black-1",
    "gold-1",
  ])
})

test("a product whose pictures are tied to nothing keeps the admin's order", () => {
  const plain = [pic("a"), pic("b"), pic("c")]
  assert.equal(orderGalleryImages(plain, POTS, [POT_OPTION]), plain)
})

test("pictures whose ties the API did not send count as shared", () => {
  const untied = [
    { id: "a", url: "https://media.example.com/a.jpg" },
    { id: "b", url: "https://media.example.com/b.jpg", variants: null },
  ]
  assert.equal(orderGalleryImages(untied, POTS, [POT_OPTION]), untied)
})

test("a picture tied only to a variant the product no longer has is still shown", () => {
  const images = [pic("old", "var_gone"), GOLD_1]
  assert.deepEqual(ids(orderGalleryImages(images, POTS, [POT_OPTION])), [
    "gold-1",
    "old",
  ])
})

test("choosing a pot moves to its first picture", () => {
  const ordered = orderGalleryImages(TREE, POTS, [POT_OPTION])
  assert.equal(focusImageFor(ordered, POTS, { [POT]: "Gold" })?.id, "gold-1")
  assert.equal(focusImageFor(ordered, POTS, { [POT]: "Black" })?.id, "black-1")
})

test("nothing chosen, a blank value, a pot with no pictures or one no variant has: no move", () => {
  const ordered = orderGalleryImages(TREE, POTS, [POT_OPTION])
  assert.equal(focusImageFor(ordered, POTS, {}), undefined)
  assert.equal(focusImageFor(ordered, POTS, { [POT]: "" }), undefined)
  assert.equal(focusImageFor(ordered, POTS, { [POT]: "White" }), undefined)
  assert.equal(focusImageFor(ordered, POTS, { [POT]: "Pink" }), undefined)
})

// ---------------------------------------------------------------------------
// Two options: the pod and the plant
// ---------------------------------------------------------------------------
const POD = "opt_pod"
const PLANT = "opt_plant"
const GOLD_GREEN = variant("v_gold_green", { [POD]: "Gold", [PLANT]: "Green" })
const GOLD_VAR = variant("v_gold_var", { [POD]: "Gold", [PLANT]: "Variegated" })
const BLACK_GREEN = variant("v_black_green", {
  [POD]: "Black",
  [PLANT]: "Green",
})
const BLACK_VAR = variant("v_black_var", {
  [POD]: "Black",
  [PLANT]: "Variegated",
})
const COMBOS = [BLACK_VAR, GOLD_GREEN, BLACK_GREEN, GOLD_VAR]
const POD_OPTION: GalleryOption = { id: POD, values: ["Gold", "Black"] }
const PLANT_OPTION: GalleryOption = {
  id: PLANT,
  values: ["Green", "Variegated"],
}

const PHOTOS = [
  pic("gold-pod", "v_gold_green", "v_gold_var"), // the gold pod, any plant
  pic("room"), // a shot of the whole piece in a room: shared
  pic("gold-green", "v_gold_green"), // exactly this pod and this plant
  pic("variegated", "v_gold_var", "v_black_var"), // the variegated plant, any pod
  pic("black-green", "v_black_green"),
]

console.log("\nTwo options: the pod and the plant")

test("by the first option's values, then the second's", () => {
  assert.deepEqual(
    ids(orderGalleryImages(PHOTOS, COMBOS, [POD_OPTION, PLANT_OPTION])),
    ["gold-pod", "gold-green", "variegated", "black-green", "room"]
  )
})

test("the plant first when the admin puts it first", () => {
  assert.deepEqual(
    ids(orderGalleryImages(PHOTOS, COMBOS, [PLANT_OPTION, POD_OPTION])),
    // Green: gold, black; then variegated: gold, black.
    ["gold-pod", "gold-green", "black-green", "variegated", "room"]
  )
})

test("a full or half choice moves to the first fitting picture", () => {
  const ordered = orderGalleryImages(PHOTOS, COMBOS, [POD_OPTION, PLANT_OPTION])
  assert.equal(
    focusImageFor(ordered, COMBOS, { [POD]: "Black", [PLANT]: "Green" })?.id,
    "black-green"
  )
  assert.equal(
    focusImageFor(ordered, COMBOS, { [POD]: "Black", [PLANT]: "Variegated" })?.id,
    "variegated"
  )
  assert.equal(focusImageFor(ordered, COMBOS, { [POD]: "Black" })?.id, "variegated")
  assert.equal(focusImageFor(ordered, COMBOS, { [PLANT]: "Green" })?.id, "gold-pod")
})

// ---------------------------------------------------------------------------
// Which pictures to fetch ahead: the one each next click would move to
// ---------------------------------------------------------------------------
console.log("\nPictures to fetch ahead")

const ORDERED_TREE = orderGalleryImages(TREE, POTS, [POT_OPTION])

test("from nothing chosen: where each pot would move, bar the picture on show", () => {
  // On show now: black-1, the first picture.
  assert.deepEqual(ids(nextGalleryHeads(ORDERED_TREE, POTS, [POT_OPTION], {})), [
    "gold-1",
  ])
})

test("with a pot chosen: the other pots' first pictures", () => {
  assert.deepEqual(
    ids(nextGalleryHeads(ORDERED_TREE, POTS, [POT_OPTION], { [POT]: "Gold" })),
    ["black-1"]
  )
})

test("two options: one click on either option, a picture at a time", () => {
  const ordered = orderGalleryImages(PHOTOS, COMBOS, [POD_OPTION, PLANT_OPTION])
  // Gold + Green is on gold-pod. Black pod moves to black-green; the variegated
  // plant moves to gold-pod again, which is already on show.
  assert.deepEqual(
    ids(
      nextGalleryHeads(ordered, COMBOS, [POD_OPTION, PLANT_OPTION], {
        [POD]: "Gold",
        [PLANT]: "Green",
      })
    ),
    ["black-green"]
  )
})

test("it stops at the limit", () => {
  const ordered = orderGalleryImages(PHOTOS, COMBOS, [POD_OPTION, PLANT_OPTION])
  assert.equal(
    nextGalleryHeads(ordered, COMBOS, [POD_OPTION, PLANT_OPTION], {}, 1).length,
    1
  )
})

test("a product without ties has nothing to fetch ahead", () => {
  const plain = [pic("a"), pic("b")]
  assert.deepEqual(nextGalleryHeads(plain, POTS, [POT_OPTION], {}), [])
})

test("a picture without an address is never moved to or fetched", () => {
  const images: VariantTiedImage[] = [
    { id: "gold-1", url: "https://media.example.com/gold-1.jpg", variants: [{ id: "var_gold" }] },
    { id: "black-nourl", url: null, variants: [{ id: "var_black" }] },
    { id: "shared-1", url: "https://media.example.com/shared-1.jpg", variants: [] },
  ]
  assert.equal(focusImageFor(images, POTS, { [POT]: "Black" }), undefined)
  assert.deepEqual(
    ids(nextGalleryHeads(images, POTS, [POT_OPTION], { [POT]: "Gold" })),
    []
  )
})

// ---------------------------------------------------------------------------
// What the page hands the gallery
// ---------------------------------------------------------------------------
console.log("\nWhat the page hands the gallery")

test("only what the gallery needs: addresses, ties, and each variant's option values", () => {
  const data = galleryDataOf({
    images: [
      {
        id: "i1",
        url: "https://media.example.com/1.jpg",
        rank: 0,
        metadata: { alt: "x" },
        variants: [{ id: "v1", title: "Gold" }],
      },
      { id: "i2", url: "https://media.example.com/2.jpg", rank: 1 },
    ] as any,
    variants: [
      {
        id: "v1",
        sku: "S1",
        title: "Gold",
        options: [
          { id: "optval_1", option_id: "opt_pod", value: "Gold", metadata: null },
        ],
      },
    ] as any,
    options: [
      {
        id: "opt_pod",
        title: "Pod",
        values: [
          { id: "optval_1", value: "Gold" },
          { id: "optval_2", value: "Black" },
        ],
      },
    ] as any,
  })

  assert.deepEqual(data, {
    images: [
      {
        id: "i1",
        url: "https://media.example.com/1.jpg",
        variants: [{ id: "v1" }],
      },
      { id: "i2", url: "https://media.example.com/2.jpg", variants: [] },
    ],
    variants: [{ id: "v1", options: [{ option_id: "opt_pod", value: "Gold" }] }],
    options: [{ id: "opt_pod", values: ["Gold", "Black"] }],
  })
})

test("the options come in the admin's order, values by rank", () => {
  const data = galleryDataOf({
    metadata: { option_order: ["opt_plant", "opt_pod"] },
    options: [
      {
        id: "opt_pod",
        values: [
          { value: "Gold", rank: 2 },
          { value: "Black", rank: 1 },
        ],
      },
      { id: "opt_plant", values: [{ value: "Green" }] },
    ],
  })
  assert.deepEqual(data.options, [
    { id: "opt_plant", values: ["Green"] },
    { id: "opt_pod", values: ["Black", "Gold"] },
  ])
})

test("a product with no pictures, variants or options gives empty lists", () => {
  const empty = { images: [], variants: [], options: [] }
  assert.deepEqual(galleryDataOf({}), empty)
  assert.deepEqual(
    galleryDataOf({ images: null, variants: null, options: null }),
    empty
  )
})

console.log(`\n${passed} passed`)
