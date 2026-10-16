# Turnstile spam protection for public forms

**Date:** 2026-10-08
**Status:** Draft for review
**Repos touched:** `infinytree-storefront` (this repo) and `infiniytree-backend` (a separate git repo, so two changes)

## Goal

Stop bots from abusing the shop's public forms with Cloudflare Turnstile: free, no cap on verifications, set up once. Real visitors see nothing unless Cloudflare decides it needs a click.

From the request: free of cost and one-time (no recurring fee, nothing to renew), Turnstile rather than reCAPTCHA, covering the contact form and the other forms that can be abused.

## Decisions already made

- **Scope:** contact, notify-me, register, login and forgot-password. The sales-rep sign-in and forgot-password come with them because they share the same components.
- **Approach:** verify each form where its submission enters the system (not everything in Medusa).
- **If Cloudflare's check can't be reached:** let the submission through and log it (fail open), as the VAT lookup does.
- **Widget:** one hand-written component, no new dependency.

## Findings that shape the design

- No captcha code exists in the storefront, backend or sales-commission plugin.
- The repo's `deploy/` folder assumes Cloudflare is in front (Cloudflare-only Nginx allowlist), so a Cloudflare account exists. Turnstile works with or without proxying.
- Contact and notify-me are called by the browser straight at Medusa (`sdk.client.fetch`), so only the backend can verify them. Each request sends a real email through Resend to the shop. The contact route has no rate limit. Notify-me limits per email address in memory, which a bot sidesteps by changing the address.
- Register, login and forgot-password are Next.js server actions in `src/lib/data/customer.ts`.
- The sales portal reuses the `Login` and `ForgotPassword` components with its own actions (`salesRepLogin`, `requestSalesRepPasswordReset` in `src/lib/data/sales-portal-actions.ts`).
- Nginx forwards `/store` and `/auth` to Medusa on the public domain.
- A Turnstile token is single-use and expires after 300 seconds, so each token is verified once, in one place.
- The storefront sets no Content-Security-Policy header.
- Notify-me renders in two places (`product-actions/index.tsx` and `product-actions/mobile-actions.tsx`), only when the selected variant is out of stock, and remounts when the variant changes (`key={variant.id}`).

## Scope

**In:** contact, notify-me, register, login, forgot-password, sales-rep sign-in, sales-rep forgot-password.

**Out:**
- Reset-password forms: the emailed link is the credential.
- Checkout, including the optional account creation there (`setAddresses` calls `createCustomerAccount`).
- Profile and address forms (signed in), the discount-code form.
- Sales-portal join and recruit-invite forms.
- The newsletter form: it is a stub that fakes success after one second and never sends the email anywhere. Nothing arrives to protect yet; wiring it up is a separate piece of work.
- Cloudflare dashboard toggles (Bot Fight Mode, rate limiting), a CSP, and any legal review.

## Approach

| Form | Submitted via | Token travels as | Verified in |
|---|---|---|---|
| Contact | browser → Medusa `POST /store/contact` | header `x-turnstile-token` | backend middleware |
| Notify-me | browser → Medusa `POST /store/notify-me` | header `x-turnstile-token` | backend middleware |
| Register, login, forgot password | browser → Next.js server action | form field `cf-turnstile-response` | the server action |
| Sales-rep sign-in, forgot password | browser → Next.js server action | form field `cf-turnstile-response` | the server action |

One Cloudflare widget (one site key) serves every form.

**Rejected alternatives**
- *Verify everything in Medusa, including `/auth/customer/emailpass*`:* leaves no way around the widget, but the SDK's auth methods take no headers (the token would ride in the body), checkout creates accounts through the same register route with no widget and would need a server-to-server bypass secret, and a middleware bug would lock every customer out of sign-in.
- *A React wrapper library (`@marsidev/react-turnstile`):* a new dependency for about 60 lines of code.
- *A honeypot field:* redundant next to Turnstile.
- *Cloudflare Bot Fight Mode as the main defence:* cannot be exempted by WAF rules and may challenge API traffic, so it could hit payment webhooks.

## Cloudflare setup (owner, in the dashboard)

Turnstile → Add widget: name "Infinytree forms", hostnames = the production domain(s) (apex and `www` if both serve forms) and any staging domain, Widget Mode **Managed**, pre-clearance off. Copy the site key and the secret key. Free plan limits: unlimited verifications, 20 widgets, 10 hostnames per widget, 7 days of analytics.

## Storefront changes (`infinytree-storefront`)

### 1. `src/lib/util/turnstile.ts` — verification core (pure, no `server-only`, so `npx tsx` can test it)

```ts
export type TurnstileOutcome =
  | { status: "skipped" }                      // no secret configured: feature off
  | { status: "passed" }
  | { status: "rejected"; codes: string[] }    // the visitor's token is missing, invalid, expired or reused
  | { status: "unavailable"; reason: string }  // Cloudflare unreachable, or our own configuration is wrong

export async function verifyTurnstile(
  token: unknown,
  options: {
    secret?: string
    ip?: string | null
    timeoutMs?: number          // default 10000
    fetchImpl?: typeof fetch    // default global fetch
  }
): Promise<TurnstileOutcome>
```

Rules, in order:

1. No `secret` (undefined or empty) → `skipped`, no network call.
2. `token` is not a non-empty string, or is longer than 2,048 characters → `rejected` with code `missing-input-response`, no network call.
3. POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, form-encoded: `secret`, `response`, and `remoteip` only when `ip` is set. Abort after `timeoutMs`.
4. A network error, a timeout, or a body that is not JSON with a boolean `success` → `unavailable`. The HTTP status is not consulted: Cloudflare documents the body, not the status.
5. `success: true` → `passed`.
6. `success: false`: if any code is `missing-input-secret`, `invalid-input-secret`, `bad-request` or `internal-error` → `unavailable` (our configuration or Cloudflare is at fault, not the visitor). Otherwise → `rejected` with the codes (`missing-input-response`, `invalid-input-response`, `timeout-or-duplicate`, or anything unlisted).

### 2. `src/lib/data/turnstile.ts` — server wrapper (`import "server-only"`, not a `"use server"` file, so it is not callable from the browser)

```ts
export async function turnstileError(formData: FormData): Promise<string | null>
```

Returns `null` when the submission may go ahead, otherwise the translated `turnstile.failed` message.

- Secret from `process.env.TURNSTILE_SECRET_KEY`. If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, return `null` (feature off): this stops a secret without a shipped widget from locking everyone out.
- Token from `formData.get("cf-turnstile-response")`. Visitor IP from `(await headers()).get("cf-connecting-ip")`.
- `rejected` → `translate("turnstile.failed", await getLocale())`, imported the way `localize-error.ts` does. `unavailable` → `console.warn("[turnstile] verification unavailable:", reason)` and return `null`.

### 3. Server actions

Add as the first statements of `signup`, `login`, `requestPasswordReset` (`src/lib/data/customer.ts`) and `salesRepLogin`, `requestSalesRepPasswordReset` (`src/lib/data/sales-portal-actions.ts`):

```ts
const blocked = await turnstileError(formData)
if (blocked) return blocked
```

Not in `createCustomerAccount`: checkout calls it and has no widget.

### 4. `src/modules/common/components/turnstile-widget/index.tsx` — client component

- Reads `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; renders nothing when unset.
- Loads `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` once through a module-level promise. If the script fails to load, the promise is cleared (a later mount can retry) and the component shows `t("turnstile.unavailable")` through the shared `ErrorMessage` (`role="alert"`).
- Renders into its own container with `{ sitekey, appearance: "interaction-only", size: "flexible", theme: "light", language, "refresh-expired": "auto", "error-callback": show the unavailable message }`. `language` is the first subtag of the active locale (`en`, `de`, `hu`); all three are on Cloudflare's supported list.
- The widget adds a hidden input `cf-turnstile-response` to the enclosing form by default, so the form's `FormData` carries the token. If, during implementation, the input does not appear for explicit rendering, the component keeps its own hidden input and fills it from the widget's `callback`.
- Resets itself after every submit of its form, because the token is spent whatever the outcome: a `submit` listener on the closest form calls `setTimeout(() => turnstile.reset(widgetId), 0)`. The timeout matters: the form's own submit handling reads the token first.
- On unmount (including React StrictMode's double mount and notify-me's per-variant remount) it calls `turnstile.remove(widgetId)` and removes the listener. If it unmounts before the script resolves, it renders nothing.
- `data-testid="turnstile-widget"` on the container.

### 5. Forms

Place `<TurnstileWidget />` inside each `<form>`, after the fields and before the error message and submit button: `register/index.tsx`, `login/index.tsx` and `forgot-password/index.tsx` under `src/modules/account/components/`, plus the contact and notify-me forms below. The sales portal needs no page changes because it uses the shared components.

- **Contact** (`src/modules/contact/components/contact-form/index.tsx`): read `formData.get("cf-turnstile-response")` and, when present, pass `headers: { "x-turnstile-token": token }` to `sdk.client.fetch("/store/contact", …)`. In the `catch`, check first for `err.status === 403` and show `t("turnstile.failed")`.
- **Notify-me** (`src/modules/products/components/notify-me-form/index.tsx`): same, using `new FormData(e.currentTarget)`; the 403 branch goes before the existing 429 branch. Each rendered instance (desktop and mobile) has its own widget.

### 6. Translations

Two new keys, appended as a `turnstile.*` group at the end of `src/i18n/dictionaries/en.json`, `de-DE.json`, `de-AT.json` and `hu-HU.json`:

| Key | en | de-DE and de-AT | hu-HU |
|---|---|---|---|
| `turnstile.failed` | Verification failed. Please try again. | Die Überprüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut. | Az ellenőrzés sikertelen volt. Kérjük, próbálja újra. |
| `turnstile.unavailable` | The verification could not be loaded. Turn off content blockers for this site and try again, or contact us directly. | Die Überprüfung konnte nicht geladen werden. Deaktivieren Sie Inhaltsblocker für diese Website und versuchen Sie es erneut, oder kontaktieren Sie uns direkt. | Az ellenőrzés nem tölthető be. Kapcsolja ki a tartalomblokkolókat ezen az oldalon, és próbálja újra, vagy vegye fel velünk közvetlenül a kapcsolatot. |

(de-AT currently mirrors de-DE for shared strings; it gets the same text.)

### 7. Environment and docs

`.env.template` gains:

```
# Cloudflare Turnstile spam protection. Leave both empty to switch it off.
# Site key: public, baked into the build, so rebuild after changing it.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# Secret key: server-only. Never prefix it with NEXT_PUBLIC_.
TURNSTILE_SECRET_KEY=
```

`CLAUDE.md` gets a Turnstile paragraph under Core Patterns: where each form is checked, the env vars, the test command.

## Backend changes (`infiniytree-backend`)

### 1. `src/utils/turnstile.ts`

The same `verifyTurnstile` contract and rules as the storefront core (a copy: the repos are separate), plus the middleware:

```ts
export async function requireTurnstile(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void>
```

- Secret from `process.env.TURNSTILE_SECRET_KEY`, read per request. Token from the `x-turnstile-token` header (first value if it arrives as an array). IP from `cf-connecting-ip`.
- `rejected` → `res.status(403).json({ type: "not_allowed", message: "Verification failed" })`. The storefront forms map status 403 to the translated message; the English text is for other callers.
- `unavailable` → `warn` through the container logger (`req.scope.resolve("logger")`) with the reason, then `next()`.
- `passed` and `skipped` → `next()`.

### 2. Registration

Put `requireTurnstile` first in the `middlewares` array in `src/api/store/contact/middlewares.ts` and `src/api/store/notify-me/middlewares.ts`, ahead of `validateAndTransformBody(...)`, so bots are turned away before any other work. The custom header must pass Medusa's CORS handling in local development (storefront on :8000, Medusa on :9000); `x-publishable-api-key` and `x-medusa-locale` already do, and implementation confirms the new one.

### 3. Environment and docs

`.env.template` gains `TURNSTILE_SECRET_KEY=` with the comment "Cloudflare Turnstile secret key, the same widget as the storefront. Leave empty to switch the check off." `CLAUDE.md` gets a matching paragraph.

## Verification outcomes

| Outcome | Meaning | Storefront server action | Backend middleware |
|---|---|---|---|
| skipped | no secret configured (or, in the storefront, no site key) | proceed | proceed |
| passed | Cloudflare confirmed the token | proceed | proceed |
| rejected | `missing-input-response`, `invalid-input-response`, `timeout-or-duplicate`, or `success: false` with any other code | return `turnstile.failed` | 403 |
| unavailable | network error, timeout, unparseable response, or `missing-input-secret` / `invalid-input-secret` / `bad-request` / `internal-error` | proceed and log | proceed and log |

A visitor cannot cause `unavailable`, which is why failing open there is safe.

## Rollout and rollback

1. Create the widget in Cloudflare and copy the keys.
2. **Backend:** deploy the code. With no secret set it passes everything through, so nothing changes for visitors.
3. **Storefront:** the production site key is committed in `.env.production`, so the build picks it up by itself. Add `TURNSTILE_SECRET_KEY` to the server's `.env`, rebuild, deploy. The widgets go live and the five server actions start enforcing. The site key is baked into the build, and a value set only at runtime is ignored (the check stays off until the next build). **Check it** on every production hostname: sign in with a wrong password. You must get the normal "Invalid email or password", not "Verification failed". A hostname missing from the widget's hostname list shows the "could not be loaded" message under the form.
4. **Backend:** set `TURNSTILE_SECRET_KEY`, restart. Contact and notify-me start enforcing. This goes last: from here on the storefront must already be sending tokens. **Check it:** send one real message through the contact form.
5. In the admin, add a sentence about Cloudflare Turnstile to the privacy policy page and have the wording reviewed.
6. Watch the logs for `[turnstile]` lines for a few days. On both servers a refusal is logged as `rejected (no token)` or `rejected (token sent)`, followed by Cloudflare's error codes, and never the token. `rejected (no token)` on every submission means the widget is not producing tokens (hostname missing from the widget, a blocker, or a site key that was not in the build). `rejected (token sent): invalid-input-response` on every submission means the site key and the secret belong to different widgets, or a test key is paired with a real secret. `verification unavailable` means Cloudflare could not be reached or the secret is wrong; submissions are let through meanwhile.

**Rollback:** unset `TURNSTILE_SECRET_KEY` on the backend and/or storefront and restart. The widgets can stay. Switching the storefront off needs a rebuild without the site key (`NEXT_PUBLIC_TURNSTILE_SITE_KEY= yarn build` overrides `.env.production`); unset the backend secret first (or together), because the backend would otherwise refuse every contact and notify-me message once no widget sends a token any more.

**Local development:** with no keys the feature is off. To exercise it, use Cloudflare's published test pair: site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` (always passes) or secret `2x0000000000000000000000000000000AA` (always fails). Test and real keys must not be mixed: test secrets accept only the dummy token and real secrets reject it.

## Testing

- **Backend, `src/utils/__tests__/turnstile.unit.spec.ts`, run with `yarn test:unit`:**
  - skipped with no secret, and no fetch call;
  - rejected for a missing, empty or oversized token, with no fetch call;
  - passed, asserting the URL and the form-encoded `secret`, `response` and `remoteip` (only when given);
  - rejected for `invalid-input-response` and `timeout-or-duplicate`;
  - unavailable for a thrown fetch, a timeout, an HTML or non-JSON body, and each of the four configuration or Cloudflare codes;
  - the middleware: 403 and body on rejected, `next()` on the other three outcomes (with a log on unavailable), and header extraction including an array header.
- **Storefront, `src/lib/util/turnstile.test.ts`, run with `npx tsx src/lib/util/turnstile.test.ts` in the repo's tiny-harness style:** the same core cases, plus a check that `turnstile.failed` and `turnstile.unavailable` exist and are non-empty in all four dictionaries.
- **Manual, with Cloudflare's test keys:** each of the seven forms with always-pass; always-fail shows the translated message and the widget resets; no keys leaves every form as it is today; the hidden `cf-turnstile-response` input is present in the form; notify-me works in both its desktop and mobile placements; a blocked script shows the unavailable message.
- Existing e2e specs (`e2e/tests/public/login.spec.ts`, `register.spec.ts`) run with no keys and are unchanged. No new e2e and no new Medusa HTTP integration test (it would need a database and mocks for Resend and Cloudflare; the middleware's unit tests carry the logic).
- `yarn lint` and `yarn build` in the storefront; `yarn build` and `yarn test:unit` in the backend.

## Security and privacy notes

- The secret never reaches the browser: it has no `NEXT_PUBLIC_` prefix and the storefront wrapper is `server-only`.
- No layer verifies the same token twice: contact and notify-me are verified only in the backend, the account forms only in the storefront.
- `cf-connecting-ip` is trusted only because the VPS accepts traffic from Cloudflare's ranges only (`deploy/`). It is an optional hint to Cloudflare, so a spoofed value has little effect.
- The widget script loads only on pages that render a protected form, not site-wide.
- **Consent:** the script deliberately does not wait for the cookie banner. Bots never answer banners, and gating it would break the forms for visitors who decline. Third-party sources lean towards treating Turnstile as strictly necessary, but the position is not settled and none of them is Cloudflare or a regulator. Name Turnstile in the privacy policy and have the wording reviewed.
- If a CSP is added later, allow `https://challenges.cloudflare.com` in `script-src`, `frame-src` and `connect-src`.

## Known limits

- `/auth/*` is reachable directly: a bot that skips the website can still call login, register and reset on Medusa without a token. Closing that means verifying in Medusa and giving checkout a bypass; it is left for a later change. Because tokens are single-use, that change would turn the storefront actions from verifiers into forwarders.
- Checkout's optional account creation has no widget.
- The contact route still has no rate limit, and notify-me keeps its in-memory per-email limit.
- A visitor whose blocker stops `challenges.cloudflare.com` cannot submit the protected forms until they allow it; the form says so.
- The Cloudflare dashboard toggles stay optional extras. Bot Fight Mode cannot be exempted by WAF rules and may challenge API traffic, so test it against payment webhooks first. Free rate limiting is one rule with a 10-second window.

## Refinements made while writing this spec (please check)

1. The "script blocked" message says "contact us directly" instead of naming an email address, so no address is hard-coded into four dictionaries. The conversation said it would point to your email.
2. A wrong or missing secret reported by Cloudflare (`invalid-input-secret`, `missing-input-secret`) counts as `unavailable`: submissions pass and an error is logged, rather than locking every customer out of sign-in over a typo.
3. The storefront check skips when the site key is unset, even if the secret is set, so a half-configured deploy cannot lock customers out.
4. In the backend, the Turnstile check runs before body validation.
5. In the rollout, the backend secret is set last.
6. The German and Hungarian strings are my translations; please proofread them.
