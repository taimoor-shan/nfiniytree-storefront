# Turnstile Spam Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the contact, notify-me, register, sign-in and forgot-password forms (shop customers and sales reps) with Cloudflare Turnstile, verified on the server and switched on by environment variables.

**Architecture:** A hand-written `TurnstileWidget` sits inside each protected form and adds a hidden `cf-turnstile-response` field. Contact and notify-me send that token to Medusa in an `x-turnstile-token` header, where a middleware checks it with Cloudflare; the account forms are checked in their Next.js server actions. Both checks use one contract (skipped, passed, rejected, unavailable) and switch off when no keys are set.

**Tech Stack:** Next.js 16.2 (App Router, server actions), React 19.2, Medusa 2.18 (Express middleware), Cloudflare Turnstile free tier, jest with `@swc/jest` (backend), `npx tsx` tiny-harness tests (storefront).

**Spec:** [docs/superpowers/specs/2026-10-08-turnstile-spam-protection-design.md](../specs/2026-10-08-turnstile-spam-protection-design.md). Read it first; this plan implements it.

**Two repos, two branches.** The storefront and the backend are separate git repos. Tasks 1-2 are in the backend, Tasks 3-8 in the storefront. Each repo gets a branch named `feat/turnstile-spam-protection`. Nothing is pushed.

- Backend: `/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend` (the folder really is spelled `infiniytree`)
- Storefront: `/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront`

## Global Constraints

- Cost: Cloudflare Turnstile free plan only. No paid service and no new npm or Yarn dependency (the widget is hand-written).
- Cloudflare check: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, form-encoded `secret`, `response`, and `remoteip` only when known; 10-second timeout; a token longer than 2,048 characters is rejected locally.
- Names: header `x-turnstile-token`; form field `cf-turnstile-response`; env `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (storefront) and `TURNSTILE_SECRET_KEY` (storefront server and backend). The secret never gets a `NEXT_PUBLIC_` prefix.
- Outcomes: `skipped` (no secret; in the storefront also no site key), `passed`, `rejected` (`missing-input-response`, `invalid-input-response`, `timeout-or-duplicate`, or any other code), `unavailable` (network error, timeout, unparseable reply, or `missing-input-secret` / `invalid-input-secret` / `bad-request` / `internal-error`). `unavailable` lets the submission through and logs it.
- Rejection: the backend answers `403 { "type": "not_allowed", "message": "Verification failed" }`; storefront actions return the translated `turnstile.failed`; the contact and notify-me forms map status 403 to `turnstile.failed`.
- Widget options: `appearance: "interaction-only"`, `size: "flexible"`, `theme: "light"`, `language` = first subtag of the locale (`en`, `de`, `hu`), `refresh-expired: "auto"`.
- A token is verified once, in one place: contact and notify-me in the backend only, the account forms in the storefront only. `createCustomerAccount` is never protected (checkout uses it).
- Translations: `turnstile.failed` and `turnstile.unavailable` in `en`, `de-DE`, `de-AT` and `hu-HU`.
- Tests: backend `yarn test:unit` (jest, `*.unit.spec.ts` under `__tests__`); storefront `npx tsx` with the tiny harness. Both repos already have unrelated type errors, so type checks are filtered to the files a task touches. ESLint has one unrelated warning in `customer.ts` (`'customer' is defined but never used`).
- Commits: conventional style (`feat(turnstile): ...`), each ending with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Nothing is pushed.
- Cloudflare's published test keys, used for every local check. Pair test site keys with test secrets only; real keys and test keys do not mix.

| Mode | Site key | Secret key |
|---|---|---|
| Silent pass | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` (always passes) |
| Always fail | `1x00000000000000000000AA` | `2x0000000000000000000000000000000AA` (always fails) |
| Forced challenge | `3x00000000000000000000FF` | `1x0000000000000000000000000000000AA` |
| Off | none | none |

## Review Focus

The spec implies these failure modes but no automated test reaches them; each is pinned by a manual check in the task that owns the code.

1. **Retry after a failed submit** (wrong password, validation error): the form must submit again a few seconds later, because the widget hands out a fresh token after every submit. Pinned in Task 6 (Check C) and Task 7 (Check B).
2. **Submitting before the silent challenge finishes** (autofill then Enter right after load): the visitor sees the verification-failed message once and the next try works; no crash, no stuck spinner. Pinned in Task 6 (Check D).
3. **Cloudflare's script blocked or failing to load** (privacy extensions, corporate filters): the form still renders and says what to do. Pinned in Task 6 (Check E).
4. **Two notify-me forms on one page** (desktop block and mobile bar) and variant switches: each form has exactly one widget and its own token, and remounting leaves no orphans. Pinned in Task 7 (Check C).
5. **Half-configured environment** (secret without site key, or site key without secret): never locks anyone out; no keys at all leaves every form as it is today. Pinned in Task 5 (Check B) and Task 8; the backend side is covered by Task 2's unit test for "no secret configured".

## File Structure

| File | Repo | Responsibility |
|---|---|---|
| `src/utils/turnstile.ts` | backend | `verifyTurnstile` core and the `requireTurnstile` Medusa middleware |
| `src/utils/__tests__/turnstile.unit.spec.ts` | backend | jest tests for both |
| `src/api/store/contact/middlewares.ts`, `src/api/store/notify-me/middlewares.ts` | backend | run `requireTurnstile` before body validation |
| `.env.template`, `CLAUDE.md` | backend | document `TURNSTILE_SECRET_KEY` and the pattern |
| `src/lib/util/turnstile.ts` | storefront | the same pure `verifyTurnstile` core (testable with `npx tsx`) |
| `src/lib/util/turnstile.test.ts` | storefront | tests for the core and the translations |
| `src/lib/data/turnstile.ts` | storefront | server wrapper `turnstileError(formData)` |
| `src/modules/common/components/turnstile-widget/index.tsx` | storefront | the client widget |
| `src/lib/data/customer.ts`, `src/lib/data/sales-portal-actions.ts` | storefront | five actions call `turnstileError` first |
| `login`, `register`, `forgot-password` components; `contact-form`; `notify-me-form` | storefront | place the widget; contact and notify-me send the header |
| `src/i18n/dictionaries/{en,de-DE,de-AT,hu-HU}.json` | storefront | two new keys each |
| `.env.template`, `CLAUDE.md` | storefront | document the keys and the pattern |

## Manual-check setup

Used by Tasks 2, 5, 6, 7 and 8.

- Start the backend (every storefront page needs it): `cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn dev` (port 9000). Where a task names a Mode, start it with that Mode's secret in front, for example `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA yarn dev`.
- Start the storefront with the Mode's two keys in front, for example for Silent pass: `cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA yarn dev` (port 8000). Off means a plain `yarn dev`. Next bakes `NEXT_PUBLIC_*` values in when it compiles, so changing a key means stopping and restarting the dev server.
- Open pages as `http://localhost:8000/<region>/...`, for example `/hu/account`. The page language follows the region and locale cookie, so the message you expect is the `turnstile.failed` or `turnstile.unavailable` text in that language.
- Never send a real contact or notify-me message: both routes email the shop through Resend. Use input that fails validation (steps say how) to prove the Turnstile check passed.
- Stop both servers when a task's checks are done. If the backend cannot start in this environment (database, Redis), say so in the task report, skip that task's manual checks, and rely on the automated ones.

---

### Task 1: Backend verification core

**Repo:** backend.

**Files:**
- Create: `src/utils/turnstile.ts`
- Test: `src/utils/__tests__/turnstile.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (Task 2 builds on these, exact names):
  ```ts
  export type TurnstileOutcome =
    | { status: "skipped" }
    | { status: "passed" }
    | { status: "rejected"; codes: string[] }
    | { status: "unavailable"; reason: string }
  export type VerifyTurnstileOptions = {
    secret?: string
    ip?: string | null
    timeoutMs?: number
    fetchImpl?: typeof fetch
  }
  export async function verifyTurnstile(token: unknown, options: VerifyTurnstileOptions): Promise<TurnstileOutcome>
  ```

- [ ] **Step 1: Start the branch**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && git status --short && git checkout -b feat/turnstile-spam-protection
```

Expected: `git status --short` prints nothing (clean tree), then `Switched to a new branch 'feat/turnstile-spam-protection'`. If the tree is not clean, stop and report: there is unrelated work in it.

- [ ] **Step 2: Write the failing test**

Create `src/utils/__tests__/turnstile.unit.spec.ts`:

```ts
import { verifyTurnstile } from "../turnstile"

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type Call = { url: string; body: URLSearchParams }

/** A fetch that records what it was asked and answers with `reply`. */
function fakeFetch(reply: () => Promise<unknown>) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body as URLSearchParams })
    return reply()
  }) as unknown as typeof fetch

  return { fetchImpl, calls }
}

/** Cloudflare answering with a JSON body. */
const cloudflareSays = (body: unknown) => async () => ({
  json: async () => body,
})

describe("verifyTurnstile", () => {
  it("is skipped without a secret and never calls Cloudflare", async () => {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))

    expect(
      await verifyTurnstile("token", { secret: undefined, fetchImpl })
    ).toEqual({ status: "skipped" })
    expect(await verifyTurnstile("token", { secret: "", fetchImpl })).toEqual({
      status: "skipped",
    })
    expect(calls).toHaveLength(0)
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a number", 42],
    ["a token over 2,048 characters", "x".repeat(2049)],
  ])("rejects %s without calling Cloudflare", async (_label, token) => {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))

    expect(await verifyTurnstile(token, { secret: "s", fetchImpl })).toEqual({
      status: "rejected",
      codes: ["missing-input-response"],
    })
    expect(calls).toHaveLength(0)
  })

  it("passes a token Cloudflare accepts and sends the secret, token and visitor IP", async () => {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))

    const outcome = await verifyTurnstile("the-token", {
      secret: "the-secret",
      ip: "203.0.113.7",
      fetchImpl,
    })

    expect(outcome).toEqual({ status: "passed" })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(SITEVERIFY_URL)
    expect(calls[0].body.get("secret")).toBe("the-secret")
    expect(calls[0].body.get("response")).toBe("the-token")
    expect(calls[0].body.get("remoteip")).toBe("203.0.113.7")
  })

  it("leaves out remoteip when there is no visitor IP", async () => {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))

    await verifyTurnstile("t", { secret: "s", ip: null, fetchImpl })

    expect(calls[0].body.has("remoteip")).toBe(false)
  })

  it.each([
    ["invalid-input-response"],
    ["timeout-or-duplicate"],
    ["missing-input-response"],
    ["some-code-nobody-listed"],
  ])("rejects a token Cloudflare refuses with %s", async (code) => {
    const { fetchImpl } = fakeFetch(
      cloudflareSays({ success: false, "error-codes": [code] })
    )

    expect(await verifyTurnstile("t", { secret: "s", fetchImpl })).toEqual({
      status: "rejected",
      codes: [code],
    })
  })

  it("rejects a refusal that names no code", async () => {
    const { fetchImpl } = fakeFetch(cloudflareSays({ success: false }))

    expect(await verifyTurnstile("t", { secret: "s", fetchImpl })).toEqual({
      status: "rejected",
      codes: [],
    })
  })

  it.each([
    ["missing-input-secret"],
    ["invalid-input-secret"],
    ["bad-request"],
    ["internal-error"],
  ])(
    "treats %s as unavailable: our configuration or Cloudflare is at fault, not the visitor",
    async (code) => {
      const { fetchImpl } = fakeFetch(
        cloudflareSays({ success: false, "error-codes": [code] })
      )

      const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

      expect(outcome.status).toBe("unavailable")
    }
  )

  it("treats a network error as unavailable", async () => {
    const { fetchImpl } = fakeFetch(async () => {
      throw new Error("getaddrinfo ENOTFOUND challenges.cloudflare.com")
    })

    expect(await verifyTurnstile("t", { secret: "s", fetchImpl })).toEqual({
      status: "unavailable",
      reason: "getaddrinfo ENOTFOUND challenges.cloudflare.com",
    })
  })

  it("treats a reply that is not JSON as unavailable", async () => {
    const { fetchImpl } = fakeFetch(async () => ({
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0")
      },
    }))

    expect((await verifyTurnstile("t", { secret: "s", fetchImpl })).status).toBe(
      "unavailable"
    )
  })

  it.each([
    ["an empty object", {}],
    ["null", null],
    ["a success that is not a boolean", { success: "yes" }],
  ])("treats %s as unavailable", async (_label, body) => {
    const { fetchImpl } = fakeFetch(cloudflareSays(body))

    expect((await verifyTurnstile("t", { secret: "s", fetchImpl })).status).toBe(
      "unavailable"
    )
  })

  it("treats a request that hangs as unavailable once the timeout passes", async () => {
    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("The operation was aborted"))
        )
      })) as unknown as typeof fetch

    const outcome = await verifyTurnstile("t", {
      secret: "s",
      timeoutMs: 20,
      fetchImpl: hangingFetch,
    })

    expect(outcome.status).toBe("unavailable")
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts
```

Expected: FAIL with `Cannot find module '../turnstile' from 'src/utils/__tests__/turnstile.unit.spec.ts'`.

- [ ] **Step 4: Write the implementation**

Create `src/utils/turnstile.ts`:

```ts
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const MAX_TOKEN_LENGTH = 2048
const DEFAULT_TIMEOUT_MS = 10000

/**
 * Codes that point at our configuration or at Cloudflare rather than at the
 * visitor. Refusing everyone over a mistyped secret would be worse than the
 * spam it stops, so these let the submission through (the caller logs them).
 */
const UNAVAILABLE_CODES = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "bad-request",
  "internal-error",
])

export type TurnstileOutcome =
  /** No secret configured: the feature is off. */
  | { status: "skipped" }
  | { status: "passed" }
  /** The visitor's token is missing, invalid, expired or already used. */
  | { status: "rejected"; codes: string[] }
  /** Cloudflare could not be reached or understood, or our secret is wrong. */
  | { status: "unavailable"; reason: string }

export type VerifyTurnstileOptions = {
  secret?: string
  /** The visitor's IP address, passed to Cloudflare as a hint. */
  ip?: string | null
  /** How long to wait for Cloudflare before giving up. Default 10 seconds. */
  timeoutMs?: number
  /** For tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch
}

/**
 * Asks Cloudflare whether a Turnstile token is genuine. A token can be
 * checked only once, so call this exactly once per submission.
 *
 * The HTTP status is not consulted: Cloudflare documents the JSON body, and a
 * failed check can arrive with a non-200 status.
 */
export async function verifyTurnstile(
  token: unknown,
  {
    secret,
    ip,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
  }: VerifyTurnstileOptions
): Promise<TurnstileOutcome> {
  if (!secret) {
    return { status: "skipped" }
  }

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return { status: "rejected", codes: ["missing-input-response"] }
  }

  const body = new URLSearchParams({ secret, response: token })
  if (ip) {
    body.append("remoteip", ip)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let result: { success?: unknown; "error-codes"?: unknown } | null
  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    })
    result = await response.json()
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }

  if (!result || typeof result.success !== "boolean") {
    return {
      status: "unavailable",
      reason: "unexpected reply from Cloudflare",
    }
  }

  if (result.success) {
    return { status: "passed" }
  }

  const codes = Array.isArray(result["error-codes"])
    ? result["error-codes"].map(String)
    : []
  const problem = codes.find((code) => UNAVAILABLE_CODES.has(code))
  if (problem) {
    return { status: "unavailable", reason: `Cloudflare reported ${problem}` }
  }

  return { status: "rejected", codes }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts
```

Expected: `PASS src/utils/__tests__/turnstile.unit.spec.ts` and a `Tests:` line that reports no failures.

- [ ] **Step 6: Type-check the files this task touched**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/utils/(turnstile|__tests__/turnstile)" || echo "no type errors in the files this task touched"
```

Expected: `no type errors in the files this task touched`. (The repo has unrelated errors elsewhere; only these two files matter.)

- [ ] **Step 7: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && git add src/utils/turnstile.ts src/utils/__tests__/turnstile.unit.spec.ts && git commit -m "feat(turnstile): verify Turnstile tokens with Cloudflare" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Backend middleware, wiring and docs

**Repo:** backend.

**Files:**
- Modify: `src/utils/turnstile.ts`
- Modify: `src/utils/__tests__/turnstile.unit.spec.ts`
- Modify: `src/api/store/contact/middlewares.ts`
- Modify: `src/api/store/notify-me/middlewares.ts`
- Modify: `.env.template`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `verifyTurnstile(token: unknown, options: VerifyTurnstileOptions): Promise<TurnstileOutcome>` from Task 1.
- Produces: `requireTurnstile(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): Promise<void>`. HTTP contract the storefront relies on: the request header `x-turnstile-token`; a refused or missing token gets status `403` with body `{ "type": "not_allowed", "message": "Verification failed" }`.

- [ ] **Step 1: Write the failing middleware tests**

In `src/utils/__tests__/turnstile.unit.spec.ts`, replace the first line

```ts
import { verifyTurnstile } from "../turnstile"
```

with

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireTurnstile, verifyTurnstile } from "../turnstile"
```

and append this to the end of the file:

```ts
describe("requireTurnstile", () => {
  const realFetch = global.fetch
  const logger = { warn: jest.fn() }

  const makeReq = (headers: Record<string, string | string[]> = {}) =>
    ({
      headers,
      scope: { resolve: jest.fn().mockReturnValue(logger) },
    }) as unknown as MedusaRequest

  const makeRes = () => {
    const res = { status: jest.fn(), json: jest.fn() }
    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)
    return res
  }

  /** Makes the global fetch answer like Cloudflare with `body`. */
  const stubGlobalFetch = (body: unknown) => {
    const fetchMock = jest.fn().mockResolvedValue({ json: async () => body })
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "the-secret"
    logger.warn.mockClear()
  })

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY
    global.fetch = realFetch
  })

  it("answers 403 and stops when Cloudflare refuses the token", async () => {
    stubGlobalFetch({ success: false, "error-codes": ["invalid-input-response"] })
    const res = makeRes()
    const next = jest.fn()

    await requireTurnstile(
      makeReq({ "x-turnstile-token": "bad-token" }),
      res as unknown as MedusaResponse,
      next
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      type: "not_allowed",
      message: "Verification failed",
    })
    expect(next).not.toHaveBeenCalled()
  })

  it("answers 403 without calling Cloudflare when the token header is missing", async () => {
    const fetchMock = stubGlobalFetch({ success: true })
    const res = makeRes()
    const next = jest.fn()

    await requireTurnstile(makeReq(), res as unknown as MedusaResponse, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("lets the request through when the token passes", async () => {
    stubGlobalFetch({ success: true })
    const res = makeRes()
    const next = jest.fn()

    await requireTurnstile(
      makeReq({ "x-turnstile-token": "good-token" }),
      res as unknown as MedusaResponse,
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it("lets the request through, untouched, when no secret is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    const fetchMock = stubGlobalFetch({ success: true })
    const res = makeRes()
    const next = jest.fn()

    await requireTurnstile(makeReq(), res as unknown as MedusaResponse, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("lets the request through and logs a warning when Cloudflare is unavailable", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("socket hang up")) as unknown as typeof fetch
    const res = makeRes()
    const next = jest.fn()

    await requireTurnstile(
      makeReq({ "x-turnstile-token": "any-token" }),
      res as unknown as MedusaResponse,
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "[turnstile] verification unavailable: socket hang up"
      )
    )
  })

  it("reads the token and visitor IP from the headers, taking the first value of an array", async () => {
    const fetchMock = stubGlobalFetch({ success: true })

    await requireTurnstile(
      makeReq({
        "x-turnstile-token": ["first-token", "second-token"],
        "cf-connecting-ip": ["203.0.113.9"],
      }),
      makeRes() as unknown as MedusaResponse,
      jest.fn()
    )

    const body = fetchMock.mock.calls[0][1].body as URLSearchParams
    expect(body.get("response")).toBe("first-token")
    expect(body.get("remoteip")).toBe("203.0.113.9")
    expect(body.get("secret")).toBe("the-secret")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts
```

Expected: the `verifyTurnstile` tests still pass; the six `requireTurnstile` tests FAIL with `TypeError: (0 , _turnstile.requireTurnstile) is not a function`.

- [ ] **Step 3: Write the middleware**

In `src/utils/turnstile.ts`, insert this import block as the very first lines of the file (above `const SITEVERIFY_URL =`):

```ts
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

```

Then append this to the end of the file (after `verifyTurnstile`'s closing brace):

```ts

/**
 * Medusa middleware: turns away a request whose Turnstile token Cloudflare
 * refuses. The storefront sends the token in the `x-turnstile-token` header.
 * Does nothing when `TURNSTILE_SECRET_KEY` is not set.
 */
export async function requireTurnstile(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const tokenHeader = req.headers["x-turnstile-token"]
  const ipHeader = req.headers["cf-connecting-ip"]

  const outcome = await verifyTurnstile(
    Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader,
    {
      secret: process.env.TURNSTILE_SECRET_KEY,
      ip: Array.isArray(ipHeader) ? ipHeader[0] : ipHeader,
    }
  )

  if (outcome.status === "rejected") {
    res
      .status(403)
      .json({ type: "not_allowed", message: "Verification failed" })
    return
  }

  if (outcome.status === "unavailable") {
    // A visitor cannot cause this, so let the request through and say so.
    req.scope
      .resolve("logger")
      .warn(`[turnstile] verification unavailable: ${outcome.reason}`)
  }

  next()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts
```

Expected: `PASS src/utils/__tests__/turnstile.unit.spec.ts`, no failures.

- [ ] **Step 5: Run the middleware before body validation on both routes**

Replace the whole of `src/api/store/contact/middlewares.ts` with:

```ts
import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http";
import { requireTurnstile } from "../../../utils/turnstile";
import { ContactSchema } from "./route";

export const contactStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/contact",
    method: "POST",
    // The Turnstile check runs first so bots are turned away before any other work.
    middlewares: [requireTurnstile, validateAndTransformBody(ContactSchema)],
  },
];
```

Replace the whole of `src/api/store/notify-me/middlewares.ts` with:

```ts
import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { requireTurnstile } from "../../../utils/turnstile"
import { NotifyMeSchema } from "./route"

export const notifyMeStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/notify-me",
    method: "POST",
    // The Turnstile check runs first so bots are turned away before any other work.
    middlewares: [requireTurnstile, validateAndTransformBody(NotifyMeSchema)],
  },
]
```

- [ ] **Step 6: Document the secret and the pattern**

In `.env.template`, replace the line

```
# Absolute path for uploaded media. Required in production.
```

with

```
# Cloudflare Turnstile secret key (spam protection on the contact and notify-me forms).
# Use the same widget as the storefront. Leave empty to switch the check off.
TURNSTILE_SECRET_KEY=

# Absolute path for uploaded media. Required in production.
```

In `CLAUDE.md`, insert this section directly above the line `## Upgrade Notes (2.13.6 → 2.17.2)`:

```
## Spam protection (Cloudflare Turnstile)

`POST /store/contact` and `POST /store/notify-me` run `requireTurnstile` (`src/utils/turnstile.ts`) before body validation. The storefront sends the widget's token in the `x-turnstile-token` header; the middleware checks it against Cloudflare's siteverify endpoint with `TURNSTILE_SECRET_KEY` and answers `403 { type: "not_allowed" }` when it is missing, refused, expired or reused.

- No `TURNSTILE_SECRET_KEY` → the check is off (local dev, tests, a half-finished deploy).
- Cloudflare unreachable, slow (10 s) or reporting a bad secret → the request goes through and a `[turnstile]` warning is logged. A visitor cannot cause that.
- Tokens are single-use. The storefront's account-form server actions verify their own tokens, so no token is verified twice. The `/auth/*` routes are not behind this check.
- Tests: `yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts`.
- Cloudflare's test keys let you exercise the flow locally: secret `1x0000000000000000000000000000000AA` always passes, `2x0000000000000000000000000000000AA` always fails (storefront site key `1x00000000000000000000AA`).

```

- [ ] **Step 7: Type-check and run the whole unit suite**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/utils/(turnstile|__tests__/turnstile)|src/api/store/(contact|notify-me)/middlewares" || echo "no type errors in the files this task touched"
```

Expected: `no type errors in the files this task touched`.

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit
```

Expected: every suite passes (`Test Suites: ... passed`, no `failed`). The run also picks up copies under `.kilo/worktrees/`; they are not ours.

- [ ] **Step 8: Smoke-test the real routes (see Manual-check setup)**

Get the publishable key without printing it in the chat, then start the backend with the always-fail secret:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA yarn dev
```

In another terminal:

```bash
PK=$(grep '^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=' "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront/.env.local" | cut -d= -f2)
echo "--- no token ---"
curl -s -i -X POST http://localhost:9000/store/contact -H "content-type: application/json" -H "x-publishable-api-key: $PK" -d '{}' | head -1
curl -s -X POST http://localhost:9000/store/contact -H "content-type: application/json" -H "x-publishable-api-key: $PK" -d '{}'; echo
echo "--- token, but the always-fail secret ---"
curl -s -i -X POST http://localhost:9000/store/notify-me -H "content-type: application/json" -H "x-publishable-api-key: $PK" -H "x-turnstile-token: XXXX.DUMMY.TOKEN.XXXX" -d '{}' | head -1
```

Expected: `HTTP/1.1 403 Forbidden` for the first and third commands and `{"type":"not_allowed","message":"Verification failed"}` for the second.

Restart the backend with `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` and repeat with the token:

```bash
curl -s -i -X POST http://localhost:9000/store/contact -H "content-type: application/json" -H "x-publishable-api-key: $PK" -H "x-turnstile-token: XXXX.DUMMY.TOKEN.XXXX" -d '{}' | head -1
```

Expected: `HTTP/1.1 400 Bad Request` (the empty body fails validation, which proves the Turnstile check passed and no email was sent). Restart once more with no `TURNSTILE_SECRET_KEY` and send the same request without the token header: also `400`. Stop the backend.

- [ ] **Step 9: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && git add src/utils/turnstile.ts src/utils/__tests__/turnstile.unit.spec.ts src/api/store/contact/middlewares.ts src/api/store/notify-me/middlewares.ts .env.template CLAUDE.md && git commit -m "feat(turnstile): require a Turnstile token on contact and notify-me" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Storefront verification core

**Repo:** storefront.

**Files:**
- Create: `src/lib/util/turnstile.ts`
- Test: `src/lib/util/turnstile.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (Task 4 builds on these, exact names; same contract as the backend):
  ```ts
  export type TurnstileOutcome =
    | { status: "skipped" }
    | { status: "passed" }
    | { status: "rejected"; codes: string[] }
    | { status: "unavailable"; reason: string }
  export type VerifyTurnstileOptions = {
    secret?: string
    ip?: string | null
    timeoutMs?: number
    fetchImpl?: typeof fetch
  }
  export async function verifyTurnstile(token: unknown, options: VerifyTurnstileOptions): Promise<TurnstileOutcome>
  ```

- [ ] **Step 1: Start the branch and commit the spec and this plan**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git status --short && git checkout -b feat/turnstile-spam-protection && git add docs/superpowers/specs/2026-10-08-turnstile-spam-protection-design.md docs/superpowers/plans/2026-10-08-turnstile-spam-protection.md && git commit -m "docs(turnstile): add spam protection spec and implementation plan" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Expected: `git status --short` shows only `?? docs/`; then `Switched to a new branch 'feat/turnstile-spam-protection'` and a commit with two files.

- [ ] **Step 2: Write the failing test**

Create `src/lib/util/turnstile.test.ts`:

```ts
/**
 * Cloudflare Turnstile verification core.
 *
 * Run:  npx tsx src/lib/util/turnstile.test.ts
 *
 * Covers:
 *  1. Without a secret the check is skipped and Cloudflare is never called
 *  2. A missing, empty or oversized token is rejected without calling Cloudflare
 *  3. A token Cloudflare accepts passes; the request carries secret, token and IP
 *  4. A token Cloudflare refuses is rejected
 *  5. Our configuration or Cloudflare at fault counts as unavailable
 *  6. A broken or hung Cloudflare counts as unavailable
 */

import { verifyTurnstile } from "./turnstile"

// ---------------------------------------------------------------------------
// Tiny test harness (no framework dependency)
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

function section(title: string) {
  console.log(`\n${title}`)
}

// ---------------------------------------------------------------------------
// Stand-ins for Cloudflare
// ---------------------------------------------------------------------------

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type Call = { url: string; body: URLSearchParams }

/** A fetch that records what it was asked and answers with `reply`. */
function fakeFetch(reply: () => Promise<unknown>) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body as URLSearchParams })
    return reply()
  }) as unknown as typeof fetch

  return { fetchImpl, calls }
}

/** Cloudflare answering with a JSON body. */
const cloudflareSays = (body: unknown) => async () => ({
  json: async () => body,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  section("1. Without a secret the check is skipped")
  {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const none = await verifyTurnstile("token", { secret: undefined, fetchImpl })
    const empty = await verifyTurnstile("token", { secret: "", fetchImpl })

    assert(none.status === "skipped", "no secret")
    assert(empty.status === "skipped", "an empty secret")
    assert(calls.length === 0, "Cloudflare was not called")
  }

  section("2. A missing, empty or oversized token is rejected")
  for (const [label, token] of [
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a number", 42],
    ["a token over 2,048 characters", "x".repeat(2049)],
  ] as const) {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const outcome = await verifyTurnstile(token, { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" &&
        outcome.codes.join() === "missing-input-response",
      `${label} is rejected as a missing token`
    )
    assert(calls.length === 0, `${label}: Cloudflare was not called`)
  }

  section("3. A token Cloudflare accepts passes")
  {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const outcome = await verifyTurnstile("the-token", {
      secret: "the-secret",
      ip: "203.0.113.7",
      fetchImpl,
    })

    assert(outcome.status === "passed", "success: true passes")
    assert(calls.length === 1, "Cloudflare was called once")
    assert(calls[0].url === SITEVERIFY_URL, "the siteverify address")
    assert(calls[0].body.get("secret") === "the-secret", "the secret is sent")
    assert(calls[0].body.get("response") === "the-token", "the token is sent")
    assert(calls[0].body.get("remoteip") === "203.0.113.7", "the visitor IP is sent")

    const noIp = fakeFetch(cloudflareSays({ success: true }))
    await verifyTurnstile("t", { secret: "s", ip: null, fetchImpl: noIp.fetchImpl })
    assert(!noIp.calls[0].body.has("remoteip"), "no IP, no remoteip field")
  }

  section("4. A token Cloudflare refuses is rejected")
  for (const code of [
    "invalid-input-response",
    "timeout-or-duplicate",
    "missing-input-response",
    "some-code-nobody-listed",
  ]) {
    const { fetchImpl } = fakeFetch(
      cloudflareSays({ success: false, "error-codes": [code] })
    )
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" && outcome.codes.join() === code,
      `${code} is rejected`
    )
  }
  {
    const { fetchImpl } = fakeFetch(cloudflareSays({ success: false }))
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" && outcome.codes.length === 0,
      "a refusal that names no code is rejected"
    )
  }

  section("5. Our configuration or Cloudflare at fault counts as unavailable")
  for (const code of [
    "missing-input-secret",
    "invalid-input-secret",
    "bad-request",
    "internal-error",
  ]) {
    const { fetchImpl } = fakeFetch(
      cloudflareSays({ success: false, "error-codes": [code] })
    )
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(outcome.status === "unavailable", `${code} is unavailable`)
  }

  section("6. A broken or hung Cloudflare counts as unavailable")
  {
    const down = fakeFetch(async () => {
      throw new Error("getaddrinfo ENOTFOUND challenges.cloudflare.com")
    })
    const outcome = await verifyTurnstile("t", {
      secret: "s",
      fetchImpl: down.fetchImpl,
    })
    assert(
      outcome.status === "unavailable" &&
        outcome.reason === "getaddrinfo ENOTFOUND challenges.cloudflare.com",
      "a network error"
    )

    const html = fakeFetch(async () => ({
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0")
      },
    }))
    assert(
      (await verifyTurnstile("t", { secret: "s", fetchImpl: html.fetchImpl }))
        .status === "unavailable",
      "a reply that is not JSON"
    )

    for (const [label, body] of [
      ["an empty object", {}],
      ["null", null],
      ["a success that is not a boolean", { success: "yes" }],
    ] as const) {
      const odd = fakeFetch(cloudflareSays(body))
      assert(
        (await verifyTurnstile("t", { secret: "s", fetchImpl: odd.fetchImpl }))
          .status === "unavailable",
        `${label} as the reply`
      )
    }

    const hanging = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("The operation was aborted"))
        )
      })) as unknown as typeof fetch
    const hung = await verifyTurnstile("t", {
      secret: "s",
      timeoutMs: 20,
      fetchImpl: hanging,
    })
    assert(hung.status === "unavailable", "a request that hangs past the timeout")
  }
}

main()
  .then(() => {
    console.log(`\n${"─".repeat(40)}`)
    console.log(`Passed: ${passed}  Failed: ${failed}`)
    if (failed > 0) {
      console.error("SOME TESTS FAILED")
      process.exit(1)
    } else {
      console.log("All tests passed.")
    }
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

- [ ] **Step 3: Run it to verify it fails**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsx src/lib/util/turnstile.test.ts
```

Expected: fails immediately with `Cannot find module './turnstile'` (exit code 1).

- [ ] **Step 4: Write the implementation**

Create `src/lib/util/turnstile.ts` (the same logic as the backend's, without the middleware):

```ts
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const MAX_TOKEN_LENGTH = 2048
const DEFAULT_TIMEOUT_MS = 10000

/**
 * Codes that point at our configuration or at Cloudflare rather than at the
 * visitor. Refusing everyone over a mistyped secret would be worse than the
 * spam it stops, so these let the submission through (the caller logs them).
 */
const UNAVAILABLE_CODES = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "bad-request",
  "internal-error",
])

export type TurnstileOutcome =
  /** No secret configured: the feature is off. */
  | { status: "skipped" }
  | { status: "passed" }
  /** The visitor's token is missing, invalid, expired or already used. */
  | { status: "rejected"; codes: string[] }
  /** Cloudflare could not be reached or understood, or our secret is wrong. */
  | { status: "unavailable"; reason: string }

export type VerifyTurnstileOptions = {
  secret?: string
  /** The visitor's IP address, passed to Cloudflare as a hint. */
  ip?: string | null
  /** How long to wait for Cloudflare before giving up. Default 10 seconds. */
  timeoutMs?: number
  /** For tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch
}

/**
 * Asks Cloudflare whether a Turnstile token is genuine. A token can be
 * checked only once, so call this exactly once per submission.
 *
 * The HTTP status is not consulted: Cloudflare documents the JSON body, and a
 * failed check can arrive with a non-200 status.
 */
export async function verifyTurnstile(
  token: unknown,
  {
    secret,
    ip,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
  }: VerifyTurnstileOptions
): Promise<TurnstileOutcome> {
  if (!secret) {
    return { status: "skipped" }
  }

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return { status: "rejected", codes: ["missing-input-response"] }
  }

  const body = new URLSearchParams({ secret, response: token })
  if (ip) {
    body.append("remoteip", ip)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let result: { success?: unknown; "error-codes"?: unknown } | null
  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    })
    result = await response.json()
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }

  if (!result || typeof result.success !== "boolean") {
    return {
      status: "unavailable",
      reason: "unexpected reply from Cloudflare",
    }
  }

  if (result.success) {
    return { status: "passed" }
  }

  const codes = Array.isArray(result["error-codes"])
    ? result["error-codes"].map(String)
    : []
  const problem = codes.find((code) => UNAVAILABLE_CODES.has(code))
  if (problem) {
    return { status: "unavailable", reason: `Cloudflare reported ${problem}` }
  }

  return { status: "rejected", codes }
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsx src/lib/util/turnstile.test.ts
```

Expected: every check line starts with `✓`, and the run ends with `Failed: 0` and `All tests passed.`

- [ ] **Step 6: Lint and type-check the files this task touched**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx eslint src/lib/util/turnstile.ts src/lib/util/turnstile.test.ts && echo "lint clean" && (npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/util/turnstile" || echo "no type errors in the files this task touched")
```

Expected: `lint clean`, then `no type errors in the files this task touched`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git add src/lib/util/turnstile.ts src/lib/util/turnstile.test.ts && git commit -m "feat(turnstile): add the Turnstile verification core" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Translations and the server-side form check

**Repo:** storefront.

**Files:**
- Modify: `src/i18n/dictionaries/en.json`, `de-DE.json`, `de-AT.json`, `hu-HU.json`
- Modify: `src/lib/util/turnstile.test.ts`
- Create: `src/lib/data/turnstile.ts`

**Interfaces:**
- Consumes: `verifyTurnstile` and `TurnstileOutcome` from Task 3.
- Produces (Task 5 and Task 6 rely on these):
  - `export async function turnstileError(formData: FormData): Promise<string | null>` in `src/lib/data/turnstile.ts`: `null` means the submission may go ahead, a string is the translated message to show.
  - Translation keys `turnstile.failed` and `turnstile.unavailable` in all four dictionaries.

- [ ] **Step 1: Write the failing translation check**

In `src/lib/util/turnstile.test.ts`, make three edits.

Replace the line

```ts
import { verifyTurnstile } from "./turnstile"
```

with

```ts
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { verifyTurnstile } from "./turnstile"
```

Replace the line

```ts
 *  6. A broken or hung Cloudflare counts as unavailable
 */
```

with

```ts
 *  6. A broken or hung Cloudflare counts as unavailable
 *  7. The translated messages exist in every dictionary
 */
```

Replace

```ts
    assert(hung.status === "unavailable", "a request that hangs past the timeout")
  }
}

main()
```

with

```ts
    assert(hung.status === "unavailable", "a request that hangs past the timeout")
  }

  section("7. The translated messages exist in every dictionary")
  for (const locale of ["en", "de-DE", "de-AT", "hu-HU"]) {
    const dictionary = JSON.parse(
      readFileSync(
        join(process.cwd(), "src/i18n/dictionaries", `${locale}.json`),
        "utf8"
      )
    ) as Record<string, string>

    for (const key of ["turnstile.failed", "turnstile.unavailable"]) {
      assert(
        typeof dictionary[key] === "string" && dictionary[key].trim().length > 0,
        `${locale} has ${key}`
      )
    }
  }
}

main()
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsx src/lib/util/turnstile.test.ts
```

Expected: sections 1-6 pass; section 7 prints eight `✗ <locale> has turnstile.<key>` lines, then `SOME TESTS FAILED` (exit code 1).

- [ ] **Step 3: Add the two keys to all four dictionaries**

Each file ends with the key `salesPortal.join.closedText`. In each, replace that last entry and the closing brace as shown.

`src/i18n/dictionaries/en.json`:

```
  "salesPortal.join.closedText": "There is nothing more to do here."
}
```

becomes

```
  "salesPortal.join.closedText": "There is nothing more to do here.",
  "turnstile.failed": "Verification failed. Please try again.",
  "turnstile.unavailable": "The verification could not be loaded. Turn off content blockers for this site and try again, or contact us directly."
}
```

`src/i18n/dictionaries/de-DE.json` and `src/i18n/dictionaries/de-AT.json` (identical edit in both):

```
  "salesPortal.join.closedText": "Hier ist nichts mehr zu tun."
}
```

becomes

```
  "salesPortal.join.closedText": "Hier ist nichts mehr zu tun.",
  "turnstile.failed": "Die Überprüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
  "turnstile.unavailable": "Die Überprüfung konnte nicht geladen werden. Deaktivieren Sie Inhaltsblocker für diese Website und versuchen Sie es erneut, oder kontaktieren Sie uns direkt."
}
```

`src/i18n/dictionaries/hu-HU.json`:

```
  "salesPortal.join.closedText": "Itt nincs több teendő."
}
```

becomes

```
  "salesPortal.join.closedText": "Itt nincs több teendő.",
  "turnstile.failed": "Az ellenőrzés sikertelen volt. Kérjük, próbálja újra.",
  "turnstile.unavailable": "Az ellenőrzés nem tölthető be. Kapcsolja ki a tartalomblokkolókat ezen az oldalon, és próbálja újra, vagy vegye fel velünk közvetlenül a kapcsolatot."
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsx src/lib/util/turnstile.test.ts && node -e 'for (const f of ["en","de-DE","de-AT","hu-HU"]) JSON.parse(require("fs").readFileSync("src/i18n/dictionaries/"+f+".json","utf8")); console.log("all four dictionaries are valid JSON")'
```

Expected: all `✓`, `Failed: 0`, `All tests passed.`, then `all four dictionaries are valid JSON`.

- [ ] **Step 5: Write the server-side wrapper**

Create `src/lib/data/turnstile.ts`. It is deliberately not a `"use server"` file, so it cannot be called from the browser:

```ts
import "server-only"
import { translate } from "@lib/i18n/dictionaries"
import { verifyTurnstile } from "@lib/util/turnstile"
import { headers } from "next/headers"
import { getLocale } from "./locale-actions"

/**
 * Checks the Turnstile token a protected form submitted.
 *
 * Returns null when the submission may go ahead, otherwise the translated
 * message to show. Off when the site key is missing: without it the widget is
 * not on the page, so no visitor could ever send a token, and a secret alone
 * must not lock everyone out.
 */
export async function turnstileError(
  formData: FormData
): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null
  }

  const outcome = await verifyTurnstile(formData.get("cf-turnstile-response"), {
    secret: process.env.TURNSTILE_SECRET_KEY,
    ip: (await headers()).get("cf-connecting-ip"),
  })

  if (outcome.status === "rejected") {
    return translate("turnstile.failed", await getLocale())
  }

  if (outcome.status === "unavailable") {
    console.warn(`[turnstile] verification unavailable: ${outcome.reason}`)
  }

  return null
}
```

- [ ] **Step 6: Lint and type-check**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx eslint src/lib/data/turnstile.ts src/lib/util/turnstile.test.ts && echo "lint clean" && (npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/(data|util)/turnstile" || echo "no type errors in the files this task touched")
```

Expected: `lint clean`, then `no type errors in the files this task touched`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git add src/i18n/dictionaries src/lib/util/turnstile.test.ts src/lib/data/turnstile.ts && git commit -m "feat(turnstile): add translations and the server-side form check" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Check the token in the account and sales-portal server actions

**Repo:** storefront.

**Files:**
- Modify: `src/lib/data/customer.ts`
- Modify: `src/lib/data/sales-portal-actions.ts`
- Modify: `.env.template`

**Interfaces:**
- Consumes: `turnstileError(formData: FormData): Promise<string | null>` from Task 4.
- Produces: `signup`, `login`, `requestPasswordReset`, `salesRepLogin` and `requestSalesRepPasswordReset` return the translated `turnstile.failed` string, before touching Medusa, when the token is missing or refused. Their signatures are unchanged.

- [ ] **Step 1: Check the token in the three customer actions**

In `src/lib/data/customer.ts`:

Replace

```ts
import { localizeError } from "./localize-error"
import { translate } from "@lib/i18n/dictionaries"
```

with

```ts
import { localizeError } from "./localize-error"
import { turnstileError } from "./turnstile"
import { translate } from "@lib/i18n/dictionaries"
```

Replace

```ts
export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
```

with

```ts
export async function signup(_currentState: unknown, formData: FormData) {
  const blocked = await turnstileError(formData)
  if (blocked) return blocked

  const password = formData.get("password") as string
```

Replace

```ts
export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
```

with

```ts
export async function login(_currentState: unknown, formData: FormData) {
  const blocked = await turnstileError(formData)
  if (blocked) return blocked

  const email = formData.get("email") as string
```

Replace

```ts
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string
```

with

```ts
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const blocked = await turnstileError(formData)
  if (blocked) return blocked

  const email = formData.get("email") as string
```

Do not touch `createCustomerAccount`: checkout calls it and has no widget.

- [ ] **Step 2: Check the token in the two sales-rep actions**

In `src/lib/data/sales-portal-actions.ts`:

Replace

```ts
import { localizeError } from "./localize-error"
```

with

```ts
import { localizeError } from "./localize-error"
import { turnstileError } from "./turnstile"
```

Replace

```ts
export async function salesRepLogin(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string
```

with

```ts
export async function salesRepLogin(
  _currentState: unknown,
  formData: FormData
) {
  const blocked = await turnstileError(formData)
  if (blocked) return blocked

  const email = formData.get("email") as string
```

Replace

```ts
export async function requestSalesRepPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string
```

with

```ts
export async function requestSalesRepPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const blocked = await turnstileError(formData)
  if (blocked) return blocked

  const email = formData.get("email") as string
```

- [ ] **Step 3: Document the keys**

In `.env.template`, replace the line `TAXID_API_KEY=` with:

```
TAXID_API_KEY=

# Cloudflare Turnstile spam protection. Leave both empty to switch it off.
# Site key: public, baked into the build, so rebuild after changing it.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# Secret key: server-only. Never prefix it with NEXT_PUBLIC_.
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 4: Lint and type-check**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx eslint src/lib/data/customer.ts src/lib/data/sales-portal-actions.ts && (npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/data/(customer|sales-portal-actions|turnstile)" || echo "no type errors in the files this task touched")
```

Expected: ESLint reports 0 errors and only the old warning `'customer' is defined but never used` in `customer.ts`; then `no type errors in the files this task touched`.

- [ ] **Step 5: Manual check A, the rejected path (no widget exists yet)**

Per Manual-check setup, start the backend with no secret, then the storefront in **Silent pass** mode:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA yarn dev
```

Open `http://localhost:8000/<region>/account`, type any email and password, click Sign in.

Expected: the error under the form is the `turnstile.failed` text in the page's language (English: "Verification failed. Please try again."). No widget exists yet, so no token is sent and the action refuses before calling Medusa. Do the same on `/<region>/account/forgot-password` and on `/<region>/sales-portal` (sign-in): same message.

- [ ] **Step 6: Manual check B, a half-configured environment never locks anyone out (Review Focus 5)**

Stop the storefront and restart it with **only the secret** (no site key):

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA yarn dev
```

Sign in again at `/<region>/account` with any credentials.

Expected: NOT the verification message. You get the normal sign-in failure (or, if no backend is reachable, the generic error). Repeat with **only the site key** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`, no secret): again not the verification message. Finally with no keys at all: sign-in behaves as before this feature. Stop the servers.

- [ ] **Step 7: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git add src/lib/data/customer.ts src/lib/data/sales-portal-actions.ts .env.template && git commit -m "feat(turnstile): check Turnstile in the account and sales-portal server actions" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The widget and the account forms

**Repo:** storefront.

**Files:**
- Create: `src/modules/common/components/turnstile-widget/index.tsx`
- Modify: `src/modules/account/components/login/index.tsx`
- Modify: `src/modules/account/components/register/index.tsx`
- Modify: `src/modules/account/components/forgot-password/index.tsx`

**Interfaces:**
- Consumes: translation key `turnstile.unavailable` and `ErrorMessage` (`@modules/checkout/components/error-message`, props `error?: string | null`, `data-testid?: string`).
- Produces (Task 7 relies on these):
  - `export default function TurnstileWidget({ className }: { className?: string }): JSX.Element | null` from `@modules/common/components/turnstile-widget`. Place it inside a `<form>`.
  - DOM contract: while a site key is configured, the form contains a hidden `<input name="cf-turnstile-response">` that Cloudflare fills, a container with `data-testid="turnstile-widget"` and, after a load failure, an alert with `data-testid="turnstile-error"`.
  - The widget resets itself after every submit of its form.

- [ ] **Step 1: Create the widget**

Create `src/modules/common/components/turnstile-widget/index.tsx`:

```tsx
"use client"

import { clx } from "@medusajs/ui"
import { useTranslation } from "@lib/i18n/client"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useEffect, useRef, useState } from "react"

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

/**
 * Loads Cloudflare's script once per page. A failed load clears the promise
 * so the next widget to mount can try again.
 */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script")

      const fail = (message: string) => {
        scriptPromise = null
        script.remove()
        reject(new Error(message))
      }

      script.src = SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : fail("Turnstile did not start")
      script.onerror = () => fail("Turnstile could not be loaded")
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

type Props = {
  className?: string
}

/**
 * Cloudflare Turnstile. Put it inside a <form>: the widget adds a hidden
 * `cf-turnstile-response` input to it, so the form's own submit carries the
 * token to the server. Renders nothing when no site key is configured.
 */
export default function TurnstileWidget({ className }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const { t, locale } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const language = locale.split("-")[0]

  useEffect(() => {
    const container = containerRef.current
    if (!siteKey || !container) {
      return
    }

    let cancelled = false
    let widgetId: string | undefined
    const form = container.closest("form")

    // Every submit spends the token, whatever the outcome, so ask for a fresh
    // one. The timeout lets the form read the current token first.
    const resetAfterSubmit = () => {
      setTimeout(() => {
        if (!cancelled && widgetId) {
          window.turnstile?.reset(widgetId)
        }
      }, 0)
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) {
          return
        }

        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          appearance: "interaction-only",
          size: "flexible",
          theme: "light",
          language,
          "refresh-expired": "auto",
          callback: () => setFailed(false),
          "error-callback": () => setFailed(true),
          "before-interactive-callback": () => setInteractive(true),
          "after-interactive-callback": () => setInteractive(false),
        })
        form?.addEventListener("submit", resetAfterSubmit)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
      form?.removeEventListener("submit", resetAfterSubmit)
      if (widgetId) {
        window.turnstile?.remove(widgetId)
      }
    }
  }, [siteKey, language])

  if (!siteKey) {
    return null
  }

  return (
    <>
      {/* Out of the layout while Cloudflare solves the challenge silently, so
          it adds no gap to the form; in the flow when a click is needed. */}
      <div
        ref={containerRef}
        className={clx(interactive ? "mt-2" : "sr-only", className)}
        data-testid="turnstile-widget"
      />
      <ErrorMessage
        error={failed ? t("turnstile.unavailable") : null}
        data-testid="turnstile-error"
      />
    </>
  )
}
```

- [ ] **Step 2: Put the widget in the sign-in form**

In `src/modules/account/components/login/index.tsx`:

Replace

```tsx
import Input from "@modules/common/components/input"
```

with

```tsx
import Input from "@modules/common/components/input"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
```

Replace

```tsx
        <ErrorMessage error={message} data-testid="login-error-message" />
```

with

```tsx
        <TurnstileWidget />
        <ErrorMessage error={message} data-testid="login-error-message" />
```

- [ ] **Step 3: Put the widget in the register form**

In `src/modules/account/components/register/index.tsx`:

Replace

```tsx
import Input from "@modules/common/components/input"
```

with

```tsx
import Input from "@modules/common/components/input"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
```

Replace

```tsx
        <ErrorMessage
          error={typeof message === "string" ? message : null}
          data-testid="register-error"
        />
```

with

```tsx
        <TurnstileWidget />
        <ErrorMessage
          error={typeof message === "string" ? message : null}
          data-testid="register-error"
        />
```

- [ ] **Step 4: Put the widget in the forgot-password form**

In `src/modules/account/components/forgot-password/index.tsx`:

Replace

```tsx
import Input from "@modules/common/components/input"
```

with

```tsx
import Input from "@modules/common/components/input"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
```

Replace

```tsx
        <ErrorMessage error={message} data-testid="forgot-password-error-message" />
```

with

```tsx
        <TurnstileWidget />
        <ErrorMessage error={message} data-testid="forgot-password-error-message" />
```

The sales portal's sign-in and forgot-password pages use these same components, so they need no change.

- [ ] **Step 5: Lint and type-check**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx eslint src/modules/common/components/turnstile-widget/index.tsx src/modules/account/components/login/index.tsx src/modules/account/components/register/index.tsx src/modules/account/components/forgot-password/index.tsx && echo "lint clean" && (npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "turnstile-widget|account/components/(login|register|forgot-password)" || echo "no type errors in the files this task touched")
```

Expected: `lint clean`, then `no type errors in the files this task touched`.

- [ ] **Step 6: Manual check A, Off and Silent pass**

Backend running with no secret. Start the storefront with **no keys** (`yarn dev`, nothing prefixed). Open `/<region>/account`, `/<region>/account/forgot-password`, and `/<region>/sales-portal`.

Expected: no widget on any of them, no request to `challenges.cloudflare.com` (check the browser's Network tab), and the forms behave exactly as before this feature.

Restart in **Silent pass** mode (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) and reload `/<region>/account`. In the browser console run:

```js
({
  slot: document.querySelector('[data-testid="turnstile-widget"]')?.className,
  token: document.querySelector('input[name="cf-turnstile-response"]')?.value,
})
```

Expected within about 3 seconds of loading: `slot` is `sr-only` (nothing visible on the page), `token` is `XXXX.DUMMY.TOKEN.XXXX`. Submit the form with a wrong password: the error is the normal sign-in failure, NOT the verification message. Repeat the console check on the Register view (click "Join us"), on `/<region>/account/forgot-password` and on `/<region>/sales-portal`: each form has its own token. The browser console shows no React hydration warnings.

- [ ] **Step 7: Manual check B, the forced challenge is visible and collapses**

Restart in **Forced challenge** mode (site `3x00000000000000000000FF`, secret `1x0000000000000000000000000000000AA`) and reload `/<region>/account`.

Expected: within about two seconds a full-width Cloudflare verification box ("Verify you are human" in the page's language, with a red "for testing only" strip because the key is a dummy) appears inside the form, between the password link and the Sign in button, and the container's class is `mt-2` instead of `sr-only`. Tick it: the box disappears, the form closes up with no leftover gap, the container returns to `sr-only` and the hidden input holds `XXXX.DUMMY.TOKEN.XXXX`.

- [ ] **Step 8: Manual check C, retry after a failed submit gets a fresh token (Review Focus 1)**

In **Silent pass** mode on `/<region>/account`, fill in any email and a wrong password, then run in the console:

```js
const token = () => document.querySelector('input[name="cf-turnstile-response"]')?.value
const seen = [["before submit", token()]]
document.querySelector('[data-testid="sign-in-button"]').click()
await new Promise((r) => setTimeout(r, 150))
seen.push(["150 ms after submit", token()])
await new Promise((r) => setTimeout(r, 5000))
seen.push(["5 s after submit", token()])
seen
```

Expected: `before submit` is `XXXX.DUMMY.TOKEN.XXXX`; `150 ms after submit` is the empty string (the widget reset); `5 s after submit` is `XXXX.DUMMY.TOKEN.XXXX` again. Then fill the form again and click Sign in: still the normal sign-in failure, not the verification message.

- [ ] **Step 9: Manual check D, submitting before the challenge finishes recovers (Review Focus 2)**

In **Silent pass** mode on `/<region>/account`, fill in an email and a wrong password, then run:

```js
document.querySelector('input[name="cf-turnstile-response"]').value = ""
document.querySelector('[data-testid="sign-in-button"]').click()
```

Expected: the error under the form is the `turnstile.failed` text, the page does not freeze and the button is not stuck loading. Wait 5 seconds, fill the form again, click Sign in: the message is now the normal sign-in failure, so the form recovered by itself.

- [ ] **Step 10: Manual check E, a blocked or failing script (Review Focus 3)**

Temporarily edit `SCRIPT_URL` in `src/modules/common/components/turnstile-widget/index.tsx`, changing `challenges.cloudflare.com` to `challenges.cloudflare.invalid`. With **Silent pass** keys, reload `/<region>/account`.

Expected: the form still renders and, under the fields, an alert reads "The verification could not be loaded. Turn off content blockers for this site and try again, or contact us directly." (or the German or Hungarian text for that page). Clicking Sign in shows the verification message. Switch the locale (region `de` or `at`, then `hu`) and confirm the text changes. Now undo the edit and prove it:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && grep -c "challenges.cloudflare.com/turnstile/v0/api.js" src/modules/common/components/turnstile-widget/index.tsx
```

Expected: `1`. Reload the page: the alert is gone.

- [ ] **Step 11: Manual check F, the failure message with a refused token**

Restart in **Always fail** mode (site `1x00000000000000000000AA`, secret `2x0000000000000000000000000000000AA`). On `/<region>/account` (Sign in and Join us), `/<region>/account/forgot-password` and `/<region>/sales-portal`, submit each form.

Expected: every one shows the `turnstile.failed` text. Stop the servers.

- [ ] **Step 12: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git status --short && git add src/modules/common/components/turnstile-widget/index.tsx src/modules/account/components/login/index.tsx src/modules/account/components/register/index.tsx src/modules/account/components/forgot-password/index.tsx && git commit -m "feat(turnstile): add the Turnstile widget to the account forms" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Expected: `git status --short` lists only those four paths before the commit.

---

### Task 7: Protect the contact and notify-me forms

**Repo:** storefront.

**Files:**
- Modify: `src/modules/contact/components/contact-form/index.tsx`
- Modify: `src/modules/products/components/notify-me-form/index.tsx`

**Interfaces:**
- Consumes: `TurnstileWidget` from Task 6; the backend contract from Task 2 (header `x-turnstile-token`, status `403` for a refused token); translation key `turnstile.failed`.
- Produces: both forms send the token and show `turnstile.failed` on a 403.

- [ ] **Step 1: The contact form**

In `src/modules/contact/components/contact-form/index.tsx`:

Replace

```tsx
import Textarea from "@modules/common/components/textarea"
```

with

```tsx
import Textarea from "@modules/common/components/textarea"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
```

Replace

```tsx
      message: formData.get("message"),
    }

    try {
```

with

```tsx
      message: formData.get("message"),
    }
    // The widget puts the visitor's Turnstile token in the form. It travels as
    // a header so the backend can check it before it validates the message.
    const turnstileToken = formData.get("cf-turnstile-response")

    try {
```

Replace

```tsx
      await sdk.client.fetch("/store/contact", {
        method: "POST",
        body: data,
      })
```

with

```tsx
      await sdk.client.fetch("/store/contact", {
        method: "POST",
        body: data,
        headers: turnstileToken
          ? { "x-turnstile-token": String(turnstileToken) }
          : undefined,
      })
```

Replace

```tsx
      const message = Array.isArray(err.message)
        ? err.message.map((m: any) => m.message || m).join(", ")
        : err.message
      setErrorMessage(message || t("contact.form.error"))
```

with

```tsx
      const message =
        err.status === 403
          ? // Only the backend's Turnstile check answers 403 on this route.
            t("turnstile.failed")
          : Array.isArray(err.message)
            ? err.message.map((m: any) => m.message || m).join(", ")
            : err.message
      setErrorMessage(message || t("contact.form.error"))
```

Replace

```tsx
      {status === "error" && (
        <Text role="alert" className="text-error text-sm">
```

with

```tsx
      <TurnstileWidget />

      {status === "error" && (
        <Text role="alert" className="text-error text-sm">
```

- [ ] **Step 2: The notify-me form**

In `src/modules/products/components/notify-me-form/index.tsx`:

Replace

```tsx
import { useTranslation } from "@lib/i18n/client"
```

with

```tsx
import { useTranslation } from "@lib/i18n/client"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
```

Replace

```tsx
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")
    try {
      await sdk.client.fetch("/store/notify-me", {
        method: "POST",
        body: {
          email,
          productId,
          productTitle,
          variantId,
          variantTitle,
          productUrl: window.location.href,
        },
      })
```

with

```tsx
    e.preventDefault()
    // Read the form before the first await: the event is gone after it.
    const turnstileToken = new FormData(e.currentTarget).get(
      "cf-turnstile-response"
    )
    setStatus("loading")
    setErrorMessage("")
    try {
      await sdk.client.fetch("/store/notify-me", {
        method: "POST",
        body: {
          email,
          productId,
          productTitle,
          variantId,
          variantTitle,
          productUrl: window.location.href,
        },
        headers: turnstileToken
          ? { "x-turnstile-token": String(turnstileToken) }
          : undefined,
      })
```

Replace

```tsx
      if (err.status === 429) {
        setErrorMessage(
          err.message || t("product.notifyMe.rateLimited")
        )
      } else {
```

with

```tsx
      if (err.status === 429) {
        setErrorMessage(
          err.message || t("product.notifyMe.rateLimited")
        )
      } else if (err.status === 403) {
        // Only the backend's Turnstile check answers 403 on this route.
        setErrorMessage(t("turnstile.failed"))
      } else {
```

Replace

```tsx
      {status === "error" && errorMessage && (
```

with

```tsx
      <TurnstileWidget />
      {status === "error" && errorMessage && (
```

- [ ] **Step 3: Lint and type-check**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx eslint src/modules/contact/components/contact-form/index.tsx src/modules/products/components/notify-me-form/index.tsx && echo "lint clean" && (npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "contact-form|notify-me-form" || echo "no type errors in the files this task touched")
```

Expected: `lint clean`, then `no type errors in the files this task touched`. (The old errors at `product-actions/index.tsx:292` and `mobile-actions.tsx:154` about `defaultEmail` are not ours.)

- [ ] **Step 4: Manual check A, the token travels and the custom header passes CORS**

Start the backend with `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` and the storefront in **Silent pass** mode. In local development the storefront (port 8000) calls Medusa (port 9000) across origins, so this also proves the new header passes Medusa's CORS.

Open `/<region>/contact`. Fill name `Test`, a valid email, the subject `abc` (shorter than the 5 characters the backend requires, on purpose) and a message of at least 10 characters such as `This is a test message`, so only the subject fails validation. Wait 3 seconds for the token, then send.

Expected: the form shows a backend validation message about the subject (for example "Subject is required"), NOT the verification message and NOT a network or CORS error. That proves the token was accepted and no email was sent. In the Network tab, the `POST /store/contact` request carries `x-turnstile-token: XXXX.DUMMY.TOKEN.XXXX`.

- [ ] **Step 5: Manual check B, a refused token and a retry (Review Focus 1)**

Restart the backend with `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` (always fails). Reload `/<region>/contact`, fill in valid input, send.

Expected: the form shows the `turnstile.failed` text, not the raw English "Verification failed" and not "Something went wrong". Now restart the backend with the always-pass secret, wait 5 seconds on the same page without reloading, and send again with the subject `abc`: the message changes to the subject validation message, which proves the widget gave the second submit a fresh token.

- [ ] **Step 6: Manual check C, two notify-me forms on one page and variant switches (Review Focus 4)**

Product pages show the form only for an out-of-stock variant, so use a throwaway page. Create `src/app/[countryCode]/(main)/turnstile-demo/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import NotifyMeForm from "@modules/products/components/notify-me-form"

export default function TurnstileDemo() {
  const [variant, setVariant] = useState("v1")

  return (
    <div className="content-container py-12 flex flex-col gap-8">
      <button
        data-testid="switch-variant"
        onClick={() => setVariant(variant === "v1" ? "v2" : "v1")}
      >
        Switch variant ({variant})
      </button>
      <NotifyMeForm
        key={`desktop-${variant}`}
        productId="prod_demo"
        productTitle="Demo"
        variantId={variant}
      />
      <NotifyMeForm
        key={`mobile-${variant}`}
        productId="prod_demo"
        productTitle="Demo"
        variantId={variant}
      />
    </div>
  )
}
```

With backend and storefront in **Silent pass** mode, open `/<region>/turnstile-demo`, wait 3 seconds, then run in the console:

```js
const count = () => ({
  widgets: document.querySelectorAll('[data-testid="turnstile-widget"]').length,
  tokens: [...document.querySelectorAll('input[name="cf-turnstile-response"]')].map((i) => i.value),
})
const log = [["start", count()]]
for (let i = 0; i < 3; i++) {
  document.querySelector('[data-testid="switch-variant"]').click()
  await new Promise((r) => setTimeout(r, 3000))
  log.push([`after switch ${i + 1}`, count()])
}
log
```

Expected at every step: `widgets` is `2` and `tokens` is two entries, both `XXXX.DUMMY.TOKEN.XXXX`; no orphan widgets and no console errors. Type `a@b` in the first form's email and submit it (HTML accepts it, the backend's stricter email check refuses it): the message is a validation error, not the verification message, and the second form is unaffected.

Then delete the throwaway page and prove it is gone:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && rm -r "src/app/[countryCode]/(main)/turnstile-demo" && git status --short
```

Expected: `git status --short` lists only the two modified form files. Stop both servers.

- [ ] **Step 7: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git add src/modules/contact/components/contact-form/index.tsx src/modules/products/components/notify-me-form/index.tsx && git commit -m "feat(turnstile): protect the contact and notify-me forms" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Document the pattern and run the final matrix

**Repo:** storefront (backend docs were done in Task 2).

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the finished, documented feature on both branches.

- [ ] **Step 1: Document the pattern**

Read the end of `CLAUDE.md`. Directly below the `- **Sales portal** — ...` bullet (the last bullet under "Core Patterns", just above `## Memory`), add this bullet on its own line, keeping the blank line before `## Memory`:

```
- **Bot protection** — Cloudflare Turnstile guards the contact, notify-me, register, sign-in and forgot-password forms (the sales rep sign-in and forgot-password share the customer components). `TurnstileWidget` (`src/modules/common/components/turnstile-widget`) goes inside a `<form>` and adds a hidden `cf-turnstile-response` field; it is invisible unless Cloudflare needs a click, resets after every submit (a token is single-use) and renders nothing without `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. The account forms are checked in their server actions through `turnstileError(formData)` (`src/lib/data/turnstile.ts`, secret `TURNSTILE_SECRET_KEY`); contact and notify-me send the token as the `x-turnstile-token` header and the Medusa backend checks it (a 403 means "verification failed"). Both checks switch off without keys, let a submission through (and log) when Cloudflare cannot be reached, and never verify the same token twice. `createCustomerAccount` is deliberately unprotected because checkout calls it, and Medusa's `/auth/*` routes are not behind the check. `npx tsx src/lib/util/turnstile.test.ts` covers the verification core and the translations. Cloudflare's test keys let you try it locally: site `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` passes, secret `2x0000000000000000000000000000000AA` fails, site `3x00000000000000000000FF` forces a visible challenge.
```

- [ ] **Step 2: Run every automated check**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsx src/lib/util/turnstile.test.ts && npx tsx src/lib/util/backend-url.test.ts && npx tsx src/modules/sales-portal/lib/dictionary.test.ts && npx eslint src/lib/util/turnstile.ts src/lib/util/turnstile.test.ts src/lib/data/turnstile.ts src/lib/data/customer.ts src/lib/data/sales-portal-actions.ts src/modules/common/components/turnstile-widget/index.tsx src/modules/account/components/login/index.tsx src/modules/account/components/register/index.tsx src/modules/account/components/forgot-password/index.tsx src/modules/contact/components/contact-form/index.tsx src/modules/products/components/notify-me-form/index.tsx && echo "lint clean (one old warning in customer.ts is expected)"
```

Expected: the turnstile and backend-url runs each end `All tests passed.`, the sales-portal dictionary test prints `ok: 176 sales portal sentences, in 4 languages`, and ESLint reports 0 errors.

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "turnstile|account/components/(login|register|forgot-password)|contact-form|notify-me-form|data/(customer|sales-portal-actions)" || echo "no type errors in the files this feature touched"
```

Expected: `no type errors in the files this feature touched`.

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn test:unit src/utils/__tests__/turnstile.unit.spec.ts
```

Expected: `PASS`, no failures.

- [ ] **Step 3: Final manual matrix (see Manual-check setup)**

Run each mode on both servers. In **Off** (no keys anywhere) and **Silent pass** (both servers use the silent-pass secret), and **Always fail** (both servers use the always-fail secret), check every form once:

| Form and URL | Off | Silent pass | Always fail |
|---|---|---|---|
| Sign in `/<region>/account` | no widget, behaves as before | token present, normal sign-in failure for bad credentials | `turnstile.failed`, nothing sent to Medusa |
| Register (Join us) | same | same | same |
| Forgot password `/<region>/account/forgot-password` | no widget, reset request as before | token present, request proceeds | `turnstile.failed` |
| Sales-rep sign-in `/<region>/sales-portal` | no widget, as before | token present | `turnstile.failed` |
| Sales-rep forgot password `/<region>/sales-portal/forgot-password` | no widget, as before | token present | `turnstile.failed` |
| Contact `/<region>/contact` (invalid subject `abc`) | no widget; subject validation message | subject validation message | `turnstile.failed` |
| Notify-me (use Task 7's demo page recreated temporarily, or an out-of-stock product) | no widget | token present; `a@b` gives a validation message | `turnstile.failed` |

Expected: every cell as described. Stop both servers and delete any throwaway page.

Checkout's optional account creation has no widget and must not be blocked, so `createCustomerAccount` stays unprotected on purpose. Prove it was not touched:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git diff master -- src/lib/data/customer.ts | grep -E "^[+-]" | grep "createCustomerAccount" || echo "createCustomerAccount is untouched"
```

Expected: `createCustomerAccount is untouched`. (Only the import block, `signup`, `login` and `requestPasswordReset` change in that file.)

- [ ] **Step 4: Production builds**

Both dev servers must be stopped first (`next build` rewrites `.next`). The storefront build fetches regions and products, so start the backend with no secret (Manual-check setup) before building the storefront.

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && yarn build
```

Expected: the build finishes with a route table and no error that mentions a file from this feature. (`next.config.js` sets `typescript.ignoreBuildErrors`, so the old unrelated type errors do not fail it.) A failure that talks about `server-only`, `"use server"` or a client component points at this feature's files: fix it before going on.

Stop the backend dev server, then:

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && yarn build
```

Expected: exits 0.

- [ ] **Step 5: Confirm nothing stray is left**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git status --short && git diff master --stat
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infiniytree-backend" && git status --short && git diff master --stat
```

Expected: both `git status --short` print nothing except `CLAUDE.md` in the storefront. The storefront diff lists exactly: the spec and plan docs, `.env.template`, `CLAUDE.md`, the four dictionaries, `src/lib/util/turnstile.ts` and its test, `src/lib/data/turnstile.ts`, `customer.ts`, `sales-portal-actions.ts`, the widget, and the five form files. The backend diff lists exactly: `.env.template`, `CLAUDE.md`, `src/utils/turnstile.ts` and its test, and the two `middlewares.ts` files.

- [ ] **Step 6: Commit**

```bash
cd "/Users/macbookpro/Documents/Work/Web/Richard Austria/webshop/infinytree/infinytree-storefront" && git add CLAUDE.md && git commit -m "docs(turnstile): document bot protection in CLAUDE.md" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## After the code is merged

The rollout is the owner's, in the order given in the spec's "Rollout and rollback" section: create the widget in Cloudflare, deploy the backend (nothing changes yet), set both storefront variables and rebuild, then set the backend secret last, then add a sentence about Cloudflare Turnstile to the privacy policy page. Rollback is unsetting a secret and restarting.
