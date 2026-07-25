import crypto from "node:crypto";
import { db } from "@/server/db/prisma";
import { logger } from "@/server/observability/logger";

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || (a === 172 && b! >= 16 && b! <= 31) || (a === 192 && b === 168)) {
      return true;
    }
  }
  return false;
}

export function assertSafeWebhookUrl(urlString: string): URL {
  const url = new URL(urlString);
  if (url.protocol !== "https:") {
    throw new Error("Webhook URL must use https");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Webhook URL must not target private hosts");
  }
  return url;
}

export async function dispatchWebhooks(
  event: string,
  payload: Record<string, unknown>,
) {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { isActive: true },
  });
  const matching = endpoints.filter((e) => e.events.includes(event) || e.events.includes("*"));
  await Promise.allSettled(
    matching.map(async (endpoint) => {
      try {
        const url = assertSafeWebhookUrl(endpoint.url);
        const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() });
        const signature = crypto
          .createHmac("sha256", endpoint.secret)
          .update(body)
          .digest("hex");
        await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forum-signature": signature,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
      } catch (error) {
        logger.warn({ err: error, endpointId: endpoint.id, event }, "webhook dispatch failed");
      }
    }),
  );
}
