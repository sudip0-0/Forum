import { describe, expect, it } from "vitest";
import { createRequestLogger, logger } from "@/server/observability/logger";

describe("logger", () => {
  it("exposes a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  it("creates child loggers with request fields", () => {
    const child = createRequestLogger({
      requestId: "req-1",
      route: "/api/trpc",
      userId: "user-1",
    });
    expect(child).toBeDefined();
    expect(typeof child.error).toBe("function");
  });
});
