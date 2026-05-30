/**
 * Resolves the originating client IP from request headers.
 *
 * Prefers the first entry of `x-forwarded-for`, then `x-real-ip`, and falls
 * back to a loopback address so callers (rate limiting, abuse keys) always
 * receive a stable, non-empty string. Centralizing this keeps the parsing
 * consistent between the tRPC HTTP handler and server actions.
 */
const FALLBACK_IP = "127.0.0.1";

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return FALLBACK_IP;
}
