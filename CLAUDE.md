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
| `src/modules/skeletons/` | Loading skeleton placeholders |
| `src/types/` | TypeScript definitions |

### Core Patterns

- **Data fetching** — All API calls go through `src/lib/data/*.ts`. Every call wraps with `getAuthHeaders()` + `getCacheOptions()`. Never call SDK directly from components
- **Cart lifecycle** — `getOrSetCart()` → `addToCart()` → `placeOrder()`. Region-aware via `updateRegion()`. Cart ID persisted in cookies via `getCartId()`/`setCartId()`
- **Product pricing** — `getProductPrice()` → `getPricesForVariant()` → `convertToLocale()`. Variant prices fetched separately from listings. Discounts via `getPercentageDiff()`
- **CMS pages** — Dynamic via `retrievePageBySlug()`. Policies (privacy, terms, shipping, returns, imprint) follow the same pattern
- **Checkout** — Multi-step: Addresses → Shipping → Payment. Payment abstracted behind `isManual()`/`isStripeLike()` checks. Stripe wrapper for card payments, express checkout option
- **Locale** — Country-code routing via `getCountryCode()` middleware. Locale cookie via `setLocaleCookie()`. Header extraction via `getLocaleHeader()`
- **Auth** — `retrieveCustomer()`, login/signup/signout/transferCart. Auth headers on every data call via `getAuthHeaders()`

## Memory

A knowledge corpus `infinytree-architecture` is maintained in claude-mem covering this storefront's architecture. Rebuild after significant changes.
