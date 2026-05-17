"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/server/auth/actions";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    setFieldErrors({});
    const result = await requestPasswordResetAction(null, formData);
    if (!result.success) {
      setError(result.error ?? "Unable to request a password reset.");
      setFieldErrors(result.fieldErrors ?? {});
    } else {
      setMessage("If an account exists for that email, a password reset link has been sent.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and we will send a reset link if an account exists.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border bg-card p-6 shadow-brutal-sm">
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "forgot-email-error" : undefined}
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm"
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p id="forgot-email-error" className="mt-1 text-sm text-destructive">
                  {fieldErrors.email[0]}
                </p>
              )}
            </div>
            {message && (
              <div className="rounded-lg border-2 border-border bg-muted/30 px-4 py-3 text-sm">{message}</div>
            )}
            {error && (
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
