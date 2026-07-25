"use client";

import { useState } from "react";
import {
  registerUser,
  resendVerificationEmailAction,
} from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { MailCheck, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const result = await registerUser(null, formData);

    if (!result.success) {
      setError(result.error ?? "Registration failed");
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      setLoading(false);
      return;
    }

    setRegisteredEmail(formData.get("email") as string);
    setLoading(false);
  }

  async function handleResend() {
    if (!registeredEmail) return;
    setResending(true);
    setResendMessage(null);
    const formData = new FormData();
    formData.set("email", registeredEmail);
    const result = await resendVerificationEmailAction(null, formData);
    setResendMessage(
      result.success
        ? "If that account still needs verification, a new email has been sent."
        : result.error ?? "We could not send another verification email.",
    );
    setResending(false);
  }

  if (registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
        <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6 text-center shadow-brutal-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
            <MailCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            If that email can receive messages for a new or unverified account, we sent a verification link to{" "}
            <span className="font-medium text-foreground">{registeredEmail}</span>.
            You can sign in after verifying; posting and reporting require a verified email.
          </p>
          {resendMessage && (
            <div className="mt-4 rounded-lg border-2 border-border bg-muted/30 px-4 py-3 text-sm">
              {resendMessage}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={handleResend} disabled={resending}>
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
            <a
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
            >
              Go to sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join the forum to start discussions.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border bg-card p-6 shadow-brutal-sm">
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="your_username"
              />
              {fieldErrors.username && (
                <p id="username-error" className="mt-1 text-sm text-destructive">
                  {fieldErrors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium">
                Display name <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                maxLength={50}
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Your display name"
              />
            </div>

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
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-destructive">
                  {fieldErrors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Min. 8 characters"
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-destructive">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
