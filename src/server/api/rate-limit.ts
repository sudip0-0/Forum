import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createClient, type RedisClientType } from "redis";

type WindowEntry = { count: number; resetAt: number };

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  failClosed?: boolean;
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
};

interface TrpcSessionUser {
  id: string;
  role: string;
  isSuspended?: boolean;
}

const store = new Map<string, WindowEntry>();
const cleanupInterval = 5 * 60 * 1000;
let lastCleanup = Date.now();
let redisClient: RedisClientType | null = null;
let redisConnection: Promise<RedisClientType> | null = null;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function shouldBypassRateLimits() {
  return process.env.E2E === "true";
}

function allowInMemoryFallback() {
  return (
    process.env.RATE_LIMIT_BACKEND === "memory" ||
    process.env.RATE_LIMIT_IN_MEMORY_FALLBACK === "true" ||
    process.env.NODE_ENV === "test" ||
    (process.env.NODE_ENV !== "production" && !process.env.REDIS_URL)
  );
}

function shouldUseRedis() {
  return process.env.RATE_LIMIT_BACKEND === "redis" || !!process.env.REDIS_URL;
}

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase();
}

export function hashRateLimitIdentifier(value: string): string {
  return crypto.createHash("sha256").update(normalizeKeyPart(value)).digest("hex");
}

function buildStoreKey(key: string, config: RateLimitConfig): string {
  return `rate-limit:${config.keyPrefix}:${key}`;
}

function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();
  const now = Date.now();
  const storeKey = buildStoreKey(key, config);
  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(config.maxRequests - 1, 0),
    };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.count++;
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - entry.count, 0),
  };
}

async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient?.isOpen) return redisClient;
  if (redisConnection) return redisConnection;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not configured");
  }

  const client: RedisClientType = createClient({
    url,
    socket: {
      connectTimeout: 500,
      reconnectStrategy: false,
    },
  });
  client.on("error", () => {
    // Consumers convert Redis failures into generic rate-limit errors.
  });

  redisConnection = client.connect().then(() => {
    redisClient = client;
    return client;
  });

  try {
    return await redisConnection;
  } catch (error) {
    redisConnection = null;
    redisClient = null;
    throw error;
  }
}

async function checkRedisRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const client = await getRedisClient();
  const storeKey = buildStoreKey(key, config);
  const count = await client.incr(storeKey);

  if (count === 1) {
    await client.pExpire(storeKey, config.windowMs);
  }

  const ttlMs = await client.pTTL(storeKey);
  const retryAfterSeconds =
    ttlMs > 0 ? Math.max(1, Math.ceil(ttlMs / 1000)) : Math.ceil(config.windowMs / 1000);

  if (ttlMs < 0) {
    await client.pExpire(storeKey, config.windowMs);
  }

  return {
    allowed: count <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - count, 0),
    ...(count > config.maxRequests ? { retryAfterSeconds } : {}),
  };
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (shouldBypassRateLimits()) {
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
    };
  }

  if (!shouldUseRedis()) {
    return checkMemoryRateLimit(key, config);
  }

  try {
    return await checkRedisRateLimit(key, config);
  } catch {
    if (allowInMemoryFallback()) {
      return checkMemoryRateLimit(key, config);
    }
    if (config.failClosed) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      };
    }
    return checkMemoryRateLimit(key, config);
  }
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const result = await rateLimit(key, config);
  if (!result.allowed) {
    const retryAfter = result.retryAfterSeconds ?? Math.ceil(config.windowMs / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }
  return result;
}

export async function resetRateLimit(key: string, config: RateLimitConfig): Promise<void> {
  const storeKey = buildStoreKey(key, config);
  store.delete(storeKey);

  if (!shouldUseRedis()) return;
  try {
    const client = await getRedisClient();
    await client.del(storeKey);
  } catch {
    // Test and local cleanup should not fail just because Redis is unavailable.
  }
}

export async function closeRateLimitRedisForTests(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
  redisClient = null;
  redisConnection = null;
}

export function clearInMemoryRateLimitsForTests(): void {
  store.clear();
  lastCleanup = Date.now();
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
  failClosed: true,
} as const satisfies RateLimitConfig;

export const RL_REGISTER = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: "register",
  failClosed: true,
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

export const RL_RESEND_VERIFICATION = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: "resend-verification",
  failClosed: true,
} as const satisfies RateLimitConfig;

export const RL_PASSWORD_RESET = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: "password-reset",
  failClosed: true,
} as const satisfies RateLimitConfig;
