import { TRPCError } from "@trpc/server";

type WindowEntry = { count: number; resetAt: number };

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface TrpcSessionUser {
  id: string;
  role: string;
  isSuspended?: boolean;
}

const store = new Map<string, WindowEntry>();

const cleanupInterval = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): void {
  if (process.env.E2E === "true") return;
  cleanup();
  const now = Date.now();
  const storeKey = `${config.keyPrefix}:${key}`;
  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + config.windowMs });
    return;
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  entry.count++;
}

export function resetRateLimit(key: string, config: RateLimitConfig): void {
  store.delete(`${config.keyPrefix}:${key}`);
}

export function assertNotSuspended(user: TrpcSessionUser): void {
  if (user.isSuspended) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account has been suspended.",
    });
  }
}

export const RL_LOGIN = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  keyPrefix: "login",
} as const satisfies RateLimitConfig;

export const RL_REGISTER = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: "register",
} as const satisfies RateLimitConfig;

export const RL_CREATE_THREAD = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  keyPrefix: "create-thread",
} as const satisfies RateLimitConfig;

export const RL_REPLY = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 30,
  keyPrefix: "reply",
} as const satisfies RateLimitConfig;

export const RL_REPORT = {
  windowMs: 24 * 60 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: "report",
} as const satisfies RateLimitConfig;

export const RL_SEARCH = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  keyPrefix: "search",
} as const satisfies RateLimitConfig;
