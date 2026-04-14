# SurgeonValue Security Posture

This document describes the security posture of the SurgeonValue stack as of April 14, 2026. It's the starting point for any partner, auditor, or security reviewer who wants to understand what we protect, how, and where the gaps are.

## Scope

- **surgeonvalue.com** — Next.js 16 app deployed on Vercel
- **/pocket** — the referral partner mobile app (PWA)
- **/api/*** — agentic HTTP endpoints (wonder-bill, refer, post-draft, prior-auth, ask, dictate, ncci, npi)
- **harnesshealth.ai/footer.js** — the universal Sage chat + Surf bar loaded on every ecosystem site

Out of scope: Supabase-backed brand modules, the MCP server at `solvinghealth-mcp-production.up.railway.app/mcp`, the chanio Chrome extension, co-op.care, ClinicalSwipe. Each has its own security posture documented separately.

## What we protect

**Category A — Clinical content.** Any free-text that a user submits to an `/api/*` endpoint that describes a patient encounter, case, or clinical question. This includes:

- `/api/wonder-bill` → `note`
- `/api/refer` → `patient_context`
- `/api/prior-auth` → `clinicalNote`
- `/api/ask` → `question`
- `/api/post-draft` → `observation`
- `/api/dictate` → `text`

**Category B — User identity.** NPI numbers, provider names, and contact information passed to lookup endpoints (`/api/npi`). This is public CMS data but the *pattern of queries* can reveal sensitive information (who you're looking up, who you're referring to).

**Category C — Local state.** Pocket stores state in `localStorage` on the user's device under `sv_pocket_queue_v1` and `sv_pocket_biller_email_v1`. Queue entries contain the clinical dictation and result.

## Controls

### 1. No request body logging

None of the sensitive routes call `console.log` on the request body. Vercel platform logs capture method, path, status, and duration — not body content. Any clinical text submitted is used only for the upstream model call and discarded after the response is returned. **No persistence, no log retention, no analytics.**

Audit: `grep -rn "console\.\(log\|error\|warn\|info\)" app/api/` — should return zero hits that reference `body`, `note`, `patient_context`, `clinicalNote`, `question`, `observation`, or `text`.

### 2. PHI pre-strip before upstream

Every sensitive route runs submitted text through `lib/phi-strip.ts` before forwarding it to the upstream Claude API. The strip is regex-based and catches the most common identifier leak vectors:

- Social Security numbers (XXX-XX-XXXX)
- Phone numbers (US formats, parenthesized and delimited)
- Email addresses
- Medical Record Numbers (labeled)
- Full dates with year (MM/DD/YYYY, written-out months)
- Street addresses (number + street + suffix)
- ZIP codes (5 and 9 digit)
- Patient names following "Patient:" or "PT NAME:" labels
- "DOB:" labels
- Insurance member IDs (labeled)

Each match is replaced with a bracketed label (`[SSN]`, `[PHONE]`, `[EMAIL]`, etc.) before the text continues downstream.

**This is defense-in-depth, not a HIPAA-certified redactor.** For a certified redaction layer (named-entity recognition, clinical context awareness), swap `lib/phi-strip.ts` for a dedicated service like Presidio or MedSpacy. Roadmap.

### 3. Security headers on every API response

`middleware.ts` runs on every `/api/*` route and applies:

```
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

No response from a sensitive endpoint is cacheable by any proxy, CDN, or browser. No response can be embedded in an iframe.

### 4. Strict CORS allowlist

The middleware applies `Access-Control-Allow-Origin` only to requests originating from one of the known ecosystem domains:

- `surgeonvalue.com`, `www.surgeonvalue.com`
- `harnesshealth.ai`, `www.harnesshealth.ai`
- `co-op.care`, `www.co-op.care`
- `chanio.com`, `www.chanio.com`
- `solvinghealth.com`, `www.solvinghealth.com`
- Plus dev loopback (`localhost:3000`, `:3848`, `:4300`)

Requests from any other origin get no CORS headers — browsers block them. Non-browser callers (curl, MCP, scripts) ignore CORS anyway, which is desired for server-to-server calls.

OPTIONS preflight requests are handled at the middleware layer with a 600-second cache.

### 5. Input size limits

Every sensitive route enforces explicit character limits on free-text input:

| Route | Field | Max chars |
|---|---|---|
| wonder-bill | `note` | 8000 |
| refer | `patient_context` | 4000 |
| post-draft | `observation` | 3000 |
| prior-auth | `clinicalNote` | 10000 |
| ask | `question` | 2000 |
| dictate | `text` | 8000 |

Oversized inputs are rejected with a 400 response.

### 6. Local-only Pocket state

Pocket has **no server-side account**. All state is in `localStorage` on the user's device:

- `sv_pocket_queue_v1` — encounter queue, **auto-purges entries older than 24 hours on every page load**
- `sv_pocket_biller_email_v1` — biller email for end-of-day export

Users can see exactly what's stored at `/me` and delete any or all of it with one tap. There's no audit trail to clear because there's nothing on the server.

### 7. Algorithmic transparency

When a preferred specialist is pinned to the top of `/api/refer` matches (via the `preferred_npi` parameter or `?to=<slug>` URL), the Pocket UI explicitly labels this as **"Your network preference"** — not as a neutral ranking. The disclosure text:

> You arrived here from this surgeon's network. They'll be pinned at the top of matches when surgical eval applies. Other matched providers from CMS NPPES appear below.

This is required because hiding commercial bias behind algorithmic-looking defaults is the same pattern that makes Google Ads require "Sponsored" labels.

### 8. Third-party AI disclosure

The Sage chat bar (loaded across every ecosystem site via `harnesshealth.ai/footer.js`) includes a one-line disclosure inside the chat panel:

> Sage runs on Claude. Don't share patient information.

Users know before they type that their message leaves our infrastructure for a third-party LLM.

## What we do NOT do (yet)

These are known gaps. None are blocking for current usage scale but each is on the hardening roadmap.

- **Rate limiting per IP.** Vercel does platform-level throttling but we don't enforce per-IP quotas on the expensive Claude-backed endpoints. A stray script could burn the upstream budget. Roadmap: Upstash Redis-backed sliding window, 60 requests/minute/IP on wonder-bill/refer/post-draft.
- **Hybrid post-quantum TLS.** Every HTTPS call today uses classical RSA/ECDHE key exchange. State-level adversaries can store encrypted traffic today and decrypt it after Q-Day (estimated 2030-2032). Roadmap: move surgeonvalue.com behind Cloudflare with hybrid PQC TLS enabled.
- **HSM-backed secrets.** Anthropic/Claude API keys are stored in Vercel environment variables. Rotation is manual.
- **Code signing with post-quantum algorithms.** The chanio extension and Pocket PWA update channels rely on classical signature schemes. FIPS 205 (SLH-DSA, hash-based) is the right choice for long-lived signing; migration pending Chrome Web Store support.
- **SOC 2.** Not yet. Expected when we onboard the first enterprise partner.
- **BAA with Anthropic.** Required before any PHI passes through the Claude API under contractual HIPAA terms. Anthropic offers a BAA; we have not yet signed it. **Until the BAA is signed, users should assume PHI submitted to wonder-bill, refer, prior-auth, etc. is NOT under a HIPAA-protected contract with the AI vendor.** This is why PHI pre-strip (control #2) is critical.

## Responsible disclosure

Found a security issue? Email the project owner. Do not file a public GitHub issue.

## Audit the posture yourself

```bash
# 1. Verify no body logging
grep -rn "console\.\(log\|error\)" app/api/ | grep -E "body|note|patient_context|clinicalNote|question|observation|text"

# 2. Verify PHI strip is imported in every sensitive route
for f in wonder-bill refer post-draft prior-auth ask dictate; do
  grep -l "stripPhi" app/api/$f/route.ts && echo "$f: OK" || echo "$f: MISSING"
done

# 3. Verify middleware exists
test -f middleware.ts && echo "middleware: OK" || echo "middleware: MISSING"

# 4. Verify security headers applied
curl -sI https://surgeonvalue.com/api/npi?npi=1104445147 | grep -iE "cache-control|x-content-type|x-frame|referrer-policy"
```

## Version

- April 14, 2026 — initial posture document
- Controls 1-8 shipped in the April 14 hardening pass
- Roadmap items tracked in internal backlog
