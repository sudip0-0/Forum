"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmailAction } from "@/server/auth/actions";

export function ResendVerificationForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    setFieldErrors({});
    const result = await resendVerificationEmailAction(null, formData);
    if (!result.success) {
      setError(result.error ?? "Unable to send verification email.");
      setFieldErrors(result.fieldErrors ?? {});
    } else {
      setMessage("If that account still needs verification, a new email has been sent.");
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-3 text-left">
      <div>
        <label htmlFor="resend-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="resend-email"
          name="email"
          type="email"
          required
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "resend-email-error" : undefined}
          className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm"
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <p id="resend-email-error" className="mt-1 text-sm text-destructive">
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
        {loading ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
