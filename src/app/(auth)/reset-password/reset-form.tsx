"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/server/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    formData.set("token", token);
    const result = await resetPasswordAction(null, formData);
    if (!result.success) {
      setError(result.error ?? "Unable to reset password.");
      setFieldErrors(result.fieldErrors ?? {});
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your password has been reset successfully.
        </p>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
        >
          Sign in with your new password
        </a>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm"
          placeholder="Min. 8 characters"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.password[0]}</p>
        )}
      </div>
      {error && (
        <div className="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
