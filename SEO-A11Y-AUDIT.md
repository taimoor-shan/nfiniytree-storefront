# InfinyTree — SEO & Accessibility Audit + Fix

**Scope:** technical SEO + WCAG 2.2 AA accessibility, storefront (`infinytree-storefront`).
**Constraint honoured:** no redesign. The premium visual language (cream canvas, coral accent, dark product surfaces, Copernicus display serif) is unchanged. The only visual deltas are two coral values darkened for text contrast and focus rings that appear on keyboard focus only.

**Branch:** `seo-accessiblity` · **Build:** passes · **Lint:** 0 errors / 82 warnings (unchanged baseline)

---

## 1. Scores

Lighthouse 13.4.1, headless Chrome, mobile preset. **Before** = live production (`https://infinytree.com`, still running pre-fix code). **After** = local production build (`yarn build && yarn start`).

| Page | Accessibility | SEO |
|---|---|---|
| Home `/hu` | 79 → **100** | 83 → **100** |
| Store `/hu/store` | 85 → **100** | 83 → **100** |
| Product `/hu/products/red-maple-tree` | 83 → **100** | 83 → **100** |
| Contact `/hu/contact` | 86 → **100** | 83 → **100** |
| Cart `/hu/cart` | **100** | 66 *(intended — see note)* |

Failing-element counts, production → after:

| Audit | Home | Store | PDP | Contact |
|---|---|---|---|---|
| `color-contrast` | 32 → 0 | 27 → 0 | 21 → 0 | 11 → 0 |
| `button-name` | 2 → 0 | 2 → 0 | 1 → 0 | 1 → 0 |
| `image-alt` | 2 → 0 | 2 → 0 | 2 → 0 | 2 → 0 |
| `target-size` | 1 → 0 | pass | 6 → 0 | pass |
| `listitem` | 1 → 0 | pass | pass | pass |
| `heading-order` | pass | 1 → 0 | pass | pass |
| `robots-txt` | 2 → 0 | 2 → 0 | 2 → 0 | 2 → 0 |

**Cart SEO 66 is correct, not a regression.** The only failing audit is `is-crawlable`, triggered by `<meta name="robots" content="noindex, follow">` — the funnel exclusion this audit was asked to add. Forcing it to 100 would mean indexing the cart.

---

## 2. Issues found

### Critical

| # | Issue | Evidence | Fix |
|---|---|---|---|
| C1 | **`/robots.txt` and `/sitemap.xml` returned storefront HTML, HTTP 200.** `next-sitemap.js` config existed but the `next-sitemap` package was never installed and there was no `postbuild` script. Both paths fell through to the `[countryCode]` dynamic segment. Every crawler saw "no robots file, no sitemap". | `robots-txt` audit failed on all 4 pages | Native `src/app/robots.ts` + `src/app/sitemap.ts` (take routing precedence over dynamic segments). Deleted the dead `next-sitemap.js`. |
| C2 | **No canonical URL on any page.** Verified absent on production. With country redirects and market variants, every market's content was an undeclared duplicate. | production emits no `<link rel="canonical">` | `alternates.canonical` on every indexable route via `src/lib/util/seo.ts`; self-referencing, no query params. |
| C3 | **Product pages had an empty `<h1>`; the product name was an `<h2>`.** | reported, reproduced | Product name is now the `h1`. |
| C4 | **`/hu/contact` had zero `h1`.** Its only one came from `<Hero>`, commented out at `contact/page.tsx:61`; both content branches opened at `h2`. | `h1 count: 0` | `h1` in both branches. Computed styles pinned identical to the previous `h2` — see §4. |
| C5 | **White-on-coral CTAs at 3.28:1** (needs 4.5:1). `--button-inverted: #cc785c` in `globals.css` is the fill for every Medusa `<Button variant="primary">` — Add to Cart, mobile cart bar, hero CTA, contact submit. | 32/27/21/11 failing nodes | `--button-inverted: #bb5a3a` → **4.53:1**. Same hue and saturation. |
| C6 | **Focus indicator removed from every Medusa `<Button>` in the app**, including all checkout step buttons — `--buttons-*-focus: none`. Keyboard users had no visible focus anywhere in the purchase flow. | source | Focus box-shadows restored (coral ring). Flat resting look preserved. |
| C7 | **Checkout radio groups had no visible focus**: shipping method, pickup location, payment method, salutation, saved address. The presentational dot carried `outline-none` and no call site styled the real control's focus state. Arrowing through payment methods moved focus invisibly. | source | `.radio-option-focus` utility using Headless UI v2's `data-focus`. |

### High

| # | Issue | Fix |
|---|---|---|
| H1 | **All five policy pages shipped byte-identical meta descriptions** — the shared `policy.pageBeingUpdated` fallback ("This page is being updated") whenever the CMS had no `seo_description`. | Distinct per-page fallback keys (`metadata.privacyDescription`, `.termsDescription`, …) in all 4 dictionaries. |
| H2 | **CMS pages under `/pages/<slug>` could ship with no meta description at all** — `page.seo_description \|\| page.excerpt \|\| undefined`. | `resolveDescription()` derives one from the page body as a last resort. |
| H3 | **A whitespace-only CMS field suppressed the description fallback.** `"  "` is truthy, so it won the `\|\|` chain and shipped a blank `<meta name="description">` — worse than the fallback it displaced, and invisible in the admin UI. Affected contact, about, customer-service, `/pages/*`. | `resolveDescription()` treats blank as absent. Unit-tested against whitespace/newline/nbsp-only and empty-tag inputs. |
| H4 | **`/us`, `/gb` → 404 via a two-hop chain.** An unsupported market was *prefixed* (`/us` → `/hu/us` → 404) instead of replaced. Reachable from any stale link or mistyped market. | Country segment is now replaced: `/gb/about` → `/hu/about` → 200, one hop. |
| H5 | **Country-code matching used `.includes()`, a substring test.** With `hu` selected, `/human-touch` and `/hu-guide` were treated as already carrying a country code, skipping the redirect and rendering against an unresolvable region. | Exact match on the first path segment against the live region map. |
| H6 | **A backend outage turned every route into a 500**, including `/robots.txt` and `/sitemap.xml` — telling crawlers the whole site was broken. | Crawler files served before any network call; region lookup falls back to the default region on failure. |
| H7 | **No Product structured data.** | `Product` JSON-LD on the PDP — see §3. |
| H8 | **No hreflang.** | Full cluster + `x-default`, built only from live regions. |
| H9 | **Repeated 307 on cookie-less requests** (reported). The chosen market was never persisted and the per-visitor redirect was CDN-cacheable. | Market written to `selected-country`; `Cache-Control: no-store` + `Vary: Cookie, x-vercel-ip-country`. |
| H10 | **Icon-only controls had no accessible name**: cart, menu, close, quantity, remove item, country/language selectors, gallery thumbnails, password reveal. | `aria-label` / `sr-only` text via 29 new `a11y.*` dictionary keys, translated in all 4 locales. |
| H11 | **Sort control had no accessible name.** `Select.Trigger` contained only `Select.Value`, so its whole name was the current option — "Latest Arrivals, combobox", never saying what it changes. Shared by home, store, category and collection grids. | `aria-label={t("store.sortBy")}`. |
| H12 | **`<Button>` nested inside `<a>`** at 6 sites — invalid HTML, two overlapping targets, the anchor reduced to an 8px strip (WCAG 2.5.8). | `asChild` (Radix Slot) collapses each to a single element. |
| H13 | **Checkout form fields lacked programmatic error association and autocomplete.** | `aria-invalid`, `aria-describedby` → `role="alert"` message, `aria-required`; `autocomplete` on all 11 address fields; `type="email"` / `type="tel"`. |
| H14 | **Cart, checkout, account and order routes were indexable.** | Page-level `noindex, follow` + robots.txt disallow. Both, because robots.txt only stops crawling — a disallowed URL can still be indexed from an external link. |
| H15 | **CMS pages were silently dropped from the sitemap.** `listPages({ limit: 200 })` exceeds the backend's cap of 100 and threw; the error-tolerance wrapper swallowed it. Caught by a build-log warning. | Paginated at the cap, driven by the reported `count`. |
| H16 | **`/customer-service` and `/pages/customer-service` were both in the sitemap** — same content, two URLs. The CMS also returns one record per locale, so duplicate slugs would double-emit. | Added `contact` + `customer-service` to the own-route exclusion set; dedupe by slug. |

### Medium

| # | Issue | Fix |
|---|---|---|
| M1 | Generic alt text (`Thumbnail`, `Product image`). | Informative images get the product name and position ("Red Maple Tree — image 2 of 6"); decorative get `alt=""`. Flag icons already correct. |
| M2 | Orphan `<li>` in `<main>` — `FeaturedProducts` returned bare `<li>` with no list parent. | `<Fragment key>`. |
| M3 | Inline coral link text `#cc785c` at 2.89:1 on cream. | `.text-link` → `primary-text` `#a65134`. |
| M4 | `.btn-primary-outlined` label `#cc785c` on transparent. | Label → `primary-text`; border stays `primary` (non-text needs only 3:1). |
| M5 | `.contrast-btn` hover filled coral with white text. | Hover → `primary-strong`. |
| M6 | Form fields set `--tw-ring-color` but no ring *width* — the only focus cue was a border tint. | `:focus-visible` outline. Mouse interaction unchanged. |
| M7 | Store `heading-order` level skip. | Corrected. |
| M8 | No skip link; unlabelled landmarks. | Skip link; one `<main>`, labelled `<nav>`s, `<footer>`. |
| M9 | Hero background was an inline `background-image` — invisible to the preload scanner, unoptimizable, so the homepage LCP asset (1.6 MB JPEG) was discovered late and served full-size. | Real `next/image` with `fill` + `preload`, served resized as AVIF/WebP. Identical rendering. |
| M10 | `<Label>` wrapped the promo-code toggle button — invalid, left the field unnamed. | Plain disclosure button with `aria-expanded`/`aria-controls`; field has its own `<Label htmlFor>`. |
| M11 | Cart/variant/validation updates were silent to screen readers. | `role="status"` / `aria-live="polite"` regions. |
| M12 | `/hu/` (trailing slash) — verified single 308 to `/hu`. | No change needed. |

### Low

| # | Issue | Fix |
|---|---|---|
| L1 | Symbol-only status glyphs (✓ ✗ ⚠) read out as punctuation. | `aria-hidden` on the glyph; text carries the meaning. |
| L2 | Required-field `*` announced as "star". | `aria-hidden` on `*`; `aria-required` carries it. |
| L3 | Password rule text unassociated. | `aria-describedby`. |
| L4 | Language selector had no accessible name. | `common.language` + `a11y.selectLanguage`. |

---

## 3. Product structured data

One `Product` JSON-LD block per PDP. Validated by parsing the rendered page:

```
name        : Red Maple Tree
url         : {site}/hu/products/red-maple-tree
description : (plain text, tags stripped)
brand       : Infinytree
category    : Premium Line
image       : 6 absolute URLs
offers      : AggregateOffer (3 offers, HUF, all InStock, NewCondition)
```

- **No fabricated data.** No `aggregateRating`, `review`, `priceValidUntil`, `shippingDetails` or `hasMerchantReturnPolicy` — the store has no review data and inventing the rest to win a richer SERP earns a manual action.
- **Price matches the page.** JSON-LD `5454545 HUF` = visible `5 454 545 Ft`.
- **Availability mirrors the shopper-facing logic** (`isVariantAvailable`), so Google and the buyer never disagree.
- `AggregateOffer` for multi-variant, plain `Offer` for single. Variants without a resolved price are dropped rather than published at 0.
- `<` escaped so a stray `</script>` in product copy cannot break out.

> **`sku` is absent — client action required.** No variant in Medusa has a SKU, EAN, UPC or barcode. The code emits these the moment they exist; they cannot be invented. Recommended for Merchant Center.

---

## 4. Preserving the design

Two coral values changed, both because white or coral **text** failed 4.5:1:

| Token | Before | After | Contrast |
|---|---|---|---|
| `--button-inverted` (filled CTA) | `#cc785c` | `#bb5a3a` | 3.28 → **4.53:1** |
| `.text-link`, outlined button label | `#cc785c` | `#a65134` | 2.89 → **4.5:1+** |

Same hue and saturation, darkened only far enough to pass. `#cc785c` is **untouched** everywhere it is not text-bearing — borders, focus rings, decorative fills, the coral callout card. Focus rings appear on `:focus-visible` only, so mouse interaction looks exactly as before.

The contact `h1` needed care: `@tailwindcss/typography` is **not** installed — `prose` is hand-rolled, and `.prose h1` (specificity 0,1,1) beats the element's utility classes. A plain tag swap would have jumped the heading to `md:text-5xl` (3rem) and lost the top margin `.prose h2` supplied. Pinned with `mt-8 !text-3xl !leading-normal !mb-6`; computed styles are identical to the previous `h2`.

---

## 5. Testing performed

### SEO

| Check | Result |
|---|---|
| `/robots.txt` | 200, `content-type: text/plain`, valid directives, `Sitemap:` + `Host:` |
| `/sitemap.xml` | 200, `application/xml`, parses as valid XML, **30 URLs** |
| Sitemap hygiene | 0 duplicates, 0 funnel URLs, 0 parameter URLs, 30/30 carry hreflang, symmetric across markets (15 `de` / 15 `hu`) |
| Canonical | present + self-referencing on **10/10** indexable pages; correctly absent on `noindex` cart |
| Metadata uniqueness | **11 unique titles / 11 unique descriptions** across 11 pages, 0 duplicates |
| `lang` + localized metadata | tracks the locale cookie: `hu-HU` → `lang="hu"` / "Kapcsolat", `de-AT` → `lang="de"` / "Kontakt", `en` → `lang="en"` / "Contact Us" |
| Open Graph | 5–6 `og:` properties on every page |
| hreflang | 3 entries per page (`de-DE`, `hu-HU`, `x-default`), live regions only, no URL for a market that doesn't exist |
| Redirects | `/`, `/store`, `/us`, `/us/store`, `/gb/about` → **single 307, terminating in 200**. No chains, no loops. |
| Loop probes | `/hu/hu`, `/human-touch`, `/hu-guide`, `/HU`, `/hu/`, `/hu/store?page=2` — all terminate, max one hop |
| 307 cookie fix | request 1 sets `selected-country=hu`, `Cache-Control: no-store`, `Vary: Cookie, x-vercel-ip-country` |
| Headings | **17 pages** (`hu` + `de` × home, store, about, contact, customer-service, 5 policies, 2 PDPs, 2 categories, 1 collection): exactly one meaningful `h1`, zero empty headings, zero level skips. PDP `h1` = "Red Maple Tree". |
| Product JSON-LD | parsed and field-verified; price cross-checked against visible price |
| Image alt | 5 pages: **0 missing alt, 0 generic alt**; decorative correctly `alt=""` |
| `noindex` | cart/checkout/account/order → `noindex, follow` + robots disallow |

### Accessibility

| Check | Result |
|---|---|
| Automated | Lighthouse **100** on home, store, PDP, contact, cart — zero failing audits |
| Buttons | 13/13 home, 13/13 store, 35/35 PDP, 12/12 cart have accessible names — **0 unnamed** |
| Semantics | 1 `<main>`, 3/3 labelled `<nav>`, 1 `<footer>`, skip link on every page |
| Clickable `<div>`s | **0** across all pages tested |
| Forms | shipping-address 15/15 and billing 9/9 fields labelled; promo field labelled via `sr-only` `<Label htmlFor>`; VAT, phone, email, all 11 checkout fields verified |
| Autocomplete | 13 attributes: `email`, `given-name`, `family-name`, `organization`, `address-line1/2`, `postal-code`, `address-level1/2`, `country`, `tel`, `new-password` |
| Input types | `type="email"`, `type="tel"` |
| Errors | `role="alert"` + `aria-describedby` + `aria-invalid` |
| Contrast | computed per WCAG formula for every changed token |
| Focus | restored on Medusa buttons, checkout radio groups, inputs, links; `:focus-visible` only |
| Dynamic feedback | `aria-live` regions for cart, variant, validation, loading |
| Target size | 6 nested-button sites fixed; icon buttons ≥ 24×24 by source audit |

### Not verified

- **Manual keyboard walkthrough** of the full purchase flow and **real-device mobile testing** — reviewed at source and via rendered HTML, not exercised by hand in a browser.
- **Google Search Console / PageSpeed Insights / Rich Results Test** — need the deployed domain; run after deploy.
- **Screen reader** (VoiceOver/NVDA) — semantics verified structurally, not aurally.

---

## 6. Requires deploy or client action

**Deploy-dependent** (correct in code, unverifiable locally):

1. **`www` → apex is not live.** `https://www.infinytree.com` currently 307s to `https://www.infinytree.com/hu` — it stays on the `www` host, and `https://www.infinytree.com/hu/about` returns 200 with no canonical. The 308 rule in `next.config.js:117-141` is correct but gated on an `https` `NEXT_PUBLIC_BASE_URL`, so it cannot fire locally. **Set `NEXT_PUBLIC_BASE_URL=https://infinytree.com` in production** — every canonical, hreflang and sitemap URL derives from it. Served by nginx, so a host-level redirect there is the more robust fix.
2. **Country redirect is 307.** Deliberate: the target depends on cookie + geo-IP, so a permanent redirect would let a browser or shared CDN pin one visitor's market onto everyone. Indexation is handled by the canonical + `x-default`. Flagged because the brief asked for permanence — permanence applies to `www`→apex and HTTP→HTTPS, both host-level.
3. Re-verify `noindex` on cart/account and re-run Lighthouse against the live domain after deploy.
4. Local backend serves 2 markets vs 27 in production, so the live sitemap and hreflang clusters will be proportionally larger.

**Client action:**

5. **No variant has a SKU/EAN/barcode** — blocks `sku`/`gtin` in Product JSON-LD. Data entry in Medusa; the code emits them automatically once present.

**Pre-existing defects found but deliberately not fixed** (outside this brief's scope — flagging rather than silently expanding it):

6. **Newsletter form fakes success** — `setTimeout(() => setStatus("success"), 1000)`, no API call. Users believe they subscribed.
7. **`typescript.ignoreBuildErrors: true`** in `next.config.js` masks 21 real type errors in `src/`.
8. **Order-transfer accept/decline mutate state on a GET during render** — a crawler or prefetch can trigger them.
9. `AnnouncementBanner` is dead code with hardcoded English `$50` copy; `filter-radio-group` is dead code.

---

## 7. Files changed

**New:** `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/util/seo.ts`, `src/lib/util/page-metadata.ts`, `src/modules/products/components/product-jsonld/index.tsx`
**Deleted:** `next-sitemap.js` (dead config for an uninstalled package)
**Modified:** 100 files — ~1,900 insertions. Route metadata (28 pages), `src/proxy.ts` (redirect correctness + outage tolerance), `src/styles/globals.css` (contrast + focus tokens), 4 i18n dictionaries (+31 keys each), ~60 components.

Every non-obvious change carries a comment explaining the defect it fixes, so the reasoning survives in the code.
