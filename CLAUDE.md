# CLAUDE.md — Storefront

The root [`CLAUDE.md`](../CLAUDE.md) covers the monorepo overview, RAG pipeline instructions, and cross-system data flow. This file covers storefront-specific architecture.

## Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server on port 8000 (Turbopack) |
| `yarn build` | Production build |
| `yarn start` | Start production server on port 8000 |
| `yarn lint` | Run ESLint |
| `yarn analyze` | Build with bundle analyzer (`ANALYZE=true`) |

Override the port: `PORT=3000 yarn dev`.

## Environment Variables

Copy `.env.template` to `.env.local` for local development. Required variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa backend (default `http://localhost:9000`) |
| `MEDUSA_BACKEND_URL` | Where this server reaches Medusa directly (server-side only, optional in development). Production: `http://localhost:9000`. Needed for the sales portal, the invite page and the client link check, and read by the guest order and invoice routes. Defaults to `NEXT_PUBLIC_MEDUSA_BACKEND_URL` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable API key |
| `NEXT_PUBLIC_BASE_URL` | Storefront URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_DEFAULT_REGION` | Fallback region when geo-detection fails (ISO-2, e.g. `us`) |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe public key (optional) |
| `REVALIDATE_SECRET` | Next.js on-demand revalidation secret |
| `NEXT_PUBLIC_SEARCH_ENDPOINT` | MeiliSearch URL (default `http://localhost:7700`) |
| `NEXT_PUBLIC_SEARCH_API_KEY` | MeiliSearch search key |
| `NEXT_PUBLIC_INDEX_NAME` | MeiliSearch index name (default `products`) |

The dev server validates `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` at startup via `check-env-variables.js`.

## Design System

This project follows a comprehensive design system documented in [`DESIGN.md`](DESIGN.md) — a warm-canvas editorial interface with cream canvas (`#faf9f5`), coral primary (`#cc785c`), and dark navy product surfaces (`#181715`). The design is drawn from Anthropic's Claude marketing site.

**Key rules enforced by the design system:**
- **Canvas is cream, never white** — the warm tint is the brand differentiator
- **Copernicus / Gelasio serif for display headlines** at weight 400 with negative letter-spacing — never bold, never sans-serif
- **Coral (`primary`) is scarce** — only on primary CTAs and full-bleed coral callout cards
- **Surface rhythm alternates** — cream → cream-card → dark-mockup → cream → coral-callout → dark-footer
- **Colors use semantic tokens** in `tailwind.config.js`, never inline hex values
- Full component tokens (buttons, cards, inputs, badges, tabs, CTAs, footer) are in `DESIGN.md` under `components:`

## Knowledge Graph

The `graphify-out/` directory contains a pre-built knowledge graph (770 nodes, 856 edges, 233 communities). See root CLAUDE.md for when and how to consult it.

**Storefront god nodes** (high blast radius — grep callers before editing):

| Node | File | Edges |
|------|------|-------|
| `getAuthHeaders()` | `src/lib/data/cart.ts` | 38 |
| `getCacheOptions()` | `src/lib/data/cookies.ts` | 36 |
| `retrievePageBySlug()` | `src/lib/data/pages.ts` | 25 |
| `retrieveCustomer()` | `src/lib/data/customer.ts` | 22 |
| `getRegion()` | `src/lib/data/regions.ts` | 19 |
| `convertToLocale()` | `src/lib/util/money.ts` | 17 |
| `listProducts()` | `src/lib/data/products.ts` | 16 |
| `getCartId()` | `src/lib/data/cookies.ts` | 15 |

## Project Architecture

Next.js App Router storefront using the Medusa.js SDK.

### Directory Map

| Directory | Purpose |
|-----------|---------|
| `src/app/[countryCode]/` | App Router pages — checkout, main store, account, cart, orders |
| `src/lib/data/` | Server-side data fetching — wraps SDK calls with auth + cache headers |
| `src/lib/util/` | Pure utilities — pricing, sorting, locale, money, addresses |
| `src/lib/hooks/` | Client React hooks — `useToggleState`, `useInView` |
| `src/lib/context/` | React context — modal |
| `src/modules/*/components/` | Feature-specific UI components |
| `src/modules/*/templates/` | Page-level composition templates |
| `src/modules/common/` | Shared components, icons, modal |
| `src/modules/sales-portal/` | Sales reps' commission portal — shell, tables, formatting helpers |
| `src/modules/skeletons/` | Loading skeleton placeholders |
| `src/types/` | TypeScript definitions |

### Core Patterns

- **Data fetching** — All API calls go through `src/lib/data/*.ts`. Every call wraps with `getAuthHeaders()` + `getCacheOptions()`. Never call SDK directly from components
- **Cart lifecycle** — `getOrSetCart()` → `addToCart()` → `placeOrder()`. Region-aware via `updateRegion()`. Cart ID persisted in cookies via `getCartId()`/`setCartId()`
- **Product pricing** — `getProductPrice()` → `getPricesForVariant()` → `convertToLocale()`. Variant prices fetched separately from listings. Discounts via `getPercentageDiff()`
- **CMS pages** — Dynamic via `retrievePageBySlug()`. Policies (privacy, terms, shipping, returns, imprint) follow the same pattern
- **Checkout** — Multi-step: Addresses → Shipping → Payment. Payment abstracted behind `isManual()`/`isStripeLike()` checks. Stripe wrapper for card payments, express checkout option
- **Locale** — The language is in the URL, Shopify-style (`src/lib/i18n/market.ts`): `/hu` is Hungary in its own language (`hu-HU`; `at` → `de-AT`, `de` → `de-DE`, others English), `/en-hu` and `/de-hu` are Hungary in English and German. `/hu-hu` 308-redirects to `/hu`. The proxy rewrites `/en-hu/...` to the `[countryCode]` route for `hu` and passes the locale and prefix as request headers, so `params.countryCode` is always the bare country (prices, region, cart) and `getLocale()` returns the URL's language. Build links with `LocalizedClientLink` / `useMarketPrefix()` (client) or `getMarketPrefix(countryCode)` (server), never `/${countryCode}`, or the visitor drops back to the market's own language. The language selector saves the `_medusa_locale` cookie (used only to pick the prefix when someone opens `/`) and reloads the page under the new prefix with `goToMarket()`; the country selector keeps the current language. Canonicals, hreflang (`en-HU`, `hu-HU`, `de-HU`, …) and the sitemap list every language of every market. `npx tsx src/lib/i18n/market.test.ts` covers the URL rules. `getLocaleHeader()` sends the locale to Medusa, except English, which is the products' own text
- **Team cards** — `/team/<name>` is a team member's digital business card, the page behind a printed QR code (today only `/team/martin-wolf`). It is one fixed address outside the markets, always German, and `noindex`. `serveTeamCard()` in `src/proxy.ts` serves it (`isTeamCardPath()`, `src/lib/team/card-path.ts`) before any region lookup, so there is no `/at/team/…` twin and it stays up while the backend is down; it sets the `de-AT` locale header so `<html lang>` and the cookie banner are German. "Kontakt speichern" links to `/team/<name>.vcf`, a route handler (the dot lets it through the proxy untouched) that serves a vCard 3.0 as `text/vcard`. The page and the vCard read one record in `src/lib/team/business-card.ts`; the template is `src/modules/team/templates/business-card`. To add a person: a record there, a `page.tsx` and a `<name>.vcf/route.ts` under `src/app/team/`. `npx tsx src/lib/team/business-card.test.ts` covers the links, the vCard text and the path rule
- **Auth** — `retrieveCustomer()`, login/signup/signout/transferCart. Auth headers on every data call via `getAuthHeaders()`
- **Client links** — a sales rep's job is to bring clients in, so every rep has a link, `<shop>/?ref=CODE`, that works on any page (home, a product, sign-up). Capture happens in `src/proxy.ts`: `proxy()` runs the market routing (`serveRequest()`), then, only for a request with `?ref=`, `referralToRemember()` (`src/lib/util/referral.ts`) decides whether to set the `_sales_rep_ref` cookie (httpOnly, `lax`, 30 days). It asks Medusa whose link the code is (the plugin's public `GET /sales-links/:code`, through `serverBackendUrl()`) and remembers only codes some rep has, so other sites' `?ref=newsletter` stays out; the first link wins while it still leads to a rep, a stale one (new link made, rep deactivated) doesn't block a working one, and a signed-in customer is skipped. The cookie is treated as necessary and is **not** behind the consent banner: it is first-party, holds only a public rep code and exists to credit the visitor's own sign-up. This is the one decision to confirm with a lawyer; the alternative is to set it only after the visitor accepts a category, at the price of crediting fewer clients. `createCustomerAccount()` (`src/lib/data/customer.ts`) is the single place accounts are made, from the sign-up page and from checkout (a business buyer must create one, a private buyer may): it puts the code (a code typed into the sign-up form's "Have a referral code?" field wins over the cookie, and a mistyped one is refused with a message) in the new customer's metadata as `sales_rep_ref` and clears the cookie, one link for one account. The plugin does the rest when it sees `customer.created`: it links the client to the rep at the rep's standard rate, from that day, and only for a new account (never an existing customer, never someone who already ordered or has a rep, never the rep's own account). Checkout creates the account only when the address form sends `customer_type`: the selector is switched off (Business is the default), so its hidden field must stay in the form's live code, or `setAddresses` reads every checkout as a private guest one and creates nothing (`npx tsx src/modules/checkout/components/shipping-address/customer-type-field.test.ts` guards it). A private buyer who checks out as a guest has no account and is not linked. `getReferrer()` (`src/lib/data/referral.ts`) names the rep next to the sign-up form (`@login/page.tsx` also opens the join view first) and in checkout (`ReferrerNotice`, which asks `getReferrerName()` because the cookie is httpOnly). The portal page `(portal)/client-link` ("Bring clients") shows the rep's link and code with copy and email/WhatsApp share buttons, a tool that adds the code to any address of the shop (`linkToPage()`, same host only), the clients who came through the link and how far each has got (registered, ordered, paid), and the rules in plain words. `npx tsx src/lib/util/referral.test.ts` covers the code rules, the cookie rule, the lookup, the page-link tool and the sign-up sentences
- **Sales portal** — `/[countryCode]/sales-portal` is the commission portal for sales reps (Medusa `sales_rep` actor, from `medusa-plugin-sales-commission`). The rep's JWT has its own cookie (`_sales_rep_jwt`, `getSalesRepAuthHeaders()`) and is never mixed with the customer's. Reads go through `src/lib/data/sales-portal.ts` (always `no-store`; 401/403/404 become `signed_out`/`no_access`/`not_found` results, not thrown errors); sign-in and password reset are server actions in `sales-portal-actions.ts` that reuse the customer `Login`/`ForgotPassword`/`ResetPassword` components through their optional props. The `(portal)` layout renders the sign-in form while nobody is signed in, and every page also checks its own result, because a layout is not re-run on client-side navigation. Everything under it is `noindex` and disallowed in `robots.ts`. Reps get access from the Medusa admin (Sales Reps → Portal access) or by being approved as a recruit; there is no sign-up. The overview shows four cards per currency (pending, earned this month, payable with the next payout day, paid this year), then the month's statement with a running balance and a status pill per line (pending, earned, payable, reversed, adjustment, paid). **Recruits** (`(portal)/recruits`) lets a rep invite by email, send an invitation again or withdraw it, and lists recruits with the Level 2 they earn, never their clients. **Join** (`sales-portal/join/[token]`, outside the `(portal)` group because it needs no sign-in) is the candidate's page: the link is the credential, `?lang=` opens it in the language of the invitation email, and the application form keeps what was typed when the server refuses it. The recruiting server actions use plain `fetch` (not `sdk.client.fetch`) because they need the `code` of a failed response, which the SDK drops; each code maps to a `salesPortal.error.<code>` sentence. Portal text goes through `getPortalTranslator()` (`t(key, { name })` fills `{name}` placeholders). `npx tsx src/modules/sales-portal/lib/dictionary.test.ts` checks that every key the portal's code names exists in all four languages with the same placeholders. The plugin's routes (`/sales-portal/*`, `/sales-invites/*`) are not among the paths Nginx sends to Medusa on the public domain, so the portal's server calls (`portalSdk` in `src/lib/config.ts`, `backendRequest` in the actions) use `serverBackendUrl()` (`src/lib/util/backend-url.ts`): `MEDUSA_BACKEND_URL` if set, else `NEXT_PUBLIC_MEDUSA_BACKEND_URL`. On the VPS set `MEDUSA_BACKEND_URL=http://localhost:9000`. Without it the profile call gets a storefront 404 page, the layout says "This page couldn't be loaded", and the log shows `Unexpected token '<'` for `/sales-portal/payouts` (the storefront has a page with that name). Sign-in and password reset use `sdk` over `/auth`, which the public address does route. `npx tsx src/lib/util/backend-url.test.ts` covers the address choice
- **Bot protection** — Cloudflare Turnstile guards the contact, notify-me, register, sign-in and forgot-password forms (the sales rep sign-in and forgot-password share the customer components). `TurnstileWidget` (`src/modules/common/components/turnstile-widget`) goes inside a `<form>` and adds a hidden `cf-turnstile-response` field; it is invisible unless Cloudflare needs a click, resets after every submit (a token is single-use) and renders nothing without `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. That key is baked in at build time and `env` in `next.config.js` makes the server read the same build-time value, so the server and the browser always agree: set it before `next build`, and a value set only at runtime is ignored. The production key is committed in `.env.production` (public; Next reads that file for builds but not for `yarn dev`, so local development stays off), which leaves only the secret to add on the server; to build locally without the widget run `NEXT_PUBLIC_TURNSTILE_SITE_KEY= yarn build`. The account forms are checked in their server actions through `turnstileError(formData)` (`src/lib/data/turnstile.ts`, secret `TURNSTILE_SECRET_KEY`); contact and notify-me send the token as the `x-turnstile-token` header and the Medusa backend checks it (a 403 means "verification failed"). Both checks switch off without keys, let a submission through (and log) when Cloudflare cannot be reached, and never verify the same token twice. Refusals are logged too, as `[turnstile] rejected (token sent|no token): <codes>` (never the token), so a misconfiguration that refuses every visitor shows up in the logs. `createCustomerAccount` is deliberately unprotected because checkout calls it, and Medusa's `/auth/*` routes are not behind the check. `npx tsx src/lib/util/turnstile.test.ts` covers the verification core and the translations. Cloudflare's test keys let you try it locally: site `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` passes, secret `2x0000000000000000000000000000000AA` fails, site `3x00000000000000000000FF` forces a visible challenge.

## Memory

A knowledge corpus `infinytree-architecture` is maintained in claude-mem covering this storefront's architecture. Rebuild after significant changes.
