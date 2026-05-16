import { KeyRound } from "lucide-react";
import { db } from "@/server/db/prisma";
import { inspectPasswordResetToken } from "@/server/auth/password-reset";
import { ResetPasswordForm } from "./reset-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const status = token ? await inspectPasswordResetToken(db, token) : "invalid";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
      <div className="w-full max-w-sm rounded-xl border-2 border-border bg-card p-6 shadow-brutal-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
        </div>

        {status === "valid" ? (
          <ResetPasswordForm token={token!} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {status === "expired"
                ? "This password reset link has expired."
                : "This password reset link is invalid or has already been used."}
            </p>
            <a
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Request a new reset link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
