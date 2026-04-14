import { NextRequest, NextResponse } from "next/server";

// ─── Global API security middleware ──────────────────────────────────────
// Applies security headers + CORS to every /api/* response. Replaces the
// need to wrap each route's individual response — any NextResponse.json
// returned from an API route goes through here.
//
// Matched paths: /api/*
//
// Goals:
//   1. No caching of PHI-bearing responses (proxies, CDNs, browser cache)
//   2. Strict CORS for browser callers — only our own origins
//   3. No MIME sniffing, no framing, no referrer leakage
//   4. Automatic preflight response for OPTIONS requests

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

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";

  // Preflight — respond immediately
  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowedOrigin) {
      res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.headers.set("Access-Control-Max-Age", "600");
      res.headers.set("Vary", "Origin");
    }
    return res;
  }

  const response = NextResponse.next();

  // Apply security headers to the outgoing response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // CORS for browser callers
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
  }

  return response;
}

// Only run middleware on /api/* paths — skip page routes, static assets, Next.js internals
export const config = {
  matcher: ["/api/:path*"],
};
