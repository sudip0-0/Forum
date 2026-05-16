"use server";

import { headers } from "next/headers";
import { db } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import {
  emailOnlySchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validators";
import {
  checkRateLimit,
  hashRateLimitIdentifier,
  rateLimit,
  RL_PASSWORD_RESET,
  RL_REGISTER,
  RL_RESEND_VERIFICATION,
} from "@/server/api/rate-limit";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  replaceAuthToken,
  VERIFICATION_TOKEN_TTL_MS,
} from "@/server/auth/tokens";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/server/email";
import { resolveEmailConfig } from "@/server/email/config";
import {
  resetPasswordWithToken,
  type PasswordResetResult,
} from "@/server/auth/password-reset";

export interface RegisterResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface EmailActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  throttled?: boolean;
  retryAfterSeconds?: number;
}

export interface ResetPasswordActionResult {
  success: boolean;
  status?: PasswordResetResult;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}

function buildEmailLink(path: string, token: string): string {
  const url = new URL(path, resolveEmailConfig().APP_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function registerUser(
  _prev: RegisterResult | null,
  formData: FormData,
): Promise<RegisterResult> {
  const clientIp = await getClientIp();

  try {
    await checkRateLimit(clientIp, RL_REGISTER);
  } catch {
    return {
      success: false,
      error: "Too many registration attempts. Please try again later.",
    };
  }

  const raw = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { username, email, password, displayName } = parsed.data;

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    return {
      success: false,
      error: "Email is already registered",
      fieldErrors: { email: ["Email is already registered"] },
    };
  }

  const existingUsername = await db.user.findUnique({ where: { username } });
  if (existingUsername) {
    return {
      success: false,
      error: "Username is already taken",
      fieldErrors: { username: ["Username is already taken"] },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      username,
      passwordHash,
      displayName: displayName ?? null,
    },
  });

  try {
    const token = await replaceAuthToken(db, "verify", user.id, VERIFICATION_TOKEN_TTL_MS);
    await sendVerificationEmail({
      to: user.email,
      verificationUrl: buildEmailLink("/verify-email", token),
    });
  } catch {
    return {
      success: false,
      error:
        "Account created, but we could not send a verification email. Please request a new verification email.",
    };
  }

  return { success: true };
}

export async function resendVerificationEmailAction(
  _prev: EmailActionResult | null,
  formData: FormData,
): Promise<EmailActionResult> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email } = parsed.data;
  const rateLimitResult = await rateLimit(
    hashRateLimitIdentifier(email),
    RL_RESEND_VERIFICATION,
  );
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      throttled: true,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      error: "Too many verification email requests. Please try again later.",
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    try {
      const token = await replaceAuthToken(db, "verify", user.id, VERIFICATION_TOKEN_TTL_MS);
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: buildEmailLink("/verify-email", token),
      });
    } catch {
      // Keep resend responses generic so callers cannot infer account state.
    }
  }

  return { success: true };
}

export async function requestPasswordResetAction(
  _prev: EmailActionResult | null,
  formData: FormData,
): Promise<EmailActionResult> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email } = parsed.data;
  const rateLimitResult = await rateLimit(
    hashRateLimitIdentifier(email),
    RL_PASSWORD_RESET,
  );
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      throttled: true,
      retryAfterSeconds: rateLimitResult.retryAfterSeconds,
      error: "Too many password reset requests. Please try again later.",
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    try {
      const token = await replaceAuthToken(db, "reset", user.id, PASSWORD_RESET_TOKEN_TTL_MS);
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: buildEmailLink("/reset-password", token),
      });
    } catch {
      // Keep reset-request responses generic so callers cannot infer account state.
    }
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: ResetPasswordActionResult | null,
  formData: FormData,
): Promise<ResetPasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await resetPasswordWithToken(db, parsed.data.token, parsed.data.password);
  if (result !== "success") {
    return {
      success: false,
      status: result,
      error:
        result === "expired"
          ? "This password reset link has expired."
          : "This password reset link is invalid.",
    };
  }

  return { success: true, status: "success" };
}
