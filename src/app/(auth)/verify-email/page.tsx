import { MailCheck, MailWarning } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db/prisma";
import { verifyEmailToken } from "@/server/auth/email-verification";
import { ResendVerificationForm } from "./resend-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const copy = {
  request: {
    title: "Verify your email",
    body: "Enter your email address and we will send a verification link if the account still needs one.",
  },
  success: {
    title: "Email verified",
    body: "Your email address has been verified. You can now post and report content.",
  },
  expired: {
    title: "Verification link expired",
    body: "This verification link has expired. Request a new verification email below.",
  },
  invalid: {
    title: "Verification link invalid",
    body: "This verification link is invalid or has already been used.",
  },
  "already-verified": {
    title: "Email already verified",
    body: "This email address was already verified. You can continue using the forum.",
  },
} as const;

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const status = token ? await verifyEmailToken(db, token) : "request";
  const content = copy[status];
  const Icon = status === "success" || status === "already-verified" ? MailCheck : MailWarning;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
      <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6 text-center shadow-brutal-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{content.body}</p>
        {(status === "expired" || status === "invalid" || status === "request") && <ResendVerificationForm />}
        {(status === "success" || status === "already-verified") && (
          <div className="mt-6">
            <Link
              href="/forums"
              className="inline-flex min-h-11 items-center justify-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
            >
              Browse forums
            </Link>
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Go to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
