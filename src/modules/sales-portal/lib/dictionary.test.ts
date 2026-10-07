/**
 * Every sentence the sales portal shows exists in every language.
 *
 * Run:  npx tsx src/modules/sales-portal/lib/dictionary.test.ts
 *
 * The keys are found in the portal's source, so a sentence added to a page
 * without a translation fails here instead of showing its key to a rep.
 */
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const root = path.resolve(__dirname, "../../../..")
const LANGUAGES = ["en", "de-AT", "de-DE", "hu-HU"] as const

const dictionaries = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    JSON.parse(
      readFileSync(path.join(root, `src/i18n/dictionaries/${language}.json`), "utf8")
    ) as Record<string, string>,
  ])
)

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory()
      ? sourceFiles(full)
      : /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")
        ? [full]
        : []
  })

const files = [
  ...sourceFiles(path.join(root, "src/modules/sales-portal")),
  ...sourceFiles(path.join(root, "src/app/[countryCode]/(main)/sales-portal")),
  path.join(root, "src/lib/data/sales-portal.ts"),
  path.join(root, "src/lib/data/sales-portal-actions.ts"),
]

// Keys written out in full
const literal = new Set<string>()
for (const file of files) {
  const matches = Array.from(
    readFileSync(file, "utf8").matchAll(
      /["'`]((?:salesPortal|metadata\.salesPortal)[A-Za-z0-9_.]*)["'`]/g
    )
  )
  for (const match of matches) {
    literal.add(match[1])
  }
}

// Keys built from a status or an error code
const families: Record<string, string[]> = {
  "salesPortal.status.": ["paid", "partial", "unpaid", "overpaid", "none"],
  "salesPortal.lineStatus.": ["pending", "earned", "payable", "reversed", "adjustment", "paid"],
  "salesPortal.line.": ["commission", "level2", "reversal", "adjustment", "payout"],
  "salesPortal.recruits.status.": [
    "active", "pending_approval", "invited", "expired", "inactive", "declined",
  ],
  // The codes the plugin sends with its recruiting errors (lib/recruiting-errors.ts)
  "salesPortal.error.": [
    "recruiter_not_allowed", "invite_self", "invite_already_rep", "invite_duplicate_own",
    "invite_duplicate_other", "invite_applied", "invite_limit", "invite_cooldown",
    "invite_not_pending", "link_invalid", "link_expired", "link_used", "terms_required",
    "already_rep", "invalid",
  ],
}
const needed = new Set(literal)
for (const [prefix, names] of Object.entries(families)) {
  for (const name of names) needed.add(`${prefix}${name}`)
}

const placeholders = (text: string) =>
  Array.from(new Set(Array.from(text.matchAll(/\{(\w+)\}/g)).map((m) => m[1]))).sort()

let checked = 0
for (const key of Array.from(needed)) {
  for (const language of LANGUAGES) {
    assert.ok(
      typeof dictionaries[language][key] === "string" && dictionaries[language][key] !== "",
      `${language} has no sentence for ${key}`
    )
  }
  const expected = placeholders(dictionaries.en[key])
  for (const language of LANGUAGES) {
    assert.deepEqual(
      placeholders(dictionaries[language][key]),
      expected,
      `${language} ${key} uses other placeholders than English`
    )
  }
  checked += 1
}

// The keys the code names are only worth anything if it names plenty of them
assert.ok(literal.size > 80, `found only ${literal.size} literal keys: did the pattern break?`)

console.log(`ok: ${checked} sales portal sentences, in ${LANGUAGES.length} languages`)
