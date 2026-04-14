import { NextRequest, NextResponse } from "next/server";

// ─── Route security helpers ──────────────────────────────────────────────
// Applied to every /api route that handles clinical or identifying data.
// Goals:
//   1. No caching of PHI-bearing responses (proxies, CDNs, browser cache)
//   2. Strict CORS — only our own origins can POST to these routes from a
//      browser context. Non-browser callers (MCP, curl) ignore CORS anyway
//      so we don't lose functionality.
//   3. No MIME sniffing, no framing, no referrer leakage.
//
// If a route uses this helper, every response — success or error — gets
// these headers applied via withSecurity(body, opts).

const ALLOWED_ORIGINS = new Set([
  "https://surgeonvalue.com",
  "https://www.surgeonvalue.com",
  "https://harnesshealth.ai",
  "https://www.harnesshealth.ai",
  "https://co-op.care",
  "https://www.co-op.care",
  "https://chanio.com",
  "https://www.chanio.com",
  "https://solvinghealth.com",
  "https://www.solvinghealth.com",
  // Dev
  "http://localhost:3000",
  "http://localhost:3848",
  "http://localhost:4300",
]);

const SENSITIVE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  // CSP for JSON APIs — block anything not explicitly needed
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

/**
 * Wrap a NextResponse with security headers.
 * Use this for every response from a sensitive route.
 */
export function withSecurity(response: NextResponse, request: NextRequest): NextResponse {
  for (const [key, value] of Object.entries(SENSITIVE_HEADERS)) {
    response.headers.set(key, value);
  }
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Max-Age", "600");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

/**
 * CORS preflight handler. Export this from any route as `export { preflight as OPTIONS }`.
 */
export function preflight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
  }
  return new NextResponse(null, { status: 204 });
}

/**
 * Build a JSON response with security headers already applied.
 * Prefer this over raw NextResponse.json() in sensitive routes.
 */
export function secureJson(
  data: unknown,
  request: NextRequest,
  status = 200
): NextResponse {
  const res = NextResponse.json(data, { status });
  return withSecurity(res, request);
}
