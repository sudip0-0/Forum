"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfToken, signIn } from "next-auth/react";
import { registerUser } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

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

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await getCsrfToken();
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please log in.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
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
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="your_username"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-destructive">
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
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-destructive">
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
                className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Min. 8 characters"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
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
