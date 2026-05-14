"use server";

import { db } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { registerSchema } from "@/lib/validators";

export interface RegisterResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function registerUser(
  _prev: RegisterResult | null,
  formData: FormData,
): Promise<RegisterResult> {
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

  await db.user.create({
    data: {
      email,
      username,
      passwordHash,
      displayName: displayName ?? null,
    },
  });

  return { success: true };
}
