/**
 * Run:  npx tsx src/lib/util/approx-dimensions.test.ts
 */
import assert from "node:assert/strict"

import { formatDimension, parseApproxDimensions } from "./approx-dimensions"

// The shape the admin stores for Blue Cascade, once parsed
assert.deepEqual(
  parseApproxDimensions({
    height: "160–180",
    width: "140–170",
    depth: "80–100",
    unit: "cm",
  }),
  { height: "160–180", width: "140–170", depth: "80–100", unit: "cm" }
)

// The unit defaults to centimetres, like the rest of the specifications
assert.equal(parseApproxDimensions({ height: "160–180" })?.unit, "cm")

// A single figure may be a number; blanks are dropped
assert.deepEqual(parseApproxDimensions({ height: 170, width: "  ", depth: "" }), {
  height: "170",
  width: undefined,
  depth: undefined,
  unit: "cm",
})

// Nothing usable
assert.equal(parseApproxDimensions(undefined), null)
assert.equal(parseApproxDimensions(null), null)
assert.equal(parseApproxDimensions("160–180"), null, "text that was not JSON")
assert.equal(parseApproxDimensions(["160–180"]), null)
assert.equal(parseApproxDimensions({ unit: "cm" }), null, "no dimension at all")
assert.equal(parseApproxDimensions({ height: " ", width: null }), null)

// A spec row: the exact figure wins, a range is marked as approximate
assert.deepEqual(
  formatDimension({ exact: 220, range: "160–180", unit: "cm", approxLabel: "approx." }),
  { text: "220 cm", approximate: false }
)
assert.deepEqual(
  formatDimension({ range: "160–180", unit: "cm", approxLabel: "approx." }),
  { text: "approx. 160–180 cm", approximate: true }
)
assert.deepEqual(
  formatDimension({ exact: null, range: "80–100", unit: "cm", approxLabel: "ca." }),
  { text: "ca. 80–100 cm", approximate: true }
)
assert.equal(formatDimension({ unit: "cm", approxLabel: "approx." }), null)
assert.equal(formatDimension({ exact: 0, unit: "cm", approxLabel: "approx." }), null)

console.log("approx-dimensions.test.ts: ok")
