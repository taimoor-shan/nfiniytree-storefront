/**
 * Which pictures the product gallery shows for what the shopper has chosen.
 *
 * In the admin a picture is tied to the variants it shows (Product → Media →
 * the picture → variants, or a variant's own images); a picture tied to none
 * belongs to every variant. The gallery shows the chosen variant's pictures
 * first, in the order the admin ranks them, then the shared ones, so the first
 * picture is always the plant the shopper picked.
 *
 * Run:  npx tsx src/lib/util/variant-gallery.test.ts
 */
import assert from "node:assert/strict"
import {
  galleryDataOf,
  nextGalleryHeads,
  selectGalleryImages,
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

console.log("One option: the pot")

test("nothing chosen shows the whole product, untouched", () => {
  assert.equal(selectGalleryImages(TREE, POTS, {}), TREE)
})

test("a variant's own pictures come first, in the admin's order, then the shared ones", () => {
  assert.deepEqual(ids(selectGalleryImages(TREE, POTS, { [POT]: "Gold" })), [
    "gold-1",
    "gold-2",
    "shared-1",
    "shared-2",
    "shared-3",
  ])
})

test("a variant with one picture of its own", () => {
  assert.deepEqual(ids(selectGalleryImages(TREE, POTS, { [POT]: "Black" })), [
    "black-1",
    "shared-1",
    "shared-2",
    "shared-3",
  ])
})

test("a variant with nothing of its own shows the shared pictures", () => {
  assert.deepEqual(ids(selectGalleryImages(TREE, POTS, { [POT]: "White" })), [
    "shared-1",
    "shared-2",
    "shared-3",
  ])
})

test("the pictures are the product's own objects, not copies", () => {
  const [first] = selectGalleryImages(TREE, POTS, { [POT]: "Gold" })
  assert.equal(first, GOLD_1)
})

test("a picture tied to two variants shows for both, and not for the third", () => {
  const both = pic("both", "var_gold", "var_black")
  const images = [both, GOLD_1, BLACK_1]
  assert.deepEqual(
    ids(selectGalleryImages(images, POTS, { [POT]: "Gold" })),
    ["both", "gold-1"]
  )
  assert.deepEqual(
    ids(selectGalleryImages(images, POTS, { [POT]: "Black" })),
    ["both", "black-1"]
  )
  // White has nothing of its own and there is nothing shared: the whole product
  assert.deepEqual(
    ids(selectGalleryImages(images, POTS, { [POT]: "White" })),
    ["both", "gold-1", "black-1"]
  )
})

test("a product whose pictures are tied to nothing is never touched", () => {
  const plain = [pic("a"), pic("b"), pic("c")]
  assert.equal(selectGalleryImages(plain, POTS, { [POT]: "Gold" }), plain)
})

test("pictures whose ties the API did not send count as shared", () => {
  const untied = [
    { id: "a", url: "https://media.example.com/a.jpg" },
    { id: "b", url: "https://media.example.com/b.jpg", variants: null },
  ]
  assert.equal(selectGalleryImages(untied, POTS, { [POT]: "Gold" }), untied)
})

test("a choice no variant has shows the whole product", () => {
  assert.equal(selectGalleryImages(TREE, POTS, { [POT]: "Pink" }), TREE)
})

test("a blank or missing value is not a choice", () => {
  assert.equal(selectGalleryImages(TREE, POTS, { [POT]: undefined }), TREE)
  assert.equal(selectGalleryImages(TREE, POTS, { [POT]: "" }), TREE)
})

test("the gallery is never empty: all pictures are for other variants", () => {
  const images = [GOLD_1, BLACK_1]
  assert.equal(
    selectGalleryImages(images, POTS, { [POT]: "White" }).length,
    2
  )
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
const COMBOS = [GOLD_GREEN, GOLD_VAR, BLACK_GREEN, BLACK_VAR]

const PHOTOS = [
  pic("gold-pod", "v_gold_green", "v_gold_var"), // the gold pod, any plant
  pic("room"), // a shot of the whole piece in a room: shared
  pic("gold-green", "v_gold_green"), // exactly this pod and this plant
  pic("variegated", "v_gold_var", "v_black_var"), // the variegated plant, any pod
  pic("black-green", "v_black_green"),
]

console.log("\nTwo options: the pod and the plant")

test("both chosen: the pictures of that one combination, then the shared ones", () => {
  assert.deepEqual(
    ids(selectGalleryImages(PHOTOS, COMBOS, { [POD]: "Gold", [PLANT]: "Green" })),
    ["gold-pod", "gold-green", "room"]
  )
  assert.deepEqual(
    ids(
      selectGalleryImages(PHOTOS, COMBOS, {
        [POD]: "Gold",
        [PLANT]: "Variegated",
      })
    ),
    ["gold-pod", "variegated", "room"]
  )
  assert.deepEqual(
    ids(
      selectGalleryImages(PHOTOS, COMBOS, {
        [POD]: "Black",
        [PLANT]: "Variegated",
      })
    ),
    ["variegated", "room"]
  )
})

test("only the pod chosen: the pictures of every variant with that pod", () => {
  assert.deepEqual(ids(selectGalleryImages(PHOTOS, COMBOS, { [POD]: "Gold" })), [
    "gold-pod",
    "gold-green",
    "variegated",
    "room",
  ])
})

test("only the plant chosen: the pictures of every variant with that plant", () => {
  assert.deepEqual(
    ids(selectGalleryImages(PHOTOS, COMBOS, { [PLANT]: "Variegated" })),
    ["gold-pod", "variegated", "room"]
  )
})

test("a combination the product does not have shows the whole product", () => {
  const withoutBlackGreen = [GOLD_GREEN, GOLD_VAR, BLACK_VAR]
  assert.equal(
    selectGalleryImages(PHOTOS, withoutBlackGreen, {
      [POD]: "Black",
      [PLANT]: "Green",
    }),
    PHOTOS
  )
})

// ---------------------------------------------------------------------------
// Which pictures to fetch ahead: the first one each next click would show
// ---------------------------------------------------------------------------
const POT_OPTION: GalleryOption = { id: POT, values: ["Black", "Gold", "White"] }
const POD_OPTION: GalleryOption = { id: POD, values: ["Gold", "Black"] }
const PLANT_OPTION: GalleryOption = {
  id: PLANT,
  values: ["Green", "Variegated"],
}

console.log("\nPictures to fetch ahead")

test("from nothing chosen: what each pot would show first, bar what is on show", () => {
  // On show now: gold-1 (the product's first). Gold shows it too.
  assert.deepEqual(ids(nextGalleryHeads(TREE, POTS, [POT_OPTION], {})), [
    "black-1",
    "shared-1",
  ])
})

test("with a pot chosen: the other pots' first pictures", () => {
  assert.deepEqual(
    ids(nextGalleryHeads(TREE, POTS, [POT_OPTION], { [POT]: "Gold" })),
    ["black-1", "shared-1"]
  )
})

test("two options: one click on either option, a picture at a time", () => {
  // Gold + Green shows gold-pod. Black pod shows black-green; the variegated
  // plant shows gold-pod again, which is already on show.
  assert.deepEqual(
    ids(
      nextGalleryHeads(PHOTOS, COMBOS, [POD_OPTION, PLANT_OPTION], {
        [POD]: "Gold",
        [PLANT]: "Green",
      })
    ),
    ["black-green"]
  )
})

test("the same picture is only listed once", () => {
  const images = [pic("x", "var_black", "var_white"), pic("y", "var_gold")]
  assert.deepEqual(
    ids(nextGalleryHeads(images, POTS, [POT_OPTION], { [POT]: "Gold" })),
    ["x"]
  )
})

test("it stops at the limit", () => {
  assert.equal(
    nextGalleryHeads(TREE, POTS, [POT_OPTION], {}, 1).length,
    1
  )
})

test("a product without ties has nothing to fetch ahead", () => {
  const plain = [pic("a"), pic("b")]
  assert.deepEqual(nextGalleryHeads(plain, POTS, [POT_OPTION], {}), [])
})

test("a picture without an address is never fetched", () => {
  const images: VariantTiedImage[] = [
    { id: "gold-1", url: "https://media.example.com/gold-1.jpg", variants: [{ id: "var_gold" }] },
    { id: "black-nourl", url: null, variants: [{ id: "var_black" }] },
    { id: "shared-1", url: "https://media.example.com/shared-1.jpg", variants: [] },
  ]
  assert.deepEqual(
    ids(nextGalleryHeads(images, POTS, [POT_OPTION], { [POT]: "Gold" })),
    ["shared-1"]
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

test("a product with no pictures, variants or options gives empty lists", () => {
  const empty = { images: [], variants: [], options: [] }
  assert.deepEqual(galleryDataOf({}), empty)
  assert.deepEqual(
    galleryDataOf({ images: null, variants: null, options: null }),
    empty
  )
})

console.log(`\n${passed} passed`)
