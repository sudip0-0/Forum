import { rateLimit, type RateLimitConfig } from "@/server/api/rate-limit";

/** One view increment per identity+thread per 30 minutes. */
export const RL_THREAD_VIEW: RateLimitConfig = {
  windowMs: 30 * 60 * 1000,
  maxRequests: 1,
  keyPrefix: "thread-view",
  failClosed: false,
};

/**
 * Returns true when this identity may increment the view counter.
 * Failures / limits return false so view counting never blocks reads.
 */
export async function shouldCountThreadView(
  identity: string,
  threadId: string,
): Promise<boolean> {
  try {
    const result = await rateLimit(`${identity}:${threadId}`, RL_THREAD_VIEW);
    return result.allowed;
  } catch {
    return false;
  }
}
